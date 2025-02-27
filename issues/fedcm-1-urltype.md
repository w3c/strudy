---
Title: Wrong Web IDL type for URLs in Federated Credential Management API
Tracked: N/A
Repo: 'https://github.com/w3c-fedid/FedCM'
---

While crawling [Federated Credential Management API](https://w3c-fedid.github.io/FedCM/), wrong Web IDL type for URLs:
* [ ] `field provider_urls` in dictionary `IdentityProviderWellKnown` uses `DOMString` instead of recommended `USVString` for URLs

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
