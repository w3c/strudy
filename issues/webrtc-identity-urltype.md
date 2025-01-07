---
Title: Wrong Web IDL type for URLs in Identity for WebRTC 1.0
Tracked: N/A
Repo: 'https://github.com/w3c/webrtc-identity'
---

While crawling [Identity for WebRTC 1.0](https://w3c.github.io/webrtc-identity/), wrong Web IDL type for URLs:
* [ ] `attribute idpLoginUrl` in partial interface `RTCPeerConnection` uses `DOMString` instead of recommended `USVString` for URLs
* [ ] `attribute idpLoginUrl` in partial interface `RTCPeerConnection` uses `DOMString` instead of recommended `USVString` for URLs

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
