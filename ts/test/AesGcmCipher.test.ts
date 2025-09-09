import { describe, it, expect } from 'vitest';
import { AesGcmCipher } from '../src/AesGcmCipher.js';

describe('AesGcmCipher', () => {
  const key = new Uint8Array(32); // 256-bit key
  key.fill(1);
  const plaintext = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

  it('encrypts and decrypts correctly', async () => {
    const cipher = new AesGcmCipher(key);
    const ciphertext = await cipher.encrypt(plaintext);
    expect(ciphertext).toBeInstanceOf(Uint8Array);
    expect(ciphertext.length).toBeGreaterThan(12); // nonce + ct

    const decrypted = await cipher.decrypt(ciphertext);
    expect(decrypted).toEqual(plaintext);
  });

  it('throws on invalid key length', () => {
    expect(() => new AesGcmCipher(new Uint8Array(10))).toThrow();
  });

  it('throws on non-Uint8Array input', async () => {
    const cipher = new AesGcmCipher(key);
    await expect(cipher.encrypt('not bytes' as any)).rejects.toThrow();
    await expect(cipher.decrypt('not bytes' as any)).rejects.toThrow();
  });

  it('throws on too short ciphertext', async () => {
    const cipher = new AesGcmCipher(key);
    await expect(cipher.decrypt(new Uint8Array(10))).rejects.toThrow();
  });
});
