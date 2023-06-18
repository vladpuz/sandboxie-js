# sandboxie-js

Sandboxie CLI client for automated sandbox management. Internally it works with `Sandboxie.ini` and `Start.exe`.

You can check out the official documentation here:

- [Sandboxie.ini](https://github.com/sandboxie-plus/sandboxie-docs/blob/main/Content/SandboxieIni.md)
- [Start.exe](https://github.com/sandboxie-plus/sandboxie-docs/blob/main/Content/StartCommandLine.md)

TypeDoc documentation is available on [wiki](https://github.com/vladislav-puzyrev/proxy-string-parser/wiki).

## Requirements

Running [Sandboxie](https://github.com/sandboxie-plus/Sandboxie/releases/latest) in the system. Allowed installed
or portable versions of `Plus` and `Classic`.

## Install

```bash
npm install sandboxie-js
```

## Usage

```javascript
import Sandboxie from 'sandboxie-js'

// Sandboxie constructor accepts optional SandboxieOptions object
// Default values are shown below
const sandboxie = new Sandboxie({
  delay: 2000,
  classic: false,
  portable: false,
  clientPath: this.classic ? 'C:/Program Files/Sandboxie' : 'C:/Program Files/Sandboxie-Plus',
  configPath: this.portable ? `${this.clientPath}/Sandboxie.ini` : 'C:/Windows/Sandboxie.ini'
})

const name = 'TestBox'
const names = Array.from(new Array(5), (item, i) => `TestBox${i + 1}`)
const program = ['/hide_window', 'C:/Windows/System32/notepad.exe']
const settings = `
Enabled=y
BlockNetworkFiles=y
RecoverFolder=%{374DE290-123F-4565-9164-39C4925E467B}%
RecoverFolder=%Personal%
RecoverFolder=%Desktop%
BorderColor=#00FFFF,ttl
Template=OpenBluetooth
Template=SkipHook
Template=FileCopy
Template=qWave
Template=BlockPorts
Template=LingerPrograms
Template=AutoRecoverIgnore
ConfigLevel=9
`

// Create sandbox(es)
await sandboxie.create(name, settings)
await sandboxie.createMany(names.map((name) => ({ name, settings })))

// List of sandboxes
const sandboxes = await sandboxie.sandboxes()
console.log(sandboxes)

// Run the program(s) in the sandbox(es)
await sandboxie.start(name, program)
await sandboxie.startMany(names.map((name) => ({ name, program })))

// List of pids
const pids = await sandboxie.pids(name)
console.log(pids)

// Stop the program(s) in the sandbox(es)
await sandboxie.stop(name)
await sandboxie.stopAll()

// Delete sandbox(es)
await sandboxie.remove(name)
await sandboxie.removeAll()

// Manual reload of Sandboxie.ini
// Automatically called inside create(Many) and remove(All)
await sandboxie.reload()
```

## Caveats

### Race condition

For some reason, executing the `remove(All)` and `stop(All)` methods without delay causes Sandboxie errors and crashes,
so inside these methods `setTimeout` is used with `delay: 2000` by default.

You can remove the delay by setting the `delay: 0` property, or increase it when errors occur.

This is most likely due to the fact that `Start.exe` passes the request to the `SbieSvc.exe` service and returns control
not waiting for his work to finish.

### Parallelization

Do not execute the `create(Many)` and `remove(All)` methods in parallel using `Promise.all()`. They work
with `Sandboxie.ini` and this can lead to an error in writing to the `EBUSY` file at the same time.
