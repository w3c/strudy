---
Title: Missing tasks in parallel steps in WebTransport
Tracked: 'https://github.com/w3c/webtransport/issues/626'
Repo: 'https://github.com/w3c/webtransport'
---

While crawling [WebTransport](https://w3c.github.io/webtransport/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [WebTransport/getStats()](https://w3c.github.io/webtransport/#dom-webtransport-getstats) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [WebTransport/createBidirectionalStream(options)](https://w3c.github.io/webtransport/#dom-webtransport-createbidirectionalstream) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [WebTransport/createUnidirectionalStream(options)](https://w3c.github.io/webtransport/#dom-webtransport-createunidirectionalstream) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
