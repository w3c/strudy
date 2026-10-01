---
Title: Enum values that ignore naming conventions in Web Install
Tracked: N/A
Repo: 'https://github.com/WICG/install-element'
---

While crawling [Web Install](https://wicg.github.io/install-element/), the following enum values were found to ignore naming conventions (lower case, hyphen separated words):
* [ ] The value `"invalid_data"` of the enum `InstallResult` does not match the expected conventions (lower case, hyphen separated words)

See [Use casing rules consistent with existing APIs](https://w3ctag.github.io/design-principles/#casing-rules) in Web Platform Design Principles document for guidance.

<sub>Cc @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
