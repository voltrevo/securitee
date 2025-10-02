/* eslint-disable no-console */

import { AesGcmCipher } from '../src/AesGcmCipher.js';

function randomBytes(len: number): Uint8Array {
  const arr = new Uint8Array(len);
  const CHUNK = 65536;
  for (let i = 0; i < len; i += CHUNK) {
    crypto.getRandomValues(arr.subarray(i, Math.min(i + CHUNK, len)));
  }
  return arr;
}

async function measureEncryptMBps(
  cipher: AesGcmCipher,
  size: number,
  rounds: number,
): Promise<number> {
  const data = randomBytes(size);
  const start = performance.now();
  for (let i = 0; i < rounds; ++i) {
    await cipher.encrypt(data);
  }
  const end = performance.now();
  const totalMB = (size * rounds) / (1024 * 1024);
  const seconds = (end - start) / 1000;
  return totalMB / seconds;
}

async function measureDecryptMBps(
  cipher: AesGcmCipher,
  size: number,
  rounds: number,
): Promise<number> {
  const data = randomBytes(size);
  const payloads: Uint8Array[] = [];
  for (let i = 0; i < rounds; ++i) {
    payloads.push(await cipher.encrypt(data));
  }
  // correctness check
  const pt = await cipher.decrypt(payloads[0]);
  if (!pt.every((v, i) => v === data[i])) {
    throw new Error('Decryption failed: output does not match input');
  }
  const start = performance.now();
  for (let i = 0; i < rounds; ++i) {
    await cipher.decrypt(payloads[i]);
  }
  const end = performance.now();
  const totalMB = (size * rounds) / (1024 * 1024);
  const seconds = (end - start) / 1000;
  return totalMB / seconds;
}

async function main() {
  const key = randomBytes(32); // AES-256
  const cipher = new AesGcmCipher(key);
  const size = 10 * 1024 * 1024; // 10MB
  const rounds = 50;
  console.log(`Encrypting ${size} bytes x ${rounds} rounds...`);
  const encMbps = await measureEncryptMBps(cipher, size, rounds);
  console.log(`AesGcmCipher encrypt: ${encMbps.toFixed(2)} MB/s`);

  console.log(`Decrypting ${size} bytes x ${rounds} rounds...`);
  const decMbps = await measureDecryptMBps(cipher, size, rounds);
  console.log(`AesGcmCipher decrypt: ${decMbps.toFixed(2)} MB/s`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
