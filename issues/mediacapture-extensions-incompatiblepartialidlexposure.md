---
Title: >-
  Incompatible `[Exposed]` attribute in partial definitions in Media Capture and
  Streams Extensions
Tracked: N/A
Repo: 'https://github.com/w3c/mediacapture-extensions'
---

While crawling [Media Capture and Streams Extensions](https://w3c.github.io/mediacapture-extensions/), the following partial definitions were found with an exposure set that is not a subset of the exposure set of the partial’s original interface or namespace:
* [ ] The `[Exposed]` extended attribute of the partial interface `MediaStreamTrack` references globals on which the original interface is not exposed: DedicatedWorker (original exposure: Window)
* [ ] The `[Exposed]` extended attribute of the partial interface `MediaStream` references globals on which the original interface is not exposed: DedicatedWorker (original exposure: Window)

See the [`[Exposed]`](https://webidl.spec.whatwg.org/#Exposed) extended attribute section in Web IDL for requirements.

<sub>Cc @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
