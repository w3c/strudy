---
Title: 'Missing tasks in parallel steps in WebRTC: Real-Time Communication in Browsers'
Tracked: 'https://github.com/w3c/webrtc-pc/issues/3032'
Repo: 'https://github.com/w3c/webrtc-pc'
---

While crawling [WebRTC: Real-Time Communication in Browsers](https://w3c.github.io/webrtc-pc/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [RTCPeerConnection/generateCertificate()](https://w3c.github.io/webrtc-pc/#dom-rtcpeerconnection-generatecertificate) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [RTCRtpSender/replaceTrack()](https://w3c.github.io/webrtc-pc/#dom-rtcrtpsender-replacetrack) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [RTCRtpSender/getStats()](https://w3c.github.io/webrtc-pc/#widl-RTCRtpSender-getStats-Promise-RTCStatsReport) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [RTCRtpReceiver/getStats()](https://w3c.github.io/webrtc-pc/#widl-RTCRtpReceiver-getStats-Promise-RTCStatsReport) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [RTCPeerConnection/getStats()](https://w3c.github.io/webrtc-pc/#widl-RTCPeerConnection-getStats-Promise-RTCStatsReport--MediaStreamTrack-selector) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
