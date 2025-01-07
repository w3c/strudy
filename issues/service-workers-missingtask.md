---
Title: Missing tasks in parallel steps in Service Workers Nightly
Tracked: 'https://github.com/w3c/ServiceWorker/issues/1740'
Repo: 'https://github.com/w3c/ServiceWorker'
---

While crawling [Service Workers Nightly](https://w3c.github.io/ServiceWorker/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [navigator-service-worker-getRegistration](https://w3c.github.io/ServiceWorker/#dom-serviceworkercontainer-getregistration) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [navigation-preload-manager-enable](https://w3c.github.io/ServiceWorker/#dom-navigationpreloadmanager-enable) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [navigation-preload-manager-disable](https://w3c.github.io/ServiceWorker/#dom-navigationpreloadmanager-disable) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [navigation-preload-manager-setheadervalue](https://w3c.github.io/ServiceWorker/#dom-navigationpreloadmanager-setheadervalue) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [navigation-preload-manager-getstate](https://w3c.github.io/ServiceWorker/#dom-navigationpreloadmanager-getstate) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [service-worker-global-scope-skipwaiting](https://w3c.github.io/ServiceWorker/#dom-serviceworkerglobalscope-skipwaiting) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [client-postmessage-options](https://w3c.github.io/ServiceWorker/#dom-client-postmessage-message-options) algorithm fires an event directly in a step that runs in parallel
* [ ] The [clients-get](https://w3c.github.io/ServiceWorker/#dom-clients-get) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [clients-claim](https://w3c.github.io/ServiceWorker/#dom-clients-claim) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [cache-match](https://w3c.github.io/ServiceWorker/#dom-cache-match) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [cache-matchall](https://w3c.github.io/ServiceWorker/#dom-cache-matchall) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [cache-storage-match](https://w3c.github.io/ServiceWorker/#dom-cachestorage-match) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [cache-storage-has](https://w3c.github.io/ServiceWorker/#dom-cachestorage-has) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [cache-storage-open](https://w3c.github.io/ServiceWorker/#dom-cachestorage-open) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [cache-storage-delete](https://w3c.github.io/ServiceWorker/#dom-cachestorage-delete) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [cache-storage-keys](https://w3c.github.io/ServiceWorker/#dom-cachestorage-keys) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [Handle Fetch](https://w3c.github.io/ServiceWorker/#handle-fetch) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
