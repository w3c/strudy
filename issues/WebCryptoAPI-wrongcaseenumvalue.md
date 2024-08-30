---
Title: Enum values that ignore naming conventions in Web Cryptography API
Tracked: Widely deployed, unlikely to change at this point
Repo: 'https://github.com/w3c/webcrypto'
---

While crawling [Web Cryptography API](https://w3c.github.io/webcrypto/), the following enum values were found to ignore naming conventions (lower case, hyphen separated words):
* [ ] The value `"deriveKey"` of the enum `KeyUsage` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"deriveBits"` of the enum `KeyUsage` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"wrapKey"` of the enum `KeyUsage` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"unwrapKey"` of the enum `KeyUsage` does not match the expected conventions (lower case, hyphen separated words)

See [Use casing rules consistent with existing APIs](https://w3ctag.github.io/design-principles/#casing-rules) in Web Platform Design Principles document for guidance.

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
