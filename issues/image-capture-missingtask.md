---
Title: Missing tasks in parallel steps in MediaStream Image Capture
Tracked: 'https://github.com/w3c/mediacapture-image/issues/308'
Repo: 'https://github.com/w3c/mediacapture-image'
---

While crawling [MediaStream Image Capture](https://w3c.github.io/mediacapture-image/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [ImageCapture/takePhoto(photoSettings)](https://w3c.github.io/mediacapture-image/#dom-imagecapture-takephoto) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [ImageCapture/getPhotoCapabilities()](https://w3c.github.io/mediacapture-image/#dom-imagecapture-getphotocapabilities) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [ImageCapture/getPhotoSettings()](https://w3c.github.io/mediacapture-image/#dom-imagecapture-getphotosettings) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [ImageCapture/grabFrame()](https://w3c.github.io/mediacapture-image/#dom-imagecapture-grabframe) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
