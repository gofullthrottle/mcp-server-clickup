import { Env } from '../worker';

export class EncryptionService {
  private cryptoKey: CryptoKey | null = null;

  constructor(private env: Env) {}

  /**
   * Gets or creates the encryption key
   */
  private async getKey(): Promise<CryptoKey> {
    if (this.cryptoKey) {
      return this.cryptoKey;
    }

    // Derive key from environment secret
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.env.ENCRYPTION_KEY),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    // Use a fixed salt for deterministic key derivation
    // In production, you might want to use different salts per user
    const salt = encoder.encode('clickup-mcp-salt-v1');

    this.cryptoKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return this.cryptoKey;
  }

  /**
   * Encrypts a string value
   */
  async encrypt(plaintext: string): Promise<string> {
    const key = await this.getKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypts a string value
   */
  async decrypt(encryptedBase64: string): Promise<string> {
    const key = await this.getKey();
    
    // Convert from base64
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  }

  /**
   * Hashes a value for comparison (e.g., for API key verification)
   */
  async hash(value: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  /**
   * Generates a secure random token
   */
  generateToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validates that a value matches a hash
   */
  async validateHash(value: string, hash: string): Promise<boolean> {
    const valueHash = await this.hash(value);
    return valueHash === hash;
  }
}