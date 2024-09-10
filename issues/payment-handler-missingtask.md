---
Title: Missing tasks in parallel steps in Payment Handler API
Tracked: 'https://github.com/w3c/payment-handler/issues/419'
Repo: 'https://github.com/w3c/payment-handler'
---

While crawling [Payment Handler API](https://w3c.github.io/payment-handler/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The algorithm that starts with "Upon receiving a PaymentRequest by way of PaymentRequest.show() and subsequent user selection of a payment handler, the user agent MUST run the following steps:" resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [Open Window Algorithm](https://w3c.github.io/payment-handler/#open-window-algorithm) resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
