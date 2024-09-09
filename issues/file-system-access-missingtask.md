---
Title: Missing tasks in parallel steps in File System Access
Tracked: 'https://github.com/WICG/file-system-access/issues/448'
Repo: 'https://github.com/WICG/file-system-access'
---

While crawling [File System Access](https://wicg.github.io/file-system-access/), the following algorithms fire an event, or resolve or reject a Promise, within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task:
* [ ] The [FileSystemHandle/queryPermission(descriptor)](https://wicg.github.io/file-system-access/#dom-filesystemhandle-querypermission) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [FileSystemHandle/requestPermission(descriptor)](https://wicg.github.io/file-system-access/#dom-filesystemhandle-requestpermission) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [Window/showOpenFilePicker(options)](https://wicg.github.io/file-system-access/#dom-window-showopenfilepicker) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [Window/showSaveFilePicker(options)](https://wicg.github.io/file-system-access/#dom-window-showsavefilepicker) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [Window/showDirectoryPicker(options)](https://wicg.github.io/file-system-access/#dom-window-showdirectorypicker) algorithm resolves/rejects a promise directly in a step that runs in parallel
* [ ] The [DataTransferItem/getAsFileSystemHandle()](https://wicg.github.io/file-system-access/#dom-datatransferitem-getasfilesystemhandle) algorithm resolves/rejects a promise directly in a step that runs in parallel

See [Dealing with the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-for-spec-authors) in the HTML specification for guidance on how to deal with algorithm sections that run *in parallel*.

<sub>Cc @dontcallmedom @tidoust</sub>

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>
