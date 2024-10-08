---
Title: Enum values that ignore naming conventions in Media Capabilities
Tracked: 'https://github.com/w3c/media-capabilities/issues/227'
Repo: 'https://github.com/w3c/media-capabilities'
---

While crawling [Media Capabilities](https://w3c.github.io/media-capabilities/), the following enum values were found to ignore naming conventions (lower case, hyphen separated words):
* [ ] The value `"smpteSt2086"` of the enum `HdrMetadataType` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"smpteSt2094-10"` of the enum `HdrMetadataType` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"smpteSt2094-40"` of the enum `HdrMetadataType` does not match the expected conventions (lower case, hyphen separated words)

See [Use casing rules consistent with existing APIs](https://w3ctag.github.io/design-principles/#casing-rules) in Web Platform Design Principles document for guidance.

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
