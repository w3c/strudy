---
Title: Missing tasks in parallel steps in Federated Credential Management API
Tracked: N/A
Repo: 'https://github.com/w3c-fedid/FedCM'
---

While crawling [Federated Credential Management API](https://w3c-fedid.github.io/FedCM/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [attempt to disconnect](https://w3c-fedid.github.io/FedCM/#attempt-to-disconnect) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [create an IdentityCredential](https://w3c-fedid.github.io/FedCM/#create-an-identitycredential) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The getUserInfo algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
