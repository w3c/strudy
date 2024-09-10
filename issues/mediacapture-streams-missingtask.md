---
Title: Missing tasks in parallel steps in Media Capture and Streams
Tracked: 'https://github.com/w3c/mediacapture-main/issues/1012'
Repo: 'https://github.com/w3c/mediacapture-main'
---

While crawling [Media Capture and Streams](https://w3c.github.io/mediacapture-main/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [MediaDevices/enumerateDevices()](https://w3c.github.io/mediacapture-main/#dom-mediadevices-enumeratedevices) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [MediaDevices/getUserMedia()](https://w3c.github.io/mediacapture-main/#dom-mediadevices-getusermedia) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
