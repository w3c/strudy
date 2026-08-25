---
Title: Broken links in HTML Ruby Markup Extensions
Tracked: 'https://github.com/w3c/html-ruby/issues/48'
Repo: 'https://github.com/w3c/html-ruby'
---

While crawling [HTML Ruby Markup Extensions](https://w3c.github.io/html-ruby/), the following links to other specifications were detected as pointing to non-existing anchors:
* [ ] https://w3c.github.io/html-aam/#el-ruby
* [ ] https://w3c.github.io/html-aam/#el-rt
* [ ] https://w3c.github.io/html-aam/#el-rp

The anchors actually exist, but they get lost during the redirection as the HTML Accessibility API Mappings 1.0 specification moved to a new repository. Updating the URLs to use https://w3c.github.io/aria/html-aam/ would fix the issue.

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
