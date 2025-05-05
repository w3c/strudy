---
Title: Missing tasks in parallel steps in Web Cryptography API
Tracked: Unconventional usage of "throw", see https://github.com/w3c/webcrypto/pull/386#discussion_r1884057887
Repo: 'https://github.com/w3c/webcrypto'
---

While crawling [Web Cryptography API](https://w3c.github.io/webcrypto/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [SubtleCrypto/encrypt()](https://w3c.github.io/webcrypto/#dfn-SubtleCrypto-method-encrypt) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [SubtleCrypto/decrypt()](https://w3c.github.io/webcrypto/#dfn-SubtleCrypto-method-decrypt) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [SubtleCrypto/sign()](https://w3c.github.io/webcrypto/#dfn-SubtleCrypto-method-sign) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [SubtleCrypto/verify()](https://w3c.github.io/webcrypto/#dfn-SubtleCrypto-method-verify) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [SubtleCrypto/digest()](https://w3c.github.io/webcrypto/#dfn-SubtleCrypto-method-digest) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [SubtleCrypto/generateKey()](https://w3c.github.io/webcrypto/#dfn-SubtleCrypto-method-generateKey) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [SubtleCrypto/deriveKey()](https://w3c.github.io/webcrypto/#dfn-SubtleCrypto-method-deriveKey) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [SubtleCrypto/deriveBits()](https://w3c.github.io/webcrypto/#dfn-SubtleCrypto-method-deriveBits) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [SubtleCrypto/importKey()](https://w3c.github.io/webcrypto/#dfn-SubtleCrypto-method-importKey) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [SubtleCrypto/exportKey()](https://w3c.github.io/webcrypto/#dfn-SubtleCrypto-method-exportKey) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [SubtleCrypto/wrapKey()](https://w3c.github.io/webcrypto/#dfn-SubtleCrypto-method-wrapKey) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [SubtleCrypto/unwrapKey()](https://w3c.github.io/webcrypto/#dfn-SubtleCrypto-method-unwrapKey) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
