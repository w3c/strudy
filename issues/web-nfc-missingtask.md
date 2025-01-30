---
Title: Missing tasks in parallel steps in Web NFC
Tracked: 'https://github.com/w3c/web-nfc/issues/668'
Repo: 'https://github.com/w3c/web-nfc'
---

While crawling [Web NFC](https://w3c.github.io/web-nfc/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [NDEFReader/write()](https://w3c.github.io/web-nfc/#dom-ndefreader-write) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [NDEFReader/makeReadOnly()](https://w3c.github.io/web-nfc/#dom-ndefreader-makereadonly) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [clean up the pending scan](https://w3c.github.io/web-nfc/#dfn-clean-up-the-pending-scan) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
