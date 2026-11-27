---
Title: 'Incompatible `[Exposed]` attribute in partial definitions in WebRTC Extensions'
Tracked: N/A
Repo: 'https://github.com/w3c/webrtc-extensions'
---

While crawling [WebRTC Extensions](https://w3c.github.io/webrtc-extensions/), the following partial definitions were found with an exposure set that is not a subset of the exposure set of the partial’s original interface or namespace:
* [ ] The `[Exposed]` extended attribute of the partial interface `RTCDataChannel` references globals on which the original interface is not exposed: Worker, SharedWorker, ServiceWorker, RTCIdentityProvider (original exposure: Window, DedicatedWorker)

See the [`[Exposed]`](https://webidl.spec.whatwg.org/#Exposed) extended attribute section in Web IDL for requirements.

<sub>Cc @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
