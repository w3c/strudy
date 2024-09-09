---
Title: Missing tasks in parallel steps in Web Background Synchronization
Tracked: 'https://github.com/WICG/background-sync/issues/189'
Repo: 'https://github.com/WICG/background-sync'
---

While crawling [Web Background Synchronization](https://wicg.github.io/background-sync/spec/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [SyncManager/register(tag)](https://wicg.github.io/background-sync/spec/#dom-syncmanager-register) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [SyncManager/getTags()](https://wicg.github.io/background-sync/spec/#dom-syncmanager-gettags) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [fire a sync event](https://wicg.github.io/background-sync/spec/#fire-a-sync-event) algorithm fires an event directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
