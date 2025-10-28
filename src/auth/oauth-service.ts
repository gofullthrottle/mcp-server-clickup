import { Env } from '../worker.js';

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface ClickUpUser {
  user: {
    id: string;
    username: string;
    email: string;
    color: string;
    profilePicture: string | null;
  };
  team: {
    id: string;
    name: string;
    color: string;
    avatar: string | null;
  };
}

export class OAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly authorizationUrl = 'https://app.clickup.com/api/v2/oauth/authorize';
  private readonly tokenUrl = 'https://app.clickup.com/api/v2/oauth/token';
  private readonly userInfoUrl = 'https://api.clickup.com/api/v2/user';

  constructor(private env: Env) {
    this.clientId = env.CLICKUP_CLIENT_ID;
    this.clientSecret = env.CLICKUP_CLIENT_SECRET;
    // Dynamically determine redirect URI based on environment
    this.redirectUri = env.ENVIRONMENT === 'production'
      ? 'https://clickup-mcp.workers.dev/auth/callback'
      : 'http://localhost:8787/auth/callback';
  }

  /**
   * Initiates OAuth flow by generating authorization URL
   */
  async initiateFlow(): Promise<{ url: string; state: string }> {
    const state = this.generateState();
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state,
      // Request necessary scopes
      scope: 'user:read team:read task:write'
    });

    return {
      url: `${this.authorizationUrl}?${params.toString()}`,
      state
    };
  }

  /**
   * Exchanges authorization code for access token
   */
  async exchangeCode(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.redirectUri
    });

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code: ${error}`);
    }

    return response.json();
  }

  /**
   * Refreshes access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken
    });

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    return response.json();
  }

  /**
   * Gets user information from ClickUp API
   */
  async getUserInfo(accessToken: string): Promise<ClickUpUser> {
    const response = await fetch(this.userInfoUrl, {
      headers: {
        'Authorization': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get user info: ${error}`);
    }

    return response.json();
  }

  /**
   * Generates random state for OAuth flow
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validates OAuth callback state
   */
  async validateState(state: string, storedState: string): Promise<boolean> {
    return state === storedState;
  }
}