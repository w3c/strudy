---
Title: Enum values that ignore naming conventions in JSON-LD 1.1 Framing
Tracked: Long deployed
Repo: 'https://github.com/w3c/json-ld-framing'
---

While crawling [JSON-LD 1.1 Framing](https://w3c.github.io/json-ld-framing/), the following enum values were found to ignore naming conventions (lower case, hyphen separated words):
* [ ] The value `"invalid frame"` of the enum `JsonLdFramingErrorCode` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"invalid @embed value"` of the enum `JsonLdFramingErrorCode` does not match the expected conventions (lower case, hyphen separated words)

See [Use casing rules consistent with existing APIs](https://w3ctag.github.io/design-principles/#casing-rules) in Web Platform Design Principles document for guidance.

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
