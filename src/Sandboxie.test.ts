import fs from 'fs/promises'
import Sandboxie, { type RemoveOptions } from './index.js'

const sandboxie = new Sandboxie()
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

const processedSettings = settings.trim().replaceAll('\n', sandboxie.configLineBreak)

describe('Sandboxie', () => {
  beforeAll(async () => {
    await sandboxie.reload()
    await sandboxie.stopAll()
    await sandboxie.removeAll()
  })

  describe('constructor', () => {
    test('plus version', () => {
      const sandboxie = new Sandboxie()
      expect(sandboxie.clientPath).toBe('C:/Program Files/Sandboxie-Plus')
    })

    test('classic version', () => {
      const sandboxie = new Sandboxie({ classic: true })
      expect(sandboxie.clientPath).toBe('C:/Program Files/Sandboxie')
    })

    test('installed mode', () => {
      const sandboxie = new Sandboxie()
      expect(sandboxie.configPath).toBe('C:/Windows/Sandboxie.ini')
    })

    test('portable mode', () => {
      const sandboxie = new Sandboxie({ portable: true })
      expect(sandboxie.configPath).toBe(`${sandboxie.clientPath}/Sandboxie.ini`)
    })
  })

  describe('create', () => {
    afterEach(async () => {
      await sandboxie.remove(name)
    })

    const create = async (): Promise<void> => {
      const before = await fs.readFile(sandboxie.configPath, { encoding: sandboxie.configEncoding })

      await sandboxie.create(name, settings)
      const after = await fs.readFile(sandboxie.configPath, { encoding: sandboxie.configEncoding })

      if (before.includes(`[${name}]`)) {
        return
      }

      const expected = before + `[${name}]` + sandboxie.configLineBreak + processedSettings + sandboxie.configLineBreak.repeat(2)
      expect(after).toBe(expected)
    }

    test('basic call', async () => {
      await create()
    })

    test('duplicate call', async () => {
      await create()
      await create()
    })
  })

  describe('createMany', () => {
    afterEach(async () => {
      await sandboxie.removeAll()
    })

    const createMany = async (): Promise<void> => {
      const before = await fs.readFile(sandboxie.configPath, { encoding: sandboxie.configEncoding })

      await sandboxie.createMany(names.map((name) => ({ name, settings })))
      const after = await fs.readFile(sandboxie.configPath, { encoding: sandboxie.configEncoding })

      let newSandboxes = ''

      names.forEach((name) => {
        if (before.includes(`[${name}]`)) {
          return
        }

        const newSandbox = `[${name}]` + sandboxie.configLineBreak + processedSettings + sandboxie.configLineBreak.repeat(2)
        newSandboxes += newSandbox
      })

      const expected = before + newSandboxes
      expect(after).toBe(expected)
    }

    test('basic call', async () => {
      await createMany()
    })

    test('duplicate call', async () => {
      await createMany()
      await createMany()
    })
  })

  describe('remove', () => {
    beforeEach(async () => {
      await sandboxie.create(name, settings)
    })

    const remove = async (options?: RemoveOptions | null): Promise<void> => {
      const before = await fs.readFile(sandboxie.configPath, { encoding: sandboxie.configEncoding })

      await sandboxie.remove(name, options)
      const after = await fs.readFile(sandboxie.configPath, { encoding: sandboxie.configEncoding })

      const startString = `[${name}]`
      const endString = sandboxie.configLineBreak.repeat(2)
      const startPosition = before.indexOf(startString, 0)
      const endPosition = before.indexOf(endString, startPosition) + endString.length

      if (startPosition === -1 || endPosition === -1) {
        return
      }

      const expected = before.slice(0, startPosition) + before.slice(endPosition)
      expect(after).toBe(expected)
    }

    test('basic call', async () => {
      await remove()
    })

    test('duplicate call', async () => {
      await remove()
      await remove()
    })

    test('silent command', async () => {
      await remove({ silent: true })
    })
  })

  describe('removeAll', () => {
    beforeEach(async () => {
      await sandboxie.createMany(names.map((name) => ({ name, settings })))
    })

    test('basic call', async () => {
      await sandboxie.removeAll()
      const sandboxes = await sandboxie.sandboxes()
      expect(sandboxes.length).toBe(0)
    })

    test('duplicate call', async () => {
      await sandboxie.removeAll()
      await sandboxie.removeAll()
      const sandboxes = await sandboxie.sandboxes()
      expect(sandboxes.length).toBe(0)
    })

    test('silent command', async () => {
      await sandboxie.removeAll({ silent: true })
      const sandboxes = await sandboxie.sandboxes()
      expect(sandboxes.length).toBe(0)
    })
  })

  describe('start', () => {
    beforeEach(async () => {
      await sandboxie.create(name, settings)
    })

    afterEach(async () => {
      await sandboxie.stop(name)
      await sandboxie.remove(name)
    })

    test('basic call', async () => {
      await sandboxie.start(name, program)
    })

    test('duplicate call', async () => {
      await sandboxie.start(name, program)
      await sandboxie.start(name, program)
    })
  })

  describe('startMany', () => {
    beforeEach(async () => {
      await sandboxie.createMany(names.map((name) => ({ name, settings })))
    })

    afterEach(async () => {
      await sandboxie.stopAll()
      await sandboxie.removeAll()
    })

    test('basic call', async () => {
      await sandboxie.startMany(names.map((name) => ({ name, program })))
    })

    test('duplicate call', async () => {
      await sandboxie.startMany(names.map((name) => ({ name, program })))
      await sandboxie.startMany(names.map((name) => ({ name, program })))
    })
  })

  describe('stop', () => {
    beforeEach(async () => {
      await sandboxie.create(name, settings)
      await sandboxie.start(name, program)
    })

    afterEach(async () => {
      await sandboxie.remove(name)
    })

    test('basic call', async () => {
      await sandboxie.stop(name)
    })

    test('duplicate call', async () => {
      await sandboxie.stop(name)
      await sandboxie.stop(name)
    })
  })

  describe('stopAll', () => {
    beforeEach(async () => {
      await sandboxie.create(name, settings)
      await sandboxie.startMany(names.map(() => ({ name, program })))
    })

    afterEach(async () => {
      await sandboxie.remove(name)
    })

    test('basic call', async () => {
      await sandboxie.stopAll()
    })

    test('duplicate call', async () => {
      await sandboxie.stopAll()
      await sandboxie.stopAll()
    })
  })

  describe('sandboxes', () => {
    beforeEach(async () => {
      await sandboxie.createMany(names.map((name) => ({ name, settings })))
    })

    afterEach(async () => {
      await sandboxie.removeAll()
    })

    test('basic call', async () => {
      const sandboxes = await sandboxie.sandboxes()
      expect(sandboxes.length).toBe(names.length)
    })

    test('duplicate call', async () => {
      const firstSandboxes = await sandboxie.sandboxes()
      const secondSandboxes = await sandboxie.sandboxes()
      expect(firstSandboxes).toStrictEqual(secondSandboxes)
    })
  })

  describe('pids', () => {
    beforeEach(async () => {
      await sandboxie.create(name, settings)
      await sandboxie.start(name, program)
    })

    afterEach(async () => {
      await sandboxie.stop(name)
      await sandboxie.remove(name)
    })

    test('basic call', async () => {
      const pids = await sandboxie.pids(name)
      expect(pids.length).toBeGreaterThan(0)
    })

    test('duplicate call', async () => {
      const firstPids = await sandboxie.pids(name)
      const secondPids = await sandboxie.pids(name)
      expect(firstPids).toStrictEqual(secondPids)
    })
  })

  describe('reload', () => {
    test('basic call', async () => {
      await sandboxie.reload()
    })

    test('duplicate call', async () => {
      await sandboxie.reload()
      await sandboxie.reload()
    })
  })
})
