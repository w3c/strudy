---
Title: Missing tasks in parallel steps in Web Periodic Background Synchronization
Tracked: 'https://github.com/WICG/periodic-background-sync/issues/13'
Repo: 'https://github.com/WICG/periodic-background-sync'
---

While crawling [Web Periodic Background Synchronization](https://wicg.github.io/periodic-background-sync/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [Process periodic sync registrations](https://wicg.github.io/periodic-background-sync/#process-periodic-sync-registrations) algorithm fires an event directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
