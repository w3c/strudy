---
Title: Enum values that ignore naming conventions in Web Audio API 1.1
Tracked: Too late to fix, see https://github.com/WebAudio/web-audio-api/issues/2599
Repo: 'https://github.com/WebAudio/web-audio-api'
---

While crawling [Web Audio API 1.1](https://webaudio.github.io/web-audio-api/), the following enum values were found to ignore naming conventions (lower case, hyphen separated words):
* [ ] The value `"HRTF"` of the enum `PanningModelType` does not match the expected conventions (lower case, hyphen separated words)

See [Use casing rules consistent with existing APIs](https://w3ctag.github.io/design-principles/#casing-rules) in Web Platform Design Principles document for guidance.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
