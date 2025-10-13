---
Title: '[cssom-view-1] Missing tasks in parallel steps in CSSOM View Module Level 1'
Tracked: N/A
Repo: 'https://github.com/w3c/csswg-drafts'
---

While crawling [CSSOM View Module Level 1](https://drafts.csswg.org/cssom-view-1/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [perform a scroll of a box](https://drafts.csswg.org/cssom-view-1/#perform-a-scroll) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [perform a scroll of a viewport](https://drafts.csswg.org/cssom-view-1/#viewport-perform-a-scroll) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [scroll a target into view](https://drafts.csswg.org/cssom-view-1/#scroll-a-target-into-view) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
