---
Title: Missing tasks in parallel steps in Credential Management Level 1
Tracked: N/A
Repo: 'https://github.com/w3c/webappsec-credential-management'
---

While crawling [Credential Management Level 1](https://w3c.github.io/webappsec-credential-management/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [Request a Credential](https://w3c.github.io/webappsec-credential-management/#abstract-opdef-request-a-credential) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [Create a Credential](https://w3c.github.io/webappsec-credential-management/#abstract-opdef-create-a-credential) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [Prevent Silent Access](https://w3c.github.io/webappsec-credential-management/#abstract-opdef-prevent-silent-access) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
