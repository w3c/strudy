---
Title: Wrong Web IDL type for URLs in Element Timing API
Tracked: N/A
Repo: 'https://github.com/WICG/element-timing'
---

While crawling [Element Timing API](https://w3c.github.io/element-timing/), wrong Web IDL type for URLs:
* [ ] `attribute url` in interface `PerformanceElementTiming` uses `DOMString` instead of recommended `USVString` for URLs

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
