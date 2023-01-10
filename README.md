# sandboxie-js

Sandboxie CLI client for automated sandbox management. Internally it works with `Sandboxie.ini` and `Start.exe`.

You can check out the official documentation here:

- [Sandboxie.ini](https://github.com/sandboxie-plus/sandboxie-docs/blob/main/Content/SandboxieIni.md)
- [Start.exe](https://github.com/sandboxie-plus/sandboxie-docs/blob/main/Content/StartCommandLine.md)

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
  clientPath: this.classic ? 'C:/Program Files/Sandboxie-Plus' : 'C:/Program Files/Sandboxie-Plus',
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

# API

## Table of contents

### Classes

- [default](#classesdefaultmd)

### Interfaces

- [RemoveOptions](#interfacesremoveoptionsmd)
- [Sandbox](#interfacessandboxmd)
- [SandboxieOptions](#interfacessandboxieoptionsmd)
- [Start](#interfacesstartmd)

# Class: default

## Table of contents

### Constructors

- [constructor](#constructor)

### Properties

- [classic](#classic)
- [clientPath](#clientpath)
- [configEncoding](#configencoding)
- [configLineBreak](#configlinebreak)
- [configPath](#configpath)
- [delay](#delay)
- [portable](#portable)

### Methods

- [create](#create)
- [createMany](#createmany)
- [pids](#pids)
- [reload](#reload)
- [remove](#remove)
- [removeAll](#removeall)
- [sandboxes](#sandboxes)
- [start](#start)
- [startMany](#startmany)
- [stop](#stop)
- [stopAll](#stopall)

## Constructors

### constructor

• **new default**(`options?`)

#### Parameters

| Name       | Type       |
|:-----------|:-----------|
| `options?` | ``null`` \ | [`SandboxieOptions`](#interfacessandboxieoptionsmd) |

#### Defined in

[Sandboxie.ts:18](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L18)

## Properties

### classic

• `Readonly` **classic**: `boolean`

#### Defined in

[Sandboxie.ts:11](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L11)

___

### clientPath

• `Readonly` **clientPath**: `string`

#### Defined in

[Sandboxie.ts:13](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L13)

___

### configEncoding

• `Readonly` **configEncoding**: ``"utf16le"``

#### Defined in

[Sandboxie.ts:15](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L15)

___

### configLineBreak

• `Readonly` **configLineBreak**: ``"\r\n"``

#### Defined in

[Sandboxie.ts:16](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L16)

___

### configPath

• `Readonly` **configPath**: `string`

#### Defined in

[Sandboxie.ts:14](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L14)

___

### delay

• `Readonly` **delay**: `number`

#### Defined in

[Sandboxie.ts:10](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L10)

___

### portable

• `Readonly` **portable**: `boolean`

#### Defined in

[Sandboxie.ts:12](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L12)

## Methods

### create

▸ **create**(`name`, `settings`): `Promise`<`void`\>

#### Parameters

| Name       | Type     |
|:-----------|:---------|
| `name`     | `string` |
| `settings` | `string` |

#### Returns

`Promise`<`void`\>

#### Defined in

[Sandboxie.ts:28](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L28)

___

### createMany

▸ **createMany**(`sandboxes`): `Promise`<`void`\>

#### Parameters

| Name        | Type                                |
|:------------|:------------------------------------|
| `sandboxes` | [`Sandbox`](#interfacessandboxmd)[] |

#### Returns

`Promise`<`void`\>

#### Defined in

[Sandboxie.ts:42](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L42)

___

### pids

▸ **pids**(`name`): `Promise`<`number`[]\>

#### Parameters

| Name   | Type     |
|:-------|:---------|
| `name` | `string` |

#### Returns

`Promise`<`number`[]\>

#### Defined in

[Sandboxie.ts:165](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L165)

___

### reload

▸ **reload**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[Sandboxie.ts:173](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L173)

___

### remove

▸ **remove**(`name`, `options?`): `Promise`<`void`\>

#### Parameters

| Name       | Type       |
|:-----------|:-----------|
| `name`     | `string`   |
| `options?` | ``null`` \ | [`RemoveOptions`](#interfacesremoveoptionsmd) |

#### Returns

`Promise`<`void`\>

#### Defined in

[Sandboxie.ts:60](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L60)

___

### removeAll

▸ **removeAll**(`options?`): `Promise`<`void`\>

#### Parameters

| Name       | Type       |
|:-----------|:-----------|
| `options?` | ``null`` \ | [`RemoveOptions`](#interfacesremoveoptionsmd) |

#### Returns

`Promise`<`void`\>

#### Defined in

[Sandboxie.ts:81](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L81)

___

### sandboxes

▸ **sandboxes**(): `Promise`<[`Sandbox`](#interfacessandboxmd)[]\>

#### Returns

`Promise`<[`Sandbox`](#interfacessandboxmd)[]\>

#### Defined in

[Sandboxie.ts:127](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L127)

___

### start

▸ **start**(`name`, `program`): `Promise`<`void`\>

#### Parameters

| Name      | Type       |
|:----------|:-----------|
| `name`    | `string`   |
| `program` | `string`[] |

#### Returns

`Promise`<`void`\>

#### Defined in

[Sandboxie.ts:108](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L108)

___

### startMany

▸ **startMany**(`starts`): `Promise`<`void`\>

#### Parameters

| Name     | Type                            |
|:---------|:--------------------------------|
| `starts` | [`Start`](#interfacesstartmd)[] |

#### Returns

`Promise`<`void`\>

#### Defined in

[Sandboxie.ts:112](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L112)

___

### stop

▸ **stop**(`name`): `Promise`<`void`\>

#### Parameters

| Name   | Type     |
|:-------|:---------|
| `name` | `string` |

#### Returns

`Promise`<`void`\>

#### Defined in

[Sandboxie.ts:117](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L117)

___

### stopAll

▸ **stopAll**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[Sandboxie.ts:122](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/Sandboxie.ts#L122)

# Interface: RemoveOptions

## Table of contents

### Properties

- [silent](#silent)

## Properties

### silent

• `Optional` **silent**: ``null`` \| `boolean`

#### Defined in

[types/RemoveOptions.ts:2](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/types/RemoveOptions.ts#L2)

# Interface: Sandbox

## Table of contents

### Properties

- [name](#name)
- [settings](#settings)

## Properties

### name

• **name**: `string`

#### Defined in

[types/Sandbox.ts:2](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/types/Sandbox.ts#L2)

___

### settings

• **settings**: `string`

#### Defined in

[types/Sandbox.ts:3](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/types/Sandbox.ts#L3)

# Interface: SandboxieOptions

## Table of contents

### Properties

- [classic](#classic)
- [clientPath](#clientpath)
- [configPath](#configpath)
- [delay](#delay)
- [portable](#portable)

## Properties

### classic

• `Optional` **classic**: ``null`` \| `boolean`

#### Defined in

[types/SandboxieOptions.ts:3](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/types/SandboxieOptions.ts#L3)

___

### clientPath

• `Optional` **clientPath**: ``null`` \| `string`

#### Defined in

[types/SandboxieOptions.ts:5](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/types/SandboxieOptions.ts#L5)

___

### configPath

• `Optional` **configPath**: ``null`` \| `string`

#### Defined in

[types/SandboxieOptions.ts:6](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/types/SandboxieOptions.ts#L6)

___

### delay

• `Optional` **delay**: ``null`` \| `number`

#### Defined in

[types/SandboxieOptions.ts:2](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/types/SandboxieOptions.ts#L2)

___

### portable

• `Optional` **portable**: ``null`` \| `boolean`

#### Defined in

[types/SandboxieOptions.ts:4](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/types/SandboxieOptions.ts#L4)

# Interface: Start

## Table of contents

### Properties

- [name](#name)
- [program](#program)

## Properties

### name

• **name**: `string`

#### Defined in

[types/Start.ts:2](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/types/Start.ts#L2)

___

### program

• **program**: `string`[]

#### Defined in

[types/Start.ts:3](https://github.com/vladislav-puzyrev/sandboxie-js/blob/91ea447/src/types/Start.ts#L3)
