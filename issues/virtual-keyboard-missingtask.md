---
Title: Missing tasks in parallel steps in VirtualKeyboard API
Tracked: 'https://github.com/w3c/virtual-keyboard/issues/25'
Repo: 'https://github.com/w3c/virtual-keyboard'
---

While crawling [VirtualKeyboard API](https://w3c.github.io/virtual-keyboard/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [VirtualKeyboard/show()](https://w3c.github.io/virtual-keyboard/#dom-virtualkeyboard-show) algorithm fires an event directly in a step that runs in parallel
* [ ] The [VirtualKeyboard/hide()](https://w3c.github.io/virtual-keyboard/#dom-virtualkeyboard-hide) algorithm fires an event directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
