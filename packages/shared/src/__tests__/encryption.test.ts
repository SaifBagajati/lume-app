import { describe, test, expect, beforeAll } from 'bun:test';
import { encryptToken, decryptToken } from '../utils/encryption';

describe('Encryption Utilities', () => {
  beforeAll(() => {
    // Ensure encryption key is set for tests
    process.env.POS_ENCRYPTION_KEY = 'YOGQLOY8aq1GSosunoKeX7zkOkbGnbF8';
  });

  describe('encryptToken', () => {
    test('should encrypt a token and return formatted string', () => {
      const token = 'test-access-token-12345';
      const encrypted = encryptToken(token);

      // Should be in format: iv:authTag:encryptedData
      const parts = encrypted.split(':');
      expect(parts.length).toBe(3);

      // IV should be 32 hex chars (16 bytes)
      expect(parts[0].length).toBe(32);

      // Auth tag should be 32 hex chars (16 bytes)
      expect(parts[1].length).toBe(32);

      // Encrypted data should exist
      expect(parts[2].length).toBeGreaterThan(0);
    });

    test('should produce different ciphertext for same input (due to random IV)', () => {
      const token = 'test-token';
      const encrypted1 = encryptToken(token);
      const encrypted2 = encryptToken(token);

      // IVs should be different
      expect(encrypted1).not.toBe(encrypted2);
    });

    test('should handle empty string', () => {
      const encrypted = encryptToken('');
      expect(encrypted).toBeDefined();
      const parts = encrypted.split(':');
      expect(parts.length).toBe(3);
    });

    test('should handle long tokens', () => {
      const longToken = 'a'.repeat(1000);
      const encrypted = encryptToken(longToken);
      expect(encrypted).toBeDefined();
    });

    test('should handle special characters', () => {
      const token = 'token!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const encrypted = encryptToken(token);
      expect(encrypted).toBeDefined();
    });
  });

  describe('decryptToken', () => {
    test('should decrypt an encrypted token correctly', () => {
      const originalToken = 'my-secret-access-token';
      const encrypted = encryptToken(originalToken);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(originalToken);
    });

    test('should handle empty string encryption/decryption', () => {
      const encrypted = encryptToken('');
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe('');
    });

    test('should handle unicode characters', () => {
      const token = 'token-with-unicode-émojis-🔐';
      const encrypted = encryptToken(token);
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(token);
    });

    test('should throw error for invalid format (missing parts)', () => {
      expect(() => decryptToken('invalid-token')).toThrow('Invalid encrypted token format');
    });

    test('should throw error for invalid format (only two parts)', () => {
      expect(() => decryptToken('part1:part2')).toThrow('Invalid encrypted token format');
    });

    test('should throw error for tampered ciphertext', () => {
      const encrypted = encryptToken('test-token');
      const parts = encrypted.split(':');
      // Tamper with the encrypted data
      const tampered = `${parts[0]}:${parts[1]}:aaaa${parts[2].substring(4)}`;

      expect(() => decryptToken(tampered)).toThrow();
    });

    test('should throw error for tampered auth tag', () => {
      const encrypted = encryptToken('test-token');
      const parts = encrypted.split(':');
      // Tamper with the auth tag
      const tampered = `${parts[0]}:${'0'.repeat(32)}:${parts[2]}`;

      expect(() => decryptToken(tampered)).toThrow();
    });
  });

  describe('round-trip encryption', () => {
    test('should correctly round-trip various tokens', () => {
      const tokens = [
        'simple-token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
        JSON.stringify({ access_token: 'abc123', refresh_token: 'xyz789' }),
        '12345678901234567890123456789012345678901234567890',
      ];

      for (const token of tokens) {
        const encrypted = encryptToken(token);
        const decrypted = decryptToken(encrypted);
        expect(decrypted).toBe(token);
      }
    });
  });
});
