---
Title: Missing tasks in parallel steps in Get Installed Related Apps API
Tracked: 'https://github.com/WICG/get-installed-related-apps/issues/40'
Repo: 'https://github.com/WICG/get-installed-related-apps'
---

While crawling [Get Installed Related Apps API](https://wicg.github.io/get-installed-related-apps/spec/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [getInstalledRelatedApps()](https://wicg.github.io/get-installed-related-apps/spec/#dom-navigator-getinstalledrelatedapps) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
