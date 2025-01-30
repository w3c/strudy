---
Title: '[web-bluetooth] Missing tasks in parallel steps in Web Bluetooth'
Tracked: 'https://github.com/WebBluetoothCG/web-bluetooth/issues/641'
Repo: 'https://github.com/WebBluetoothCG/web-bluetooth'
---

While crawling [Web Bluetooth](https://webbluetoothcg.github.io/web-bluetooth/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [getDevice invocation](https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetooth-getdevices) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [requestDevice invocation](https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetooth-requestdevice) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [query Bluetooth cache](https://webbluetoothcg.github.io/web-bluetooth/#query-the-bluetooth-cache) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [BluetoothRemoteGATTServer connect](https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetoothremotegattserver-connect) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [BluetoothRemoteGATTService construction](https://webbluetoothcg.github.io/web-bluetooth/#create-a-bluetoothremotegattservice-representing) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [BluetoothRemoteGATTCharacteristic constructor](https://webbluetoothcg.github.io/web-bluetooth/#create-a-bluetoothremotegattcharacteristic-representing) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [BluetoothRemoteGATTCharacteristic readValue()](https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetoothremotegattcharacteristic-readvalue) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [Write Characteristic value](https://webbluetoothcg.github.io/web-bluetooth/#writecharacteristicvalue) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [BluetoothRemoteGATTCharacteristic startNotifications](https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetoothremotegattcharacteristic-startnotifications) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [BluetoothCharacteristicProperties constructor](https://webbluetoothcg.github.io/web-bluetooth/#create-a-bluetoothcharacteristicproperties-instance-from-the-characteristic) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [BluetoothRemoteGATTDescriptor constructor](https://webbluetoothcg.github.io/web-bluetooth/#create-a-bluetoothremotegattdescriptor-representing) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [BluetoothRemoteGATTDescriptor readValue](https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetoothremotegattdescriptor-readvalue) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [BluetoothRemoteGATTDescriptor writeValue](https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetoothremotegattdescriptor-writevalue) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
