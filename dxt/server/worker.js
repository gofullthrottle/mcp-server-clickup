/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { SignJWT, jwtVerify } from 'jose';
import Stripe from 'stripe';
import { MCPServer } from './mcp-worker-server.js';
import { OAuthService } from './auth/oauth-service.js';
import { UserService } from './services/user-service.js';
import { EncryptionService } from './security/encryption.js';
import { RateLimiter } from './middleware/rate-limit.js';
import { AuditLogger } from './security/audit.js';
const app = new Hono();
// CORS configuration
app.use('*', cors({
    origin: (origin) => origin, // Allow all origins for MCP clients
    allowHeaders: ['Content-Type', 'Authorization', 'X-MCP-Version'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));
// Health check endpoint
app.get('/health', async (c) => {
    return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: c.env.ENVIRONMENT,
        version: '1.0.0'
    });
});
// OAuth endpoints
app.get('/auth/login', async (c) => {
    const oauth = new OAuthService(c.env);
    const { url, state } = await oauth.initiateFlow();
    // Store state in KV for verification
    await c.env.USER_SESSIONS.put(`oauth_state:${state}`, JSON.stringify({
        created: Date.now(),
        ip: c.req.header('CF-Connecting-IP') || 'unknown'
    }), { expirationTtl: 600 }); // 10 minute expiry
    return c.redirect(url);
});
app.get('/auth/callback', async (c) => {
    const code = c.req.query('code');
    const state = c.req.query('state');
    if (!code || !state) {
        throw new HTTPException(400, { message: 'Missing code or state' });
    }
    // Verify state
    const storedState = await c.env.USER_SESSIONS.get(`oauth_state:${state}`);
    if (!storedState) {
        throw new HTTPException(400, { message: 'Invalid or expired state' });
    }
    // Exchange code for tokens
    const oauth = new OAuthService(c.env);
    const tokens = await oauth.exchangeCode(code);
    // Get user info from ClickUp
    const userInfo = await oauth.getUserInfo(tokens.access_token);
    // Create JWT session
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const jwt = await new SignJWT({
        sub: userInfo.user.id,
        email: userInfo.user.email,
        name: userInfo.user.username,
        team_id: userInfo.team.id
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);
    // Store user mapping
    const userService = new UserService(c.env);
    await userService.createOrUpdateUser({
        id: userInfo.user.id,
        email: userInfo.user.email,
        name: userInfo.user.username,
        team_id: userInfo.team.id,
        created_at: Date.now(),
        subscription_tier: 'free' // Default to free tier
    });
    // Clean up state
    await c.env.USER_SESSIONS.delete(`oauth_state:${state}`);
    // Return success page with JWT
    return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authentication Successful</title>
        <style>
          body { font-family: system-ui; padding: 2rem; max-width: 600px; margin: 0 auto; }
          .token-box { 
            background: #f3f4f6; 
            padding: 1rem; 
            border-radius: 0.5rem; 
            word-break: break-all;
            margin: 1rem 0;
          }
          .copy-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 0.25rem;
            cursor: pointer;
          }
          .copy-btn:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <h1>✅ Authentication Successful</h1>
        <p>You've successfully connected your ClickUp account!</p>
        
        <h2>Next Steps:</h2>
        <ol>
          <li>Store your ClickUp API key securely</li>
          <li>Configure your MCP client with the endpoint</li>
          <li>Use the session token below for authentication</li>
        </ol>
        
        <h3>Your Session Token:</h3>
        <div class="token-box" id="token">${jwt}</div>
        <button class="copy-btn" onclick="copyToken()">Copy Token</button>
        
        <h3>MCP Endpoint:</h3>
        <div class="token-box">${new URL(c.req.url).origin}/mcp</div>
        
        <script>
          function copyToken() {
            navigator.clipboard.writeText(document.getElementById('token').innerText);
            alert('Token copied to clipboard!');
          }
        </script>
      </body>
    </html>
  `);
});
// API key management endpoint
app.post('/auth/api-key', async (c) => {
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer ')) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }
    const token = auth.substring(7);
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    try {
        const { payload } = await jwtVerify(token, secret);
        const { api_key, team_id } = await c.req.json();
        if (!api_key || !team_id) {
            throw new HTTPException(400, { message: 'Missing api_key or team_id' });
        }
        // Encrypt and store API key
        const encryption = new EncryptionService(c.env);
        const encryptedKey = await encryption.encrypt(api_key);
        await c.env.API_KEYS.put(`user:${payload.sub}:api_key`, encryptedKey, { metadata: { team_id } });
        // Update user record
        const userService = new UserService(c.env);
        await userService.updateUserConfig(payload.sub, {
            has_api_key: true,
            team_id,
            api_key_updated: Date.now()
        });
        // Audit log
        if (c.env.ENABLE_AUDIT_LOGGING === 'true') {
            const audit = new AuditLogger(c.env);
            await audit.logAction(payload.sub, {
                action: 'api_key_stored',
                timestamp: Date.now(),
                ip: c.req.header('CF-Connecting-IP') || 'unknown'
            });
        }
        return c.json({ success: true, message: 'API key stored successfully' });
    }
    catch (error) {
        throw new HTTPException(401, { message: 'Invalid token' });
    }
});
// Stripe webhook endpoint
app.post('/stripe/webhook', async (c) => {
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
    const signature = c.req.header('stripe-signature');
    if (!signature) {
        throw new HTTPException(400, { message: 'Missing stripe signature' });
    }
    const body = await c.req.text();
    try {
        const event = stripe.webhooks.constructEvent(body, signature, c.env.STRIPE_WEBHOOK_SECRET);
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.user_id;
                if (userId) {
                    // Update user to premium tier
                    const userService = new UserService(c.env);
                    await userService.updateUserConfig(userId, {
                        subscription_tier: 'premium',
                        stripe_customer_id: session.customer,
                        subscription_updated: Date.now()
                    });
                    // Store Stripe customer mapping
                    await c.env.STRIPE_CUSTOMERS.put(`stripe:${session.customer}`, userId);
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const userId = await c.env.STRIPE_CUSTOMERS.get(`stripe:${subscription.customer}`);
                if (userId) {
                    // Downgrade to free tier
                    const userService = new UserService(c.env);
                    await userService.updateUserConfig(userId, {
                        subscription_tier: 'free',
                        subscription_updated: Date.now()
                    });
                }
                break;
            }
        }
        return c.json({ received: true });
    }
    catch (error) {
        throw new HTTPException(400, { message: 'Invalid webhook signature' });
    }
});
// Create Stripe checkout session
app.post('/stripe/create-checkout', async (c) => {
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer ')) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }
    const token = auth.substring(7);
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    try {
        const { payload } = await jwtVerify(token, secret);
        const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                    price: c.env.STRIPE_PRICE_ID,
                    quantity: 1,
                }],
            mode: 'subscription',
            success_url: `${new URL(c.req.url).origin}/subscription/success`,
            cancel_url: `${new URL(c.req.url).origin}/subscription/cancel`,
            metadata: {
                user_id: payload.sub,
            },
        });
        return c.json({ checkout_url: session.url });
    }
    catch (error) {
        throw new HTTPException(500, { message: 'Failed to create checkout session' });
    }
});
// Main MCP endpoint
app.post('/mcp', async (c) => {
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer ')) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }
    const token = auth.substring(7);
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    try {
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.sub;
        // Rate limiting
        if (c.env.ENABLE_RATE_LIMITING === 'true') {
            const rateLimiter = new RateLimiter(c.env);
            const allowed = await rateLimiter.checkLimit(userId, 'mcp_request');
            if (!allowed) {
                throw new HTTPException(429, { message: 'Rate limit exceeded' });
            }
        }
        // Get user config and API key
        const userService = new UserService(c.env);
        const user = await userService.getUser(userId);
        if (!user || !user.has_api_key) {
            throw new HTTPException(400, {
                message: 'Please configure your ClickUp API key first'
            });
        }
        // Decrypt API key
        const encryption = new EncryptionService(c.env);
        const encryptedKey = await c.env.API_KEYS.get(`user:${userId}:api_key`);
        if (!encryptedKey) {
            throw new HTTPException(400, {
                message: 'API key not found. Please reconfigure.'
            });
        }
        const apiKey = await encryption.decrypt(encryptedKey);
        // Get tool configuration based on subscription tier
        const freeTierTools = c.env.FREE_TIER_TOOLS?.split(',') || [];
        const premiumTierTools = c.env.PREMIUM_TIER_TOOLS?.split(',') || [];
        const availableTools = user.subscription_tier === 'premium'
            ? [...freeTierTools, ...premiumTierTools]
            : freeTierTools;
        // Initialize MCP server with user's API key and available tools
        const mcpServer = new MCPServer(c.env, {
            apiKey,
            teamId: user.team_id,
            userId,
            availableTools,
            subscriptionTier: user.subscription_tier
        });
        // Process MCP request
        const request = await c.req.json();
        const response = await mcpServer.handleRequest(request);
        // Audit logging
        if (c.env.ENABLE_AUDIT_LOGGING === 'true') {
            const audit = new AuditLogger(c.env);
            await audit.logAction(userId, {
                action: 'mcp_request',
                method: request.method,
                timestamp: Date.now(),
                ip: c.req.header('CF-Connecting-IP') || 'unknown'
            });
        }
        return c.json(response);
    }
    catch (error) {
        if (error instanceof HTTPException) {
            throw error;
        }
        throw new HTTPException(500, { message: 'Internal server error' });
    }
});
// Server-Sent Events endpoint for streaming
app.get('/mcp/sse', async (c) => {
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer ')) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }
    // Set up SSE headers
    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');
    // Similar auth and setup as /mcp endpoint...
    // Stream implementation here
    return c.body(''); // Placeholder for SSE implementation
});
// Error handling
app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return c.json({ error: err.message }, err.status);
    }
    console.error('Unhandled error:', err);
    return c.json({ error: 'Internal server error' }, 500);
});
export default app;
