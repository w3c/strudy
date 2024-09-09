---
Title: Missing tasks in parallel steps in Content Index
Tracked: 'https://github.com/WICG/content-index/issues/34'
Repo: 'https://github.com/WICG/content-index'
---

While crawling [Content Index](https://wicg.github.io/content-index/spec/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [add(description)](https://wicg.github.io/content-index/spec/#dom-contentindex-add) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [delete(id)](https://wicg.github.io/content-index/spec/#dom-contentindex-delete) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [getAll()](https://wicg.github.io/content-index/spec/#dom-contentindex-getall) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
