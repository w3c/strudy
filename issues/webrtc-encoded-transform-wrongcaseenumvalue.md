---
Title: Enum values that ignore naming conventions in WebRTC Encoded Transform
Tracked: N/A
Repo: 'https://github.com/w3c/webrtc-encoded-transform'
---

While crawling [WebRTC Encoded Transform](https://w3c.github.io/webrtc-encoded-transform/), the following enum values were found to ignore naming conventions (lower case, hyphen separated words):
* [ ] The value `"keyID"` of the enum `SFrameTransformErrorEventType` does not match the expected conventions (lower case, hyphen separated words)

See [Use casing rules consistent with existing APIs](https://w3ctag.github.io/design-principles/#casing-rules) in Web Platform Design Principles document for guidance.

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
