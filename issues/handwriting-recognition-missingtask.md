---
Title: Missing tasks in parallel steps in Handwriting Recognition API
Tracked: N/A
Repo: 'https://github.com/WICG/handwriting-recognition'
---

While crawling [Handwriting Recognition API](https://wicg.github.io/handwriting-recognition/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The navigator-query-handwriting-recognizer algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The navigator-create-handwriting-recognizer algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The handwriting-drawing-get-prediction algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
