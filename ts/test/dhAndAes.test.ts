import { describe, it, expect } from 'vitest';
import { randBytes } from '../src/util.js';
import { KeyPairX25519 } from '../src/KeyPairX25519.js';
import { AesGcmCipher } from '../src/AesGcmCipher.js';

describe('KeyPairX25519 + AesGcmCipher (DH + AES)', () => {
  it('should allow two parties to securely exchange messages', async () => {
    // Alice and Bob generate keypairs
    const alice = await KeyPairX25519.generate();
    const bob = await KeyPairX25519.generate();

    // Both derive the same AES key using each other's public key
    const salt = randBytes(32); // 256-bit salt
    const aliceAesKey = await alice.deriveAesKey(bob.publicKeyRaw, salt);
    const bobAesKey = await bob.deriveAesKey(alice.publicKeyRaw, salt);

    expect(aliceAesKey).toEqual(bobAesKey);

    // Alice encrypts a message for Bob
    const cipherAlice = new AesGcmCipher(aliceAesKey);
    const plaintext = new TextEncoder().encode('Secret message from Alice');
    const payload = await cipherAlice.encrypt(plaintext);

    // Bob decrypts the message
    const cipherBob = new AesGcmCipher(bobAesKey);
    const decrypted = await cipherBob.decrypt(payload);
    expect(new TextDecoder().decode(decrypted)).toBe(
      'Secret message from Alice',
    );
  });
});
