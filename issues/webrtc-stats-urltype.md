---
Title: Wrong Web IDL type for URLs in Identifiers for WebRTC's Statistics API
Tracked: 'https://github.com/w3c/webrtc-stats/issues/791'
Repo: 'https://github.com/w3c/webrtc-stats'
---

While crawling [Identifiers for WebRTC's Statistics API](https://w3c.github.io/webrtc-stats/), wrong Web IDL type for URLs:
* [ ] `field url` in dictionary `RTCIceCandidateStats` uses `DOMString` instead of recommended `USVString` for URLs

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
