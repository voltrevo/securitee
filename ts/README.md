# securitee

🚧 Work in Progress 🚧

Currently, there are no web standards for inspecting or enforcing the key being used in a TLS connection - it's a black box verified inside the browser.

To communicate securely with a TEE, we need to verify the trust chain from the key that secures the connection all the way back to the TEE's manufacturer. Valid TLS is not enough - if you own a domain, you can use whatever key you like to secure TLS connections with that domain, including those not owned exclusively by your TEE.

**Securitee** is a collection of libraries for efficient secure communication, intended for use with TEEs.

## AES-GCM

See `AesGcmCipher` for a wrapper around the appropriate WebCrypto APIs.

```ts
import { AesGcmCipher } from 'securitee';

const key = crypto.getRandomValues(new Uint8Array(32)); // 256-bit key
const cipher = new AesGcmCipher(key);
const plaintext = new TextEncoder().encode('Hello, world!');

// Encrypt
const payload = await cipher.encrypt(plaintext); // returns [nonce | ciphertext&tag]

// Decrypt
const decrypted = await cipher.decrypt(payload);
console.log(new TextDecoder().decode(decrypted)); // "Hello, world!"
```
