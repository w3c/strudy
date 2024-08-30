---
Title: >-
  [shape-detection-api] Enum values that ignore naming conventions in
  Accelerated Shape Detection in Images
Tracked: N/A
Repo: 'https://github.com/WICG/shape-detection-api'
---

While crawling [Accelerated Shape Detection in Images](https://wicg.github.io/shape-detection-api/), the following enum values were found to ignore naming conventions (lower case, hyphen separated words):
* [ ] The value `"code_128"` of the enum `BarcodeFormat` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"code_39"` of the enum `BarcodeFormat` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"code_93"` of the enum `BarcodeFormat` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"data_matrix"` of the enum `BarcodeFormat` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"ean_13"` of the enum `BarcodeFormat` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"ean_8"` of the enum `BarcodeFormat` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"qr_code"` of the enum `BarcodeFormat` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"upc_a"` of the enum `BarcodeFormat` does not match the expected conventions (lower case, hyphen separated words)
* [ ] The value `"upc_e"` of the enum `BarcodeFormat` does not match the expected conventions (lower case, hyphen separated words)

See [Use casing rules consistent with existing APIs](https://w3ctag.github.io/design-principles/#casing-rules) in Web Platform Design Principles document for guidance.

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
