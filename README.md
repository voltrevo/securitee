# securitee

Currently, there are no web standards for inspecting or enforcing the key being used in a TLS connection - it's a black box verified inside the browser.

To communicate securely with a TEE, we need to verify the trust chain from the key that secures the connection all the way back to the TEE's manufacturer. Valid TLS is not enough - if you own a domain, you can use whatever key you like to secure TLS connections with that domain, including those not owned exclusively by your TEE.

**Securitee** is a collection of libraries for efficient secure communication, intended for use with TEEs.
