---
Title: Enum values that ignore naming conventions in Navigation Timing Level 2
Tracked: >-
  back_forward kept for backwards compat, see
  https://github.com/w3c/navigation-timing/issues/204#issuecomment-2341052363
Repo: 'https://github.com/w3c/navigation-timing'
---

While crawling [Navigation Timing Level 2](https://w3c.github.io/navigation-timing/), the following enum values were found to ignore naming conventions (lower case, hyphen separated words):
* [ ] The value `"back_forward"` of the enum `NavigationTimingType` does not match the expected conventions (lower case, hyphen separated words)

See [Use casing rules consistent with existing APIs](https://w3ctag.github.io/design-principles/#casing-rules) in Web Platform Design Principles document for guidance.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
