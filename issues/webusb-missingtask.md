---
Title: Missing tasks in parallel steps in WebUSB API
Tracked: 'https://github.com/WICG/webusb/issues/253'
Repo: 'https://github.com/WICG/webusb'
---

While crawling [WebUSB API](https://wicg.github.io/webusb/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The algorithm that starts with "The getDevices() method, when invoked, MUST return a new Promise and run the following steps in parallel:" resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [request the "usb" permission](https://wicg.github.io/webusb/#request-the-usb-permission) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [USBDevice.open()](https://wicg.github.io/webusb/#dom-usbdevice-open) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [USBDevice.close()](https://wicg.github.io/webusb/#dom-usbdevice-close) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [USBDevice.forget()](https://wicg.github.io/webusb/#dom-usbdevice-forget) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [USBDevice.selectConfiguration(configurationValue)](https://wicg.github.io/webusb/#dom-usbdevice-selectconfiguration) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [USBDevice.claimInterface(interfaceNumber)](https://wicg.github.io/webusb/#dom-usbdevice-claiminterface) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [USBDevice.releaseInterface(interfaceNumber)](https://wicg.github.io/webusb/#dom-usbdevice-releaseinterface) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [USBDevice.selectAlternateInterface(interfaceNumber, alternateSetting)](https://wicg.github.io/webusb/#dom-usbdevice-selectalternateinterface) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [USBDevice.controlTransferIn(setup, length)](https://wicg.github.io/webusb/#dom-usbdevice-controltransferin) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [USBDevice.controlTransferOut(setup, data)](https://wicg.github.io/webusb/#dom-usbdevice-controltransferout) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [USBDevice.clearHalt(direction, endpointNumber)](https://wicg.github.io/webusb/#dom-usbdevice-clearhalt) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [USBDevice.transferIn(endpointNumber, length)](https://wicg.github.io/webusb/#dom-usbdevice-transferin) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [USBDevice.transferOut(endpointNumber, data)](https://wicg.github.io/webusb/#dom-usbdevice-transferout) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [USBDevice.isochronousTransferIn(endpointNumber, packetLengths)](https://wicg.github.io/webusb/#dom-usbdevice-isochronoustransferin) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [USBDevice.isochronousTransferOut(endpointNumber, data, packetLengths)](https://wicg.github.io/webusb/#dom-usbdevice-isochronoustransferout) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [USBDevice.reset()](https://wicg.github.io/webusb/#dom-usbdevice-reset) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
