---
Title: Missing tasks in parallel steps in Contact Picker API
Tracked: 'https://github.com/w3c/contact-picker/issues/78'
Repo: 'https://github.com/w3c/contact-picker'
---

While crawling [Contact Picker API](https://w3c.github.io/contact-picker/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [getProperties()](https://w3c.github.io/contact-picker/#dom-contactsmanager-getproperties) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
