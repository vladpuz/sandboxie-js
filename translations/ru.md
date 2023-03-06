# sandboxie-js

Sandboxie CLI клиент для автоматизированного управления песочницами. Внутри он работает с `Sandboxie.ini` и `Start.exe`.

Вы можете ознакомиться с официальной документацией здесь:

- [Sandboxie.ini](https://github.com/sandboxie-plus/sandboxie-docs/blob/main/Content/SandboxieIni.md)
- [Start.exe](https://github.com/sandboxie-plus/sandboxie-docs/blob/main/Content/StartCommandLine.md)

TypeDoc документация доступна на [wiki](https://github.com/vladislav-puzyrev/proxy-string-parser/wiki).

## Требования

Запущенный в системе [Sandboxie](https://github.com/sandboxie-plus/Sandboxie/releases/latest). Допускаются установленные
или портативные версии `Plus` и `Classic`.

## Установка

Используя npm:

```bash
npm install sandboxie-js
```

Используя yarn:

```bash
yarn add sandboxie-js
```

## Использование

```javascript
import Sandboxie from 'sandboxie-js'

// Конструктор Sandboxie принимает опциональный объект SandboxieOptions
// Значения по умолчанию представлены ниже
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

// Создать песочницу(ы)
await sandboxie.create(name, settings)
await sandboxie.createMany(names.map((name) => ({ name, settings })))

// Список песочниц
const sandboxes = await sandboxie.sandboxes()
console.log(sandboxes)

// Запустить программу(ы) в песочнице(ах)
await sandboxie.start(name, program)
await sandboxie.startMany(names.map((name) => ({ name, program })))

// Список pids
const pids = await sandboxie.pids(name)
console.log(pids)

// Остановить программу(ы) в песочнице(ах)
await sandboxie.stop(name)
await sandboxie.stopAll()

// Удалить песочницу(ы)
await sandboxie.remove(name)
await sandboxie.removeAll()

// Ручная перезагрузка Sandboxie.ini
// Автоматически вызывается внутри create(Many) и remove(All)
await sandboxie.reload()
```

## Предостережения

### Состояние гонки

По какой-то причине выполнение методов `remove(All)` и `stop(All)` без задержки вызывает ошибки и краши Sandboxie,
поэтому внутри этих методов используется `setTimeout` с `delay: 2000` по умолчанию.

Вы можете убрать задержку установив свойство `delay: 0`, или увеличить ее при появлении ошибок.

Скорее всего это связано с тем что `Start.exe` передает запрос сервису `SbieSvc.exe` и возвращает управление не
дожидаясь окончания его работы.

### Распараллеливание

Не выполняйте методы `create(Many)` и `remove(All)` параллельно используя `Promise.all()`. Они работают
с `Sandboxie.ini` и это может привести к ошибке одновременной записи в файл `EBUSY`.
