// KeyPairX25519.ts
// Encapsulates X25519 keypair, shared secret derivation, and AES-GCM key export.

import { encodeUtf8, toArrayBuffer } from './util.js';

/**
 * Represents an X25519 keypair and provides methods
 * to derive AES-GCM keys via HKDF-SHA256.
 */
export class KeyPairX25519 {
  private constructor(
    readonly privateKey: CryptoKey,
    readonly publicKeyRaw: Uint8Array,
  ) {}

  /** Generate a fresh X25519 keypair */
  static async generate(): Promise<KeyPairX25519> {
    const kp = (await crypto.subtle.generateKey(
      { name: 'X25519' },
      /* extractable */ false,
      ['deriveBits'],
    )) as CryptoKeyPair;
    const pubRaw = new Uint8Array(
      await crypto.subtle.exportKey('raw', kp.publicKey),
    );
    return new KeyPairX25519(kp.privateKey, pubRaw);
  }

  /** Import a peer's raw public key */
  private static importPeer(raw: Uint8Array): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      'raw',
      toArrayBuffer(raw),
      { name: 'X25519' },
      false,
      [],
    );
  }

  /** Compute the raw 32-byte shared secret with a peer */
  private async sharedSecret(peerPublicRaw: Uint8Array): Promise<Uint8Array> {
    const peerPub = await KeyPairX25519.importPeer(peerPublicRaw);
    const bits = await crypto.subtle.deriveBits(
      { name: 'X25519', public: peerPub },
      this.privateKey,
      256,
    );
    return new Uint8Array(bits);
  }

  /** Run HKDF-SHA256 to stretch input into arbitrary-length bytes */
  private static async hkdf(
    ikm: Uint8Array,
    salt: Uint8Array,
    info: Uint8Array,
    length: number,
  ): Promise<Uint8Array> {
    const baseKey = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(ikm),
      'HKDF',
      false,
      ['deriveBits'],
    );
    const out = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: toArrayBuffer(salt),
        info: toArrayBuffer(info),
      },
      baseKey,
      length * 8,
    );
    return new Uint8Array(out);
  }

  /**
   * Derive a 32-byte AES-GCM key from this keypair and a peer's public key.
   */
  async deriveAesKey(
    peerPublicRaw: Uint8Array,
    salt: Uint8Array,
    info = encodeUtf8('ctx:x25519+hkdf+aes-gcm'),
  ): Promise<Uint8Array> {
    const shared = await this.sharedSecret(peerPublicRaw);
    const aesKeyBytes = await KeyPairX25519.hkdf(shared, salt, info, 32);

    // hygiene: wipe shared secret
    shared.fill(0);

    return aesKeyBytes;
  }
}
