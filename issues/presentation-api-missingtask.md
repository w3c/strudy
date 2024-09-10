---
Title: Missing tasks in parallel steps in Presentation API
Tracked: N/A
Repo: 'https://github.com/w3c/presentation-api'
---

While crawling [Presentation API](https://w3c.github.io/presentation-api/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [PresentationRequest/start()](https://w3c.github.io/presentation-api/#dom-presentationrequest-start) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [PresentationRequest/reconnect()](https://w3c.github.io/presentation-api/#dom-presentationrequest-reconnect) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [PresentationRequest/getAvailability()](https://w3c.github.io/presentation-api/#dom-presentationrequest-getavailability) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [monitoring incoming presentation connections](https://w3c.github.io/presentation-api/#dfn-monitoring-incoming-presentation-connections) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
