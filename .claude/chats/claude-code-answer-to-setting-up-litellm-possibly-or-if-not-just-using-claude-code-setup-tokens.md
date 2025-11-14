# Claude Code `setup-token` Analysis

## ❌ Short Answer: No, You Cannot Use Both Simultaneously

The `claude setup-token` command and LiteLLM proxy configuration are **mutually exclusive**. You must choose one authentication/endpoint strategy per Claude Code instance:

- **`setup-token`** → Authenticates with **Anthropic's official API endpoints**
- **LiteLLM** → Requires **`ANTHROPIC_BASE_URL`** pointing to **your LiteLLM proxy**

## 🔍 What `claude setup-token` Actually Does

The `setup-token` command generates a **long-lived OAuth token** (format: `sk-ant-oat01-...`) that enables:

1. **Headless/non-interactive authentication** for Claude Code Max subscription
2. **CI/CD integration** (GitHub Actions, Docker, remote servers)
3. **Programmatic access** without browser-based OAuth flows
4. **Leveraging your Claude Max subscription benefits** in automated environments

The token is stored as the `CLAUDE_CODE_OAUTH_TOKEN` environment variable.

---

## 🎯 When to Use `setup-token`

### Primary Use Cases

| Scenario | Benefit |
|----------|---------|
| **GitHub Actions/CI/CD** | Automated workflows without interactive login |
| **Docker Containers** | Headless environments needing authentication |
| **Remote/Server Deployments** | Claude Code on VMs without browser access |
| **Team/Shared Environments** | Long-lived tokens that don't expire frequently |
| **Script Automation** | Programmatic access to Claude Max features |

### Why Use It Over API Keys?

- ✅ **No separate API costs** - Uses your Claude Max subscription ($100-$200/month)
- ✅ **Higher usage limits** - Max 5x (~225 messages/5hrs) or Max 20x (significantly more)
- ✅ **OAuth security** - More secure than static API keys
- ✅ **Automatic model switching** - Falls back from Opus 4 → Sonnet 4 to prevent hitting limits
- ✅ **Unified subscription** - Same plan for Claude desktop, mobile, and Claude Code

---

## 🚀 Advanced Strategies for Maximizing Claude Code

### Strategy 1: **Contextual Configuration Switching**

Use different configurations for different workflows:

```bash
# ~/.bashrc or ~/.zshrc

# Claude Max subscription for interactive work
alias claude-max='unset ANTHROPIC_BASE_URL ANTHROPIC_AUTH_TOKEN && export CLAUDE_CODE_OAUTH_TOKEN="sk-ant-oat01-..."'

# LiteLLM proxy for cost-controlled batch processing
alias claude-litellm='unset CLAUDE_CODE_OAUTH_TOKEN && export ANTHROPIC_BASE_URL="http://localhost:4000" ANTHROPIC_AUTH_TOKEN="your-litellm-key"'

# Usage:
# claude-max    # Switch to Max subscription
# claude-litellm # Switch to LiteLLM proxy
# claude ...    # Run Claude Code with active config
```

### Strategy 2: **Hybrid Environment Setup**

Separate environments for different use cases:

```bash
# Development environment (cost control with LiteLLM)
# .env.development
ANTHROPIC_BASE_URL=http://localhost:4000
ANTHROPIC_AUTH_TOKEN=sk-litellm-xxx

# Production/CI environment (Max subscription)
# .env.production
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-xxx
```

### Strategy 3: **GitHub Actions with Max Subscription**

Set up CI/CD using your Claude Max subscription:

```yaml
# .github/workflows/claude-code.yml
name: Claude Code CI

on: [push, pull_request]

jobs:
  claude-code-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Claude Code
        run: |
          curl -fsSL https://api.claude.com/install.sh | sh
      
      - name: Run Claude Code Analysis
        env:
          CLAUDE_CODE_OAUTH_TOKEN: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
        run: |
          claude analyze --files "src/**/*.ts"
```

**Setup:**
```bash
# 1. Generate token
claude setup-token

# 2. Copy the token (sk-ant-oat01-...)
# 3. Add to GitHub Secrets as CLAUDE_CODE_OAUTH_TOKEN
```

### Strategy 4: **Docker Container with Max Subscription**

Run Claude Code in containers using your subscription:

```dockerfile
# Dockerfile
FROM node:20-slim

# Install Claude Code
RUN curl -fsSL https://api.claude.com/install.sh | sh

# Copy your project
WORKDIR /workspace
COPY . .

# Use OAuth token from environment
ENV CLAUDE_CODE_OAUTH_TOKEN=${CLAUDE_CODE_OAUTH_TOKEN}

CMD ["claude", "analyze", "--watch"]
```

```bash
# Run container
docker run --rm -it \
  -e CLAUDE_CODE_OAUTH_TOKEN="sk-ant-oat01-..." \
  -v $(pwd):/workspace \
  claude-code-container
```

### Strategy 5: **Cost Optimization Decision Tree**

```
┌─────────────────────────────────┐
│   What type of work?            │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼─────┐
│Interactive│    │Batch/Auto│
│  Work    │    │  mation  │
└───┬──────┘    └────┬─────┘
    │                │
    │           ┌────▼─────────┐
    │           │High volume?  │
    │           └────┬─────┬───┘
    │             YES│     │NO
    │                │     │
    │           ┌────▼─┐  ┌▼────────┐
    │           │ Max  │  │LiteLLM  │
    │           │(20x) │  │(cost    │
    │           │      │  │control) │
    │           └──────┘  └─────────┘
    │
┌───▼─────────┐
│   Max Plan  │
│ (20x usage) │
└─────────────┘
```

**Decision Guide:**
- **Interactive coding sessions** → Use Max subscription (20x usage limit)
- **High-volume automation** → Use Max subscription (no API costs)
- **Low-volume automation with model routing needs** → Use LiteLLM
- **Multi-model experimentation** → Use LiteLLM
- **Cost-sensitive batch processing** → Use LiteLLM with rate limits

---

## 📋 Setup Instructions for `setup-token`

### Step 1: Generate OAuth Token

```bash
# Run the setup command
claude setup-token

# Follow prompts to authenticate
# Token will be displayed (format: sk-ant-oat01-...)
```

### Step 2: Store Token Securely

**For Local Development:**
```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc)
export CLAUDE_CODE_OAUTH_TOKEN="sk-ant-oat01-YOUR_TOKEN_HERE"

# Reload shell
source ~/.bashrc  # or ~/.zshrc
```

**For GitHub Actions:**
1. Go to Repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `CLAUDE_CODE_OAUTH_TOKEN`
4. Value: Your token (sk-ant-oat01-...)

**For Docker:**
```bash
# Create .env file (add to .gitignore!)
echo "CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-..." > .env

# Use with docker-compose
docker-compose --env-file .env up
```

### Step 3: Verify Authentication

```bash
# Test that authentication works
claude --help

# Should show available commands without prompting for login
```

---

## ⚠️ Important Considerations

### Known Issues (as of 2025)
- Some users report that `CLAUDE_CODE_OAUTH_TOKEN` doesn't always work in fresh containers
- May still prompt for authentication in certain environments
- Fallback: Use `ANTHROPIC_API_KEY` if OAuth token fails

### Security Best Practices
- **Never commit tokens to git** - Add to `.gitignore`
- **Use GitHub Secrets** for CI/CD
- **Rotate tokens periodically** - Regenerate if compromised
- **Limit token scope** - Only use in trusted environments

### Usage Limits (Claude Max Plan)
- **Max 5x**: ~225 messages every 5 hours ($100/month)
- **Max 20x**: Significantly higher capacity ($200/month)
- **Shared across**: Web, desktop, mobile, and Claude Code
- **Resets**: Every 5 hours

---

## 🎓 Recommended Approach for Your Setup

Given you have **Claude Code Max Plan** and **LiteLLM instance**:

### Primary Workflow
```bash
# Default: Use Claude Max subscription for daily work
export CLAUDE_CODE_OAUTH_TOKEN="sk-ant-oat01-..."

# 20x usage limit >> most LiteLLM free quotas
# No per-request API costs
# Access to latest Opus 4 and Sonnet 4
```

### When to Switch to LiteLLM
```bash
# Switch to LiteLLM when you need:
# - Custom model routing (fallbacks, load balancing)
# - Cost tracking and budgets
# - Custom prompt caching strategies
# - Integration with other LLM providers

claude-litellm  # Use the alias from Strategy 1
```

### Best of Both Worlds
- **80% of work**: Use Max subscription via `setup-token`
- **20% of work**: Use LiteLLM for specialized needs
- **CI/CD**: Use `setup-token` in GitHub Actions (free with subscription)
- **Experimentation**: Use LiteLLM for model testing/comparison

---

## 📚 Additional Resources

- **Claude Code Max Plans**: https://www.claude.com/pricing/max
- **LiteLLM Gateway Configuration**: https://docs.claude.com/en/docs/claude-code/llm-gateway
- **GitHub Actions Integration**: https://github.com/marketplace/actions/claude-code-action-with-oauth
- **IAM Documentation**: https://docs.claude.com/en/docs/claude-code/iam

---

# 🔄 Follow-Up: Can I Use LiteLLM as a Proxy While Keeping My Max Plan Authentication?

## Question

Can I use LiteLLM by choice (as a unified endpoint for tracking, callbacks, personal prompt and model testing) with my own LiteLLM server by changing `ANTHROPIC_BASE_URL`, **but still** use my Claude Code Max Plan for authentication?

I understand the distinction between `ANTHROPIC_AUTH_TOKEN` and `CLAUDE_CODE_OAUTH_TOKEN`, but I'm confused about whether LiteLLM can act as a transparent proxy that forwards my OAuth token to Anthropic while providing its own logging and callback features.

I'm not looking to use LiteLLM for cost savings (since I'm on the Max Plan), but I'd like experience with LiteLLM for learning purposes while primarily using Claude Code with my Max Plan subscription for desktop development and devcontainers.

## 🎯 TL;DR Answer

**Theoretically possible but NOT officially supported** as of 2024. LiteLLM's OAuth token pass-through for Anthropic is a requested feature (GitHub issue #13380) but not yet implemented. You can attempt an experimental configuration, but there's no guarantee your Max Plan benefits will be preserved.

---

## 🔍 Understanding the Authentication Architecture

### Token Types Clarification

| Token Type | Format | Purpose | Authentication Target |
|-----------|--------|---------|----------------------|
| `CLAUDE_CODE_OAUTH_TOKEN` | `sk-ant-oat01-...` | Claude Code Max subscription authentication | Anthropic API (direct) |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Pay-per-use API access | Anthropic API (pay-as-you-go) |
| `ANTHROPIC_AUTH_TOKEN` | Either of above | Generic auth variable (can hold either type) | Depends on token type |

The confusion: `ANTHROPIC_AUTH_TOKEN` is just a **variable name** used by some SDKs. What matters is the **token value** you put in it.

### LiteLLM Proxy Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Standard LiteLLM Flow                   │
└─────────────────────────────────────────────────────────────┘

Claude Code → LiteLLM Proxy → Anthropic API
    ↓              ↓                ↓
Sends master   Stores provider   Receives API key
  key          API keys in        from LiteLLM config
               config.yaml

⚠️  Your OAuth token is NOT used - LiteLLM uses its own API key!


┌─────────────────────────────────────────────────────────────┐
│              What You Want (Pass-through Mode)              │
└─────────────────────────────────────────────────────────────┘

Claude Code → LiteLLM Proxy → Anthropic API
    ↓              ↓                ↓
Sends OAuth    Forwards OAuth   Receives OAuth token
  token         token            (Max Plan benefits preserved)
               (logging/callbacks
                happen here)

✅  This would preserve Max Plan - but it's experimental!
```

---

## 🧪 Experimental Configuration to Try

### LiteLLM Configuration (config.yaml)

```yaml
model_list:
  - model_name: claude-sonnet-4
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20241022
      # NO api_key specified here - forces pass-through from client

general_settings:
  master_key: your-litellm-master-key  # Optional for multi-user setups

# Enable pass-through mode for Anthropic
router_settings:
  enable_pass_through: true
```

### Claude Code Environment Setup

```bash
# Point Claude Code at LiteLLM's Anthropic pass-through endpoint
export ANTHROPIC_BASE_URL="http://localhost:4000/anthropic"

# Use your Max Plan OAuth token
export CLAUDE_CODE_OAUTH_TOKEN="sk-ant-oat01-YOUR_OAUTH_TOKEN"

# Start LiteLLM proxy
litellm --config config.yaml --port 4000

# Test with Claude Code
claude "test prompt"
```

### Testing the Configuration

```bash
# 1. Verify LiteLLM is running
curl http://localhost:4000/health

# 2. Test authentication pass-through
curl -X POST http://localhost:4000/anthropic/v1/messages \
  -H "Authorization: Bearer sk-ant-oat01-YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# If you get a valid response, pass-through is working!
```

---

## ⚠️ Risks and Limitations

### Known Issues (2024)

1. **Not Officially Supported**
   - OAuth pass-through is a GitHub feature request (#13380)
   - No guarantees it will work or continue working
   - LiteLLM team hasn't committed to supporting this pattern

2. **Potential Loss of Max Plan Benefits**
   - If LiteLLM can't properly forward OAuth tokens:
     - You'll hit API rate limits instead of Max 20x limits
     - You might get charged API costs instead of using subscription
     - Automatic Opus 4 → Sonnet 4 fallback might not work

3. **Authentication Errors**
   - Claude Code might not recognize response format from LiteLLM
   - Session management issues (OAuth tokens expire, need refresh)
   - LiteLLM might not handle OAuth token refresh flow

4. **Debugging Complexity**
   - Hard to determine if issues are from LiteLLM, Claude Code, or Anthropic
   - Error messages might be obscured by proxy layer

### What You'll Lose vs. Gain

| Aspect | Direct Max Plan | LiteLLM Proxy (Experimental) |
|--------|----------------|------------------------------|
| **Rate Limits** | 20x guaranteed | Unknown - might default to API limits |
| **Costs** | $200/month fixed | Unknown - might incur API charges |
| **Model Fallback** | Automatic (Opus 4 → Sonnet 4) | Unknown |
| **Logging** | Basic | ✅ Advanced (callbacks, traces) |
| **Multi-Model Testing** | Anthropic only | ✅ Can route to multiple providers |
| **Cost Tracking** | N/A | ✅ Granular usage analytics |
| **Support** | ✅ Official Claude Code support | ❌ Community only |

---

## 🎓 Recommended Hybrid Approach

Given your goals (learning LiteLLM, keeping Max Plan for primary work), use a **contextual configuration switching** strategy:

### Setup 1: Primary Workflow (95% of time)

```bash
# ~/.bashrc or ~/.zshrc

# Alias for Claude Max (no LiteLLM)
alias claude-max='
  unset ANTHROPIC_BASE_URL
  export CLAUDE_CODE_OAUTH_TOKEN="sk-ant-oat01-YOUR_TOKEN"
  echo "🚀 Claude Code Max Plan Active (20x rate limits)"
'

# Use this for:
# - All production work
# - High-volume coding sessions
# - When you need guaranteed Max benefits
```

### Setup 2: LiteLLM Experimentation (5% of time)

```bash
# Alias for LiteLLM pass-through (experimental)
alias claude-litellm='
  export ANTHROPIC_BASE_URL="http://localhost:4000/anthropic"
  export CLAUDE_CODE_OAUTH_TOKEN="sk-ant-oat01-YOUR_TOKEN"
  echo "🧪 LiteLLM Pass-through Mode (Experimental)"
  echo "⚠️  Check if Max Plan benefits are active!"
'

# Use this for:
# - Learning LiteLLM features (callbacks, logging)
# - Testing custom prompts with tracking
# - Multi-model experimentation (add OpenAI, etc.)
# - Non-critical work where you can afford failures
```

### Setup 3: LiteLLM with API Key (Fallback)

```bash
# Alias for LiteLLM with dedicated API key (if pass-through fails)
alias claude-litellm-api='
  unset CLAUDE_CODE_OAUTH_TOKEN
  export ANTHROPIC_BASE_URL="http://localhost:4000"
  export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-YOUR_API_KEY"
  echo "💰 LiteLLM with API Key (Pay-per-use)"
  echo "⚠️  You will be charged for usage!"
'

# Use this for:
# - LiteLLM learning when OAuth pass-through fails
# - Testing LiteLLM features that require API key in config
# - Low-volume experiments where cost is acceptable
```

### Quick Switch Commands

```bash
# Switch between modes quickly
claude-max        # Switch to Max Plan (default)
claude-litellm    # Switch to LiteLLM pass-through (experimental)
claude-litellm-api # Switch to LiteLLM with API key (fallback)

# Then run Claude Code as normal
claude "your prompt here"
```

---

## 🧰 Validation Checklist

Before relying on LiteLLM pass-through, verify these:

### 1. OAuth Token Pass-Through Works
```bash
# Check if LiteLLM forwards your OAuth token correctly
export ANTHROPIC_BASE_URL="http://localhost:4000/anthropic"
claude "test prompt"

# Look for success without API key errors
```

### 2. Max Plan Benefits Are Preserved
```bash
# Test rate limits - send 100 requests quickly
for i in {1..100}; do
  claude "test $i" &
done

# If no rate limit errors → Max Plan benefits preserved ✅
# If rate limit errors → Falling back to API limits ❌
```

### 3. Session Management Works
```bash
# Wait for token to expire (24 hours)
# Check if LiteLLM handles refresh flow

# If it prompts for re-auth → Manual refresh needed ❌
# If it auto-refreshes → Session management works ✅
```

### 4. Logging/Callbacks Work
```bash
# Check LiteLLM logs show your requests
tail -f ~/.litellm/logs/*.log

# Verify callbacks are triggered
# Check cost tracking dashboard
```

---

## 🎯 When to Use Each Approach

### Use Direct Max Plan When:
- ✅ You need guaranteed 20x rate limits
- ✅ Doing high-volume development work
- ✅ Working on critical projects
- ✅ You want automatic model fallbacks
- ✅ You need official Claude Code support

### Use LiteLLM Pass-through (Experimental) When:
- ✅ Learning LiteLLM features (your stated goal!)
- ✅ Testing prompt engineering with detailed logging
- ✅ Experimenting with custom callbacks
- ✅ Comparing Anthropic vs. other providers
- ✅ Non-critical development work
- ✅ You're prepared to fall back to direct Max Plan if issues arise

### Use LiteLLM with API Key When:
- ✅ OAuth pass-through doesn't work
- ✅ You need LiteLLM features + accept API costs
- ✅ Low-volume experiments
- ✅ Testing LiteLLM configurations

---

## 🔬 Learning Path Recommendation

Since your goal is to **gain LiteLLM experience** while **keeping Max Plan for primary work**:

### Week 1: Setup and Validation
1. Set up LiteLLM proxy with pass-through config
2. Test OAuth token forwarding with simple prompts
3. Validate Max Plan benefits are preserved (rate limit testing)
4. Set up all three aliases (max, litellm, litellm-api)

### Week 2-4: Feature Exploration
1. **Logging**: Configure detailed request/response logging
2. **Callbacks**: Set up custom callbacks (Slack notifications, metrics)
3. **Cost Tracking**: Monitor usage patterns via LiteLLM dashboard
4. **Multi-Model**: Add OpenAI/Gemini for comparison

### Ongoing: Hybrid Usage
- **Daily work**: Use `claude-max` (95% of time)
- **Learning sessions**: Use `claude-litellm` (5% of time)
- **Document findings**: Keep notes on what works/doesn't work

---

## 📚 Additional Resources

- **LiteLLM Anthropic Pass-through Docs**: https://docs.litellm.ai/docs/pass_through/anthropic_completion
- **OAuth Pass-through Feature Request**: https://github.com/BerriAI/litellm/issues/13380
- **LiteLLM Proxy Configuration**: https://docs.litellm.ai/docs/proxy/configs
- **Claude Code LiteLLM Integration Guide**: https://medium.com/@niklas-palm/claude-code-with-litellm-24b3fb115911

---

## 🎬 Conclusion

**Can you use LiteLLM as a proxy while keeping Max Plan authentication?**

**Experimental "Yes"** - with caveats:

1. **Configure LiteLLM** in pass-through mode (no API keys in config)
2. **Point Claude Code** at `http://localhost:4000/anthropic`
3. **Use your OAuth token** via `CLAUDE_CODE_OAUTH_TOKEN`
4. **Test thoroughly** to ensure Max Plan benefits are preserved
5. **Be prepared to fall back** to direct Max Plan if issues arise

This gives you the learning experience you want with LiteLLM while maintaining your Max Plan as the reliable primary workflow. The key is treating LiteLLM as an **experimental learning tool** rather than your primary authentication method.

**Start with `claude-max` for all real work, experiment with `claude-litellm` for learning, and document what you discover!**
