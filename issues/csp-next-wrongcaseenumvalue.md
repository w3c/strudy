---
Title: Enum values that ignore naming conventions in Scripting Policy
Tracked: N/A
Repo: 'https://github.com/WICG/csp-next'
---

While crawling [Scripting Policy](https://wicg.github.io/csp-next/scripting-policy.html), the following enum values were found to ignore naming conventions (lower case, hyphen separated words):
* [ ] The value `"externalScript"` of the enum `ScriptingPolicyViolationType` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"inlineScript"` of the enum `ScriptingPolicyViolationType` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"inlineEventHandler"` of the enum `ScriptingPolicyViolationType` does not match the expected conventions (lower case, hyphen separated words)

See [Use casing rules consistent with existing APIs](https://w3ctag.github.io/design-principles/#casing-rules) in Web Platform Design Principles document for guidance.

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
