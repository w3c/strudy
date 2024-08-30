---
Title: >-
  Enum values that ignore naming conventions in Web Authentication: An API for
  accessing Public Key Credentials - Level 3
Tracked: N/A
Repo: 'https://github.com/w3c/webauthn'
---

While crawling [Web Authentication: An API for accessing Public Key Credentials - Level 3](https://w3c.github.io/webauthn/), the following enum values were found to ignore naming conventions (lower case, hyphen separated words):
* [ ] The value `"conditionalCreate"` of the enum `ClientCapability` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"conditionalGet"` of the enum `ClientCapability` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"hybridTransport"` of the enum `ClientCapability` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"passkeyPlatformAuthenticator"` of the enum `ClientCapability` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"userVerifyingPlatformAuthenticator"` of the enum `ClientCapability` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"relatedOrigins"` of the enum `ClientCapability` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"signalAllAcceptedCredentials"` of the enum `ClientCapability` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"signalCurrentUserDetails"` of the enum `ClientCapability` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"signalUnknownCredential"` of the enum `ClientCapability` does not match the expected conventions (lower case, hyphen separated words)

See [Use casing rules consistent with existing APIs](https://w3ctag.github.io/design-principles/#casing-rules) in Web Platform Design Principles document for guidance.

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
