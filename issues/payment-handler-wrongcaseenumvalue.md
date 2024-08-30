---
Title: Enum values that ignore naming conventions in Payment Handler API
Tracked: N/A
Repo: 'https://github.com/w3c/payment-handler'
---

While crawling [Payment Handler API](https://w3c.github.io/payment-handler/), the following enum values were found to ignore naming conventions (lower case, hyphen separated words):
* [ ] The value `"shippingAddress"` of the enum `PaymentDelegation` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"payerName"` of the enum `PaymentDelegation` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"payerPhone"` of the enum `PaymentDelegation` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"payerEmail"` of the enum `PaymentDelegation` does not match the expected conventions (lower case, hyphen separated words)

See [Use casing rules consistent with existing APIs](https://w3ctag.github.io/design-principles/#casing-rules) in Web Platform Design Principles document for guidance.

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
