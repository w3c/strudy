---
Title: Missing tasks in parallel steps in WebXR Device API
Tracked: 'https://github.com/immersive-web/webxr/issues/1400'
Repo: 'https://github.com/immersive-web/webxr'
---

While crawling [WebXR Device API](https://immersive-web.github.io/webxr/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [session-supported](https://immersive-web.github.io/webxr/#dom-xrsystem-issessionsupported) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [request-reference-space](https://immersive-web.github.io/webxr/#dom-xrsession-requestreferencespace) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
