---
Title: Wrong Web IDL type for URLs in Web App Launch Handler API
Tracked: N/A
Repo: 'https://github.com/WICG/web-app-launch'
---

While crawling [Web App Launch Handler API](https://wicg.github.io/web-app-launch/), wrong Web IDL type for URLs:
* [ ] `attribute targetURL` in interface `LaunchParams` uses `DOMString` instead of recommended `USVString` for URLs

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
