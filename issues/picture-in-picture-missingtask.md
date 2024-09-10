---
Title: Missing tasks in parallel steps in Picture-in-Picture
Tracked: N/A
Repo: 'https://github.com/w3c/picture-in-picture'
---

While crawling [Picture-in-Picture](https://w3c.github.io/picture-in-picture/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The algorithm that starts with "The requestPictureInPicture() method, when invoked, MUST return a new promise promise and run the following steps in parallel:" resolves/rejects a promise directly in a step that runs in parallel
* [ ] The algorithm that starts with "The exitPictureInPicture() method, when invoked, MUST return a new promise promise and run the following steps in parallel:" resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
