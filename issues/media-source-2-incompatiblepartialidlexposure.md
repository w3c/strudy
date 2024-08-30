---
Title: >-
  Incompatible `[Exposed]` attribute in partial definitions in Media Source
  Extensions™
Tracked: https://github.com/w3c/media-source/issues/280
Repo: 'https://github.com/w3c/media-source'
---

While crawling [Media Source Extensions™](https://w3c.github.io/media-source/), the following partial definitions were found with an exposure set that is not a subset of the exposure set of the partial’s original interface or namespace:
* [ ] The `[Exposed]` extended attribute of the partial interface `AudioTrack` references globals on which the original interface is not exposed: DedicatedWorker (original exposure: Window)
* [ ] The `[Exposed]` extended attribute of the partial interface `VideoTrack` references globals on which the original interface is not exposed: DedicatedWorker (original exposure: Window)
* [ ] The `[Exposed]` extended attribute of the partial interface `TextTrack` references globals on which the original interface is not exposed: DedicatedWorker (original exposure: Window)

See the [`[Exposed]`](https://webidl.spec.whatwg.org/#Exposed) extended attribute section in Web IDL for requirements.

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
