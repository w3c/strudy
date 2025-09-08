---
Title: >-
  Missing tasks in parallel steps in Modern Algorithms in the Web Cryptography
  API
Tracked: Re-using the same weird pseudo-throw from WebCrypto
Repo: 'https://github.com/WICG/webcrypto-modern-algos'
---

While crawling [Modern Algorithms in the Web Cryptography API](https://wicg.github.io/webcrypto-modern-algos/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [SubtleCrypto/encapsulateKey(encapsulationAlgorithm, encapsulationKey, sharedKeyAlgorithm, extractable, usages)](https://wicg.github.io/webcrypto-modern-algos/#dfn-SubtleCrypto-method-encapsulateKey) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [SubtleCrypto/encapsulateBits(encapsulationAlgorithm, encapsulationKey)](https://wicg.github.io/webcrypto-modern-algos/#dfn-SubtleCrypto-method-encapsulateBits) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [SubtleCrypto/decapsulateKey(decapsulationAlgorithm, decapsulationKey, ciphertext, sharedKeyAlgorithm, extractable, usages)](https://wicg.github.io/webcrypto-modern-algos/#dfn-SubtleCrypto-method-decapsulateKey) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [SubtleCrypto/decapsulateBits(decapsulationAlgorithm, decapsulationKey, ciphertext)](https://wicg.github.io/webcrypto-modern-algos/#dfn-SubtleCrypto-method-decapsulateBits) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [SubtleCrypto/getPublicKey(key, usages)](https://wicg.github.io/webcrypto-modern-algos/#dfn-SubtleCrypto-method-getPublicKey) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
