---
Title: Missing tasks in parallel steps in Cookie Store API Standard
Tracked: N/A
Repo: 'https://github.com/whatwg/cookiestore'
---

While crawling [Cookie Store API Standard](https://cookiestore.spec.whatwg.org/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [CookieStore/get(name)](https://cookiestore.spec.whatwg.org/#dom-cookiestore-get) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStore/get(options)](https://cookiestore.spec.whatwg.org/#dom-cookiestore-get-options) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStore/getAll(name)](https://cookiestore.spec.whatwg.org/#dom-cookiestore-getall) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStore/getAll(options)](https://cookiestore.spec.whatwg.org/#dom-cookiestore-getall-options) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStore/set(name, value)](https://cookiestore.spec.whatwg.org/#dom-cookiestore-set) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStore/set(options)](https://cookiestore.spec.whatwg.org/#dom-cookiestore-set-options) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStore/delete(name)](https://cookiestore.spec.whatwg.org/#dom-cookiestore-delete) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStore/delete(options)](https://cookiestore.spec.whatwg.org/#dom-cookiestore-delete-options) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStoreManager/subscribe(subscriptions)](https://cookiestore.spec.whatwg.org/#dom-cookiestoremanager-subscribe) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStoreManager/getSubscriptions()](https://cookiestore.spec.whatwg.org/#dom-cookiestoremanager-getsubscriptions) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStoreManager/unsubscribe(subscriptions)](https://cookiestore.spec.whatwg.org/#dom-cookiestoremanager-unsubscribe) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
