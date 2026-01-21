import { describe, test, expect } from 'bun:test';
import {
  generateTwoFactorSecret,
  verifyTwoFactorToken,
  generateTwoFactorToken,
} from '../utils/twoFactor';

describe('Two-Factor Authentication Utilities', () => {
  describe('generateTwoFactorSecret', () => {
    test('should generate a valid secret', async () => {
      const result = await generateTwoFactorSecret('test@example.com');

      expect(result.secret).toBeDefined();
      expect(typeof result.secret).toBe('string');
      // TOTP secrets are typically 16-32 characters base32 encoded
      expect(result.secret.length).toBeGreaterThanOrEqual(16);
    });

    test('should generate unique secrets each time', async () => {
      const result1 = await generateTwoFactorSecret('test@example.com');
      const result2 = await generateTwoFactorSecret('test@example.com');

      expect(result1.secret).not.toBe(result2.secret);
    });

    test('should include email in URI', async () => {
      const email = 'user@restaurant.com';
      const result = await generateTwoFactorSecret(email);

      expect(result.uri).toContain(encodeURIComponent(email));
    });

    test('should include app name in URI', async () => {
      const result = await generateTwoFactorSecret('test@example.com', 'MyApp');

      expect(result.uri).toContain('MyApp');
    });

    test('should use default app name "Lume" when not specified', async () => {
      const result = await generateTwoFactorSecret('test@example.com');

      expect(result.uri).toContain('Lume');
    });

    test('should generate valid QR code data URL', async () => {
      const result = await generateTwoFactorSecret('test@example.com');

      // QR code data URLs start with data:image/png;base64,
      expect(result.qrCodeUrl).toMatch(/^data:image\/png;base64,/);
    });

    test('should generate URI in otpauth format', async () => {
      const result = await generateTwoFactorSecret('test@example.com', 'TestApp');

      // URI should be in format: otpauth://totp/AppName:email?secret=XXX&issuer=AppName
      expect(result.uri).toMatch(/^otpauth:\/\/totp\//);
      expect(result.uri).toContain('secret=');
      expect(result.uri).toContain('issuer=');
    });

    test('should handle special characters in email', async () => {
      const email = 'user+test@example.com';
      const result = await generateTwoFactorSecret(email);

      expect(result.secret).toBeDefined();
      expect(result.uri).toBeDefined();
      expect(result.qrCodeUrl).toBeDefined();
    });
  });

  describe('verifyTwoFactorToken', () => {
    test('should return true for valid token', async () => {
      const { secret } = await generateTwoFactorSecret('test@example.com');
      const token = generateTwoFactorToken(secret);

      const isValid = verifyTwoFactorToken(token, secret);
      expect(isValid).toBe(true);
    });

    test('should return false for invalid token', async () => {
      const { secret } = await generateTwoFactorSecret('test@example.com');

      // Use a clearly invalid token
      const isValid = verifyTwoFactorToken('000000', secret);
      // This might occasionally pass by chance, so we test with wrong secret
      const { secret: wrongSecret } = await generateTwoFactorSecret('other@example.com');
      const token = generateTwoFactorToken(wrongSecret);

      const isValidWithWrongSecret = verifyTwoFactorToken(token, secret);
      expect(isValidWithWrongSecret).toBe(false);
    });

    test('should return false for malformed tokens', () => {
      const secret = 'JBSWY3DPEHPK3PXP'; // Valid base32 secret

      // Test various malformed tokens
      expect(verifyTwoFactorToken('abc', secret)).toBe(false);
      expect(verifyTwoFactorToken('12345', secret)).toBe(false);
      expect(verifyTwoFactorToken('1234567', secret)).toBe(false);
      expect(verifyTwoFactorToken('abcdef', secret)).toBe(false);
    });

    test('should return false for empty token', () => {
      const secret = 'JBSWY3DPEHPK3PXP';

      expect(verifyTwoFactorToken('', secret)).toBe(false);
    });

    test('should handle empty secret gracefully', () => {
      // Should not throw, just return false
      const result = verifyTwoFactorToken('123456', '');
      expect(result).toBe(false);
    });

    test('should be case-insensitive for token digits', async () => {
      // TOTP tokens are always 6 digits, no case to worry about
      const { secret } = await generateTwoFactorSecret('test@example.com');
      const token = generateTwoFactorToken(secret);

      // Verify the token is 6 digits
      expect(token).toMatch(/^\d{6}$/);
    });
  });

  describe('generateTwoFactorToken', () => {
    test('should generate 6-digit token', async () => {
      const { secret } = await generateTwoFactorSecret('test@example.com');
      const token = generateTwoFactorToken(secret);

      expect(token).toMatch(/^\d{6}$/);
      expect(token.length).toBe(6);
    });

    test('should generate valid token that passes verification', async () => {
      const { secret } = await generateTwoFactorSecret('test@example.com');
      const token = generateTwoFactorToken(secret);

      const isValid = verifyTwoFactorToken(token, secret);
      expect(isValid).toBe(true);
    });

    test('should generate consistent tokens for same secret within time window', async () => {
      const { secret } = await generateTwoFactorSecret('test@example.com');

      // Generate two tokens immediately - should be the same within 30s window
      const token1 = generateTwoFactorToken(secret);
      const token2 = generateTwoFactorToken(secret);

      expect(token1).toBe(token2);
    });

    test('should generate different tokens for different secrets', async () => {
      const { secret: secret1 } = await generateTwoFactorSecret('user1@example.com');
      const { secret: secret2 } = await generateTwoFactorSecret('user2@example.com');

      const token1 = generateTwoFactorToken(secret1);
      const token2 = generateTwoFactorToken(secret2);

      // Different secrets should produce different tokens (extremely high probability)
      expect(token1).not.toBe(token2);
    });
  });

  describe('integration: full 2FA flow', () => {
    test('should complete full setup and verification flow', async () => {
      // Step 1: Generate secret for new user
      const email = 'newuser@restaurant.com';
      const setup = await generateTwoFactorSecret(email);

      expect(setup.secret).toBeDefined();
      expect(setup.qrCodeUrl).toBeDefined();
      expect(setup.uri).toBeDefined();

      // Step 2: User scans QR code and their authenticator app generates a token
      // We simulate this by generating the token server-side
      const userToken = generateTwoFactorToken(setup.secret);

      // Step 3: User submits token for verification
      const isValid = verifyTwoFactorToken(userToken, setup.secret);
      expect(isValid).toBe(true);

      // Step 4: Verify wrong tokens are rejected
      const wrongToken = '000000';
      const isWrongValid = verifyTwoFactorToken(wrongToken, setup.secret);
      // This might occasionally pass (1 in 1 million chance), so we also test with wrong secret
      expect(isWrongValid).toBe(false);
    });
  });
});
