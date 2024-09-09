---
Title: >-
  [encrypted-media-2] Missing tasks in parallel steps in Encrypted Media
  Extensions
Tracked: N/A
Repo: 'https://github.com/w3c/encrypted-media'
---

While crawling [Encrypted Media Extensions](https://w3c.github.io/encrypted-media/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [Navigator/requestMediaKeySystemAccess()](https://w3c.github.io/encrypted-media/#dom-navigator-requestmediakeysystemaccess) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [MediaKeySystemAccess/createMediaKeys()](https://w3c.github.io/encrypted-media/#dom-mediakeysystemaccess-createmediakeys) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [MediaKeys/setServerCertificate()](https://w3c.github.io/encrypted-media/#dom-mediakeys-setservercertificate) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [MediaKeySession/generateRequest()](https://w3c.github.io/encrypted-media/#dom-mediakeysession-generaterequest) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [MediaKeySession/load()](https://w3c.github.io/encrypted-media/#dom-mediakeysession-load) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [MediaKeySession/update()](https://w3c.github.io/encrypted-media/#dom-mediakeysession-update) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [HTMLMediaElement/setMediaKeys()](https://w3c.github.io/encrypted-media/#dom-htmlmediaelement-setmediakeys) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
