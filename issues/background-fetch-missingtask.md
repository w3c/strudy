---
Title: Missing tasks in parallel steps in Background Fetch
Tracked: N/A
Repo: 'https://github.com/WICG/background-fetch'
---

While crawling [Background Fetch](https://wicg.github.io/background-fetch/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [create record objects](https://wicg.github.io/background-fetch/#create-record-objects) algorithm resolves/rejects a promise directly in a step that runs in parallel (steps 2.8.3 and 2.8.4)
* [ ] The [get(id)](https://wicg.github.io/background-fetch/#dom-backgroundfetchmanager-get) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [getIds()](https://wicg.github.io/background-fetch/#dom-backgroundfetchmanager-getids) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [abort()](https://wicg.github.io/background-fetch/#dom-backgroundfetchregistration-abort) algorithm resolves/rejects a promise directly and throws an exception in a step that runs in parallel
* [ ] The [updateUI(options)](https://wicg.github.io/background-fetch/#dom-backgroundfetchupdateuievent-updateui) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
