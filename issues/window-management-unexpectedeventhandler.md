---
Title: Missing `EventTarget` inheritances in Window Management
Tracked: N/A
Repo: 'https://github.com/w3c/window-management'
---

While crawling [Window Management](https://w3c.github.io/window-management/), the following event handlers were found on interfaces that do not inherit from `EventTarget`:
* [ ] The interface `Screen` defines an event handler `onchange` but does not inherit from `EventTarget`

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
