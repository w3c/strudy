---
Title: Missing tasks in parallel steps in WebDriver
Tracked: 'https://github.com/w3c/webdriver/issues/1876'
Repo: 'https://github.com/w3c/webdriver'
---

While crawling [WebDriver](https://w3c.github.io/webdriver/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [algorithm](https://w3c.github.io/webdriver/#execute-script) that starts with "The remote end steps, given session, URL variables and parameters are:" resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [algorithm](https://w3c.github.io/webdriver/#execute-async-script) that starts with "The remote end steps, given session, URL variables and parameters are:" resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
