---
Title: Missing tasks in parallel steps in Audio Output Devices API
Tracked: 'https://github.com/w3c/mediacapture-output/issues/145'
Repo: 'https://github.com/w3c/mediacapture-output'
---

While crawling [Audio Output Devices API](https://w3c.github.io/mediacapture-output/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [HTMLMediaElement/setSinkId()](https://w3c.github.io/mediacapture-output/#dom-htmlmediaelement-setsinkid) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [MediaDevices/selectAudioOutput()](https://w3c.github.io/mediacapture-output/#dom-mediadevices-selectaudiooutput) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
