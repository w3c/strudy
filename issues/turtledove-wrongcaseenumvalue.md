---
Title: >-
  Enum values that ignore naming conventions in Protected Audience (formerly
  FLEDGE)
Tracked: 'https://github.com/WICG/turtledove/issues/1268'
Repo: 'https://github.com/WICG/turtledove'
---

While crawling [Protected Audience (formerly FLEDGE)](https://wicg.github.io/turtledove/), the following enum values were found to ignore naming conventions (lower case, hyphen separated words):
* [ ] The value `"passedAndEnforced"` of the enum `KAnonStatus` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"passedNotEnforced"` of the enum `KAnonStatus` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"belowThreshold"` of the enum `KAnonStatus` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"notCalculated"` of the enum `KAnonStatus` does not match the expected conventions (lower case, hyphen separated words)

See [Use casing rules consistent with existing APIs](https://w3ctag.github.io/design-principles/#casing-rules) in Web Platform Design Principles document for guidance.

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
