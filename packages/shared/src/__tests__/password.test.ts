import { describe, test, expect } from 'bun:test';
import { hashPassword, verifyPassword } from '../utils/password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    test('should hash a password and return bcrypt format', async () => {
      const password = 'mySecurePassword123';
      const hash = await hashPassword(password);

      // bcrypt hashes start with $2a$ or $2b$ and are 60 characters
      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$.{53}$/);
      expect(hash.length).toBe(60);
    });

    test('should produce different hashes for same password (salting)', async () => {
      const password = 'samePassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Due to random salting, hashes should be different
      expect(hash1).not.toBe(hash2);
    });

    test('should handle empty string', async () => {
      const hash = await hashPassword('');
      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$.{53}$/);
    });

    test('should handle unicode characters', async () => {
      const password = 'p@ssword-with-unicode-';
      const hash = await hashPassword(password);

      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$.{53}$/);
    });

    test('should handle very long passwords', async () => {
      // bcrypt has a max of 72 bytes, but should still work
      const longPassword = 'a'.repeat(100);
      const hash = await hashPassword(longPassword);

      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$.{53}$/);
    });

    test('should handle special characters', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~\\';
      const hash = await hashPassword(password);

      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$.{53}$/);
    });
  });

  describe('verifyPassword', () => {
    test('should return true for correct password', async () => {
      const password = 'correctPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    test('should return false for incorrect password', async () => {
      const password = 'correctPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('wrongPassword', hash);
      expect(isValid).toBe(false);
    });

    test('should return false for empty password against non-empty hash', async () => {
      const password = 'somePassword';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('', hash);
      expect(isValid).toBe(false);
    });

    test('should verify empty password against empty password hash', async () => {
      const hash = await hashPassword('');

      const isValid = await verifyPassword('', hash);
      expect(isValid).toBe(true);
    });

    test('should return false for similar but different passwords', async () => {
      const password = 'Password123';
      const hash = await hashPassword(password);

      // Test case sensitivity
      expect(await verifyPassword('password123', hash)).toBe(false);
      expect(await verifyPassword('PASSWORD123', hash)).toBe(false);
      expect(await verifyPassword('Password124', hash)).toBe(false);
      expect(await verifyPassword('Password123 ', hash)).toBe(false);
    });

    test('should handle unicode passwords correctly', async () => {
      const password = 'password-\u4e2d\u6587'; // password-中文
      const hash = await hashPassword(password);

      expect(await verifyPassword(password, hash)).toBe(true);
      expect(await verifyPassword('password-english', hash)).toBe(false);
    });
  });

  describe('round-trip password hashing', () => {
    test('should correctly round-trip various passwords', async () => {
      const passwords = [
        'simple',
        'WithNumbers123',
        'with-special-chars!@#',
        'unicode-',
        '   spaces   ',
        'ALLCAPS',
        'verylongpasswordthatexceedstheusualrecommendedlength1234567890',
      ];

      for (const password of passwords) {
        const hash = await hashPassword(password);
        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);
      }
    });
  });
});
