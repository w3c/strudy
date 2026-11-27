---
Title: Missing `EventTarget` inheritances in WebRTC Extensions
Tracked: 'Another willful violation to extend an interface to add events'
Repo: 'https://github.com/w3c/webrtc-extensions'
---

While crawling [WebRTC Extensions](https://w3c.github.io/webrtc-extensions/), the following event handlers were found on interfaces that do not inherit from `EventTarget`:
* [ ] The interface `RTCRtpReceiver` defines an event handler `onssrcchange` but does not inherit from `EventTarget`

<sub>Cc @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
