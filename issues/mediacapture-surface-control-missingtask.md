---
Title: Missing tasks in parallel steps in Captured Surface Control
Tracked: N/A
Repo: 'https://github.com/w3c/mediacapture-surface-control'
---

While crawling [Captured Surface Control](https://w3c.github.io/mediacapture-surface-control/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [CaptureController/setZoomLevel()](https://w3c.github.io/mediacapture-surface-control/#dom-capturecontroller-setzoomlevel) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CaptureController/forwardWheel()](https://w3c.github.io/mediacapture-surface-control/#dom-capturecontroller-forwardwheel) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [forward wheel event algorithm](https://w3c.github.io/mediacapture-surface-control/#dfn-forward-wheel-event-algorithm) algorithm fires an event directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
