---
Title: Missing tasks in parallel steps in Cookie Store API
Tracked: N/A
Repo: 'https://github.com/WICG/cookie-store'
---

While crawling [Cookie Store API](https://wicg.github.io/cookie-store/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [CookieStore/get(name)](https://wicg.github.io/cookie-store/#dom-cookiestore-get) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStore/get(options)](https://wicg.github.io/cookie-store/#dom-cookiestore-get-options) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStore/getAll(name)](https://wicg.github.io/cookie-store/#dom-cookiestore-getall) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStore/getAll(options)](https://wicg.github.io/cookie-store/#dom-cookiestore-getall-options) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStore/set(name, value)](https://wicg.github.io/cookie-store/#dom-cookiestore-set) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStore/set(options)](https://wicg.github.io/cookie-store/#dom-cookiestore-set-options) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStore/delete(name)](https://wicg.github.io/cookie-store/#dom-cookiestore-delete) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStore/delete(options)](https://wicg.github.io/cookie-store/#dom-cookiestore-delete-options) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStoreManager/subscribe(subscriptions)](https://wicg.github.io/cookie-store/#dom-cookiestoremanager-subscribe) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStoreManager/getSubscriptions()](https://wicg.github.io/cookie-store/#dom-cookiestoremanager-getsubscriptions) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [CookieStoreManager/unsubscribe(subscriptions)](https://wicg.github.io/cookie-store/#dom-cookiestoremanager-unsubscribe) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
