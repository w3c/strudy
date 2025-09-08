---
Title: >-
  Enum values that ignore naming conventions in Modern Algorithms in the Web
  Cryptography API
Tracked: N/A
Repo: 'https://github.com/WICG/webcrypto-modern-algos'
---

While crawling [Modern Algorithms in the Web Cryptography API](https://wicg.github.io/webcrypto-modern-algos/), the following enum values were found to ignore naming conventions (lower case, hyphen separated words):
* [ ] The value `"deriveKey"` of the enum `KeyUsage` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"deriveBits"` of the enum `KeyUsage` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"wrapKey"` of the enum `KeyUsage` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"unwrapKey"` of the enum `KeyUsage` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"encapsulateKey"` of the enum `KeyUsage` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"encapsulateBits"` of the enum `KeyUsage` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"decapsulateKey"` of the enum `KeyUsage` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"decapsulateBits"` of the enum `KeyUsage` does not match the expected conventions (lower case, hyphen separated words)

See [Use casing rules consistent with existing APIs](https://w3ctag.github.io/design-principles/#casing-rules) in Web Platform Design Principles document for guidance.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
