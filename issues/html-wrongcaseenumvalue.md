---
Title: Enum values that ignore naming conventions in HTML Standard
Tracked: N/A
Repo: 'https://github.com/whatwg/html'
---

While crawling [HTML Standard](https://html.spec.whatwg.org/multipage/), the following enum values were found to ignore naming conventions (lower case, hyphen separated words):
* [ ] The value `"optimizeSpeed"` of the enum `CanvasTextRendering` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"optimizeLegibility"` of the enum `CanvasTextRendering` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"geometricPrecision"` of the enum `CanvasTextRendering` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"flipY"` of the enum `ImageOrientation` does not match the expected conventions (lower case, hyphen separated words)

See [Use casing rules consistent with existing APIs](https://w3ctag.github.io/design-principles/#casing-rules) in Web Platform Design Principles document for guidance.

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
