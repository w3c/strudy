---
Title: Missing tasks in parallel steps in Payment Request API
Tracked: 'https://github.com/w3c/payment-request/issues/1032'
Repo: 'https://github.com/w3c/payment-request'
---

While crawling [Payment Request API](https://w3c.github.io/payment-request/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The algorithm that starts with "The show(optional detailsPromise) method MUST act as follows:" resolves/rejects a promise directly in a step that runs in parallel
* [ ] The algorithm that starts with "The complete() method MUST act as follows:" resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [can make payment algorithm](https://w3c.github.io/payment-request/#dfn-can-make-payment-algorithm) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
