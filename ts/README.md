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

## Diffie Hellman Key Exchange

`KeyPairX25519` provides X25519 keypair generation and shared secret derivation, suitable for secure key exchange. You can use it with HKDF to derive a symmetric key for AES-GCM encryption.

```ts
import { KeyPairX25519 } from 'securitee';
import { AesGcmCipher } from 'securitee';
import { randBytes } from 'securitee';

// Alice and Bob generate keypairs
const alice = await KeyPairX25519.generate();
const bob = await KeyPairX25519.generate();

// Both derive the same AES key using each other's public key and a random salt
const salt = randBytes(32); // 256-bit salt
const aliceAesKey = await alice.deriveAesKey(bob.publicKeyRaw, salt);
const bobAesKey = await bob.deriveAesKey(alice.publicKeyRaw, salt);

// Use the derived key for AES-GCM
const cipherAlice = new AesGcmCipher(aliceAesKey);
const plaintext = new TextEncoder().encode('Secret message from Alice');
const payload = await cipherAlice.encrypt(plaintext);

const cipherBob = new AesGcmCipher(bobAesKey);
const decrypted = await cipherBob.decrypt(payload);
console.log(new TextDecoder().decode(decrypted)); // "Secret message from Alice"
```
