---
Title: Enum values that ignore naming conventions in The HTML Permission Elements
Tracked: N/A
Repo: 'https://github.com/WICG/PEPC'
---

While crawling [The HTML Permission Elements](https://wicg.github.io/PEPC/permission-elements.html), the following enum values were found to ignore naming conventions (lower case, hyphen separated words):
* [ ] The value `"illegal_subframe"` of the enum `InPagePermissionMixinBlockerReason` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"unsuccesful_registration"` of the enum `InPagePermissionMixinBlockerReason` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"recently_attached"` of the enum `InPagePermissionMixinBlockerReason` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"intersection_changed"` of the enum `InPagePermissionMixinBlockerReason` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"intersection_out_of_viewport_or_clipped"` of the enum `InPagePermissionMixinBlockerReason` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"intersection_occluded_or_distorted"` of the enum `InPagePermissionMixinBlockerReason` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"style_invalid"` of the enum `InPagePermissionMixinBlockerReason` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"type_invalid"` of the enum `InPagePermissionMixinBlockerReason` does not match the expected conventions (lower case, hyphen separated words)

See [Use casing rules consistent with existing APIs](https://w3ctag.github.io/design-principles/#casing-rules) in Web Platform Design Principles document for guidance.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
