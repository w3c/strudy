---
Title: '[cssom-1] Wrong Web IDL type for URLs in CSS Object Model (CSSOM)'
Tracked: 'https://github.com/w3c/csswg-drafts/issues/11447'
Repo: 'https://github.com/w3c/csswg-drafts'
---

While crawling [CSS Object Model (CSSOM)](https://drafts.csswg.org/cssom-1/), wrong Web IDL type for URLs:
* [ ] `field baseURL` in dictionary `CSSStyleSheetInit` uses `DOMString` instead of recommended `USVString` for URLs

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
