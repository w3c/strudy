---
Title: >-
  Missing tasks in parallel steps in Web Authentication: An API for accessing
  Public Key Credentials - Level 3
Tracked: N/A
Repo: 'https://github.com/w3c/webauthn'
---

While crawling [Web Authentication: An API for accessing Public Key Credentials - Level 3](https://w3c.github.io/webauthn/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The algorithm that starts with "The Asynchronous RP ID validation algorithm lets signal methods validate RP IDs in parallel. The algorithm takes a DOMString rpId as input and returns a promise that rejects if the validation fails. The steps are:" resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
