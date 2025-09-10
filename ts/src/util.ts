export function randBytes(n: number): Uint8Array {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

export function encodeUtf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const buf = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);

  if (buf instanceof ArrayBuffer) {
    return buf;
  }

  throw new Error('Expected ArrayBuffer, got SharedArrayBuffer');
}
