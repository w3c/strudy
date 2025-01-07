---
Title: 'Wrong Web IDL type for URLs in WebRTC: Real-Time Communication in Browsers'
Tracked: N/A
Repo: 'https://github.com/w3c/webrtc-pc'
---

While crawling [WebRTC: Real-Time Communication in Browsers](https://w3c.github.io/webrtc-pc/), wrong Web IDL type for URLs:
* [ ] `field urls` in dictionary `RTCIceServer` uses `DOMString` instead of recommended `USVString` for URLs
* [ ] `attribute url` in interface `RTCIceCandidate` uses `DOMString` instead of recommended `USVString` for URLs
* [ ] `attribute url` in interface `RTCPeerConnectionIceEvent` uses `DOMString` instead of recommended `USVString` for URLs
* [ ] `field url` in dictionary `RTCPeerConnectionIceEventInit` uses `DOMString` instead of recommended `USVString` for URLs
* [ ] `attribute url` in interface `RTCPeerConnectionIceErrorEvent` uses `DOMString` instead of recommended `USVString` for URLs
* [ ] `field url` in dictionary `RTCPeerConnectionIceErrorEventInit` uses `DOMString` instead of recommended `USVString` for URLs

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
