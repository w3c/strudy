---
Title: Missing tasks in parallel steps in Screen Capture
Tracked: https://github.com/w3c/mediacapture-screen-share/issues/303
Repo: 'https://github.com/w3c/mediacapture-screen-share'
---

While crawling [Screen Capture](https://w3c.github.io/mediacapture-screen-share/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [MediaDevices/getDisplayMedia()](https://w3c.github.io/mediacapture-screen-share/#dom-mediadevices-getdisplaymedia) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
