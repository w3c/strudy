---
Title: Missing tasks in parallel steps in WebRTC Encoded Transform
Tracked: N/A
Repo: 'https://github.com/w3c/webrtc-encoded-transform'
---

While crawling [WebRTC Encoded Transform](https://w3c.github.io/webrtc-encoded-transform/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [algorithm that starts](https://w3c.github.io/webrtc-encoded-transform/#sframe-transform-algorithm) with "The SFrame transform algorithm, given sframe as a SFrameTransform object and frame, runs these steps:" resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [send request key frame algorithm](https://w3c.github.io/webrtc-encoded-transform/#abstract-opdef-send-request-key-frame-algorithm) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
