// AES-GCM Cipher (browser). Authenticated, 12-byte nonce.
// Payload: [ 12-byte nonce | ciphertext&tag ]

// Note: This cipher is designed to be used with an ephemeral key - generate
// a new one for each instance. If you reuse a key with this cipher, you run the
// risk of IV reuse (collision expected in about 2^16 key reuses), which can be
// catastrophic.

export class AesGcmCipher {
  private keyP: Promise<CryptoKey>;
  private salt4: Uint8Array;
  private ctr: bigint = 0n;

  constructor(rawKey: Uint8Array) {
    if (
      !(rawKey instanceof Uint8Array) ||
      ![16, 24, 32].includes(rawKey.length)
    ) {
      throw new Error('AES key must be 128/192/256-bit Uint8Array');
    }

    this.keyP = crypto.subtle.importKey(
      'raw',
      toArrayBuffer(rawKey),
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    );

    this.salt4 = crypto.getRandomValues(new Uint8Array(4));
  }

  async encrypt(plaintext: Uint8Array): Promise<Uint8Array> {
    if (!(plaintext instanceof Uint8Array))
      throw new Error('plaintext must be Uint8Array');

    const key = await this.keyP;
    const nonce = this.nextNonce(); // 12 bytes

    const ct = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: toArrayBuffer(nonce) },
        key,
        toArrayBuffer(plaintext),
      ),
    );

    const out = new Uint8Array(nonce.length + ct.length);
    out.set(nonce, 0);
    out.set(ct, nonce.length);

    return out;
  }

  async decrypt(payload: Uint8Array): Promise<Uint8Array> {
    if (!(payload instanceof Uint8Array))
      throw new Error('ciphertext must be Uint8Array');

    // need nonce + tag
    if (payload.length < 12 + 16) throw new Error('ciphertext too short');

    const nonce = toArrayBuffer(payload.subarray(0, 12));
    const ct = toArrayBuffer(payload.subarray(12));
    const key = await this.keyP;
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      key,
      ct,
    );

    return new Uint8Array(pt);
  }

  private nextNonce(): Uint8Array {
    const nonce = new Uint8Array(12);
    nonce.set(this.salt4, 0);
    // big-endian
    new DataView(nonce.buffer, 4, 8).setBigUint64(0, this.ctr++, false);
    return nonce;
  }
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const buf = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);

  if (buf instanceof ArrayBuffer) {
    return buf;
  }

  throw new Error('Expected ArrayBuffer, got SharedArrayBuffer');
}
