---
Title: Enum values that ignore naming conventions in Web Extensions
Tracked: N/A
Repo: 'https://github.com/w3c/webextensions'
---

While crawling [Web Extensions](https://w3c.github.io/webextensions/specification/index.html), the following enum values were found to ignore naming conventions (lower case, hyphen separated words):
* [ ] The value `"document_start"` of the enum `RunAt` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"document_end"` of the enum `RunAt` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"document_idle"` of the enum `RunAt` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"ISOLATED"` of the enum `ExecutionWorld` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"MAIN"` of the enum `ExecutionWorld` does not match the expected conventions (lower case, hyphen separated words)

See [Use casing rules consistent with existing APIs](https://w3ctag.github.io/design-principles/#casing-rules) in Web Platform Design Principles document for guidance.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
