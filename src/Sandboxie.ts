import fs from 'fs-extra'
import { execa } from 'execa'
import { setTimeout } from 'timers/promises'
import { SandboxieOptions } from './types/SandboxieOptions.js'
import { RemoveOptions } from './types/RemoveOptions.js'
import { Sandbox } from './types/Sandbox.js'
import { Start } from './types/Start.js'

class Sandboxie {
  public readonly delay: number
  public readonly classic: boolean
  public readonly portable: boolean
  public readonly clientPath: string
  public readonly configPath: string
  public readonly configEncoding = 'utf-16le'
  public readonly configLineBreak = '\r\n'

  public constructor (options?: SandboxieOptions | null) {
    const { delay, classic, portable, clientPath, configPath } = options ?? {}

    this.delay = delay ?? 2000
    this.classic = Boolean(classic)
    this.portable = Boolean(portable)
    this.clientPath = clientPath ?? (this.classic ? 'C:/Program Files/Sandboxie' : 'C:/Program Files/Sandboxie-Plus')
    this.configPath = configPath ?? (this.portable ? `${this.clientPath}/Sandboxie.ini` : 'C:/Windows/Sandboxie.ini')
  }

  public async create (name: string, settings: string): Promise<void> {
    const config = await fs.readFile(this.configPath, { encoding: this.configEncoding })

    if (config.includes(`[${name}]`)) {
      return
    }

    const processedSettings = settings.trim().replaceAll('\n', this.configLineBreak)
    const newSandbox = `[${name}]` + this.configLineBreak + processedSettings + this.configLineBreak.repeat(2)

    await fs.appendFile(this.configPath, newSandbox, { encoding: this.configEncoding })
    await this.reload()
  }

  public async createMany (sandboxes: Sandbox[]): Promise<void> {
    const config = await fs.readFile(this.configPath, { encoding: this.configEncoding })
    let newSandboxes = ''

    sandboxes.forEach((sandbox) => {
      if (config.includes(`[${sandbox.name}]`)) {
        return
      }

      const processedSettings = sandbox.settings.trim().replaceAll('\n', this.configLineBreak)
      const newSandbox = `[${sandbox.name}]` + this.configLineBreak + processedSettings + this.configLineBreak.repeat(2)
      newSandboxes += newSandbox
    })

    await fs.appendFile(this.configPath, newSandboxes, { encoding: this.configEncoding })
    await this.reload()
  }

  public async remove (name: string, options?: RemoveOptions | null): Promise<void> {
    const config = await fs.readFile(this.configPath, { encoding: this.configEncoding })

    const startString = `[${name}]`
    const endString = this.configLineBreak.repeat(2)
    const startPosition = config.indexOf(startString, 0)
    const endPosition = config.indexOf(endString, startPosition) + endString.length

    if (startPosition === -1 || endPosition === -1) {
      return
    }

    const command = (options?.silent === true) ? 'delete_sandbox_silent' : 'delete_sandbox'
    await execa(`${this.clientPath}/Start.exe`, [`/box:${name}`, command])
    await setTimeout(this.delay)

    const processedConfig = config.slice(0, startPosition) + config.slice(endPosition)
    await fs.writeFile(this.configPath, processedConfig, { encoding: this.configEncoding })
    await this.reload()
  }

  public async removeAll (options?: RemoveOptions | null): Promise<void> {
    const config = await fs.readFile(this.configPath, { encoding: this.configEncoding })
    const sandboxes = await this.sandboxes()

    if (sandboxes.length === 0) {
      return
    }

    let processedConfig = config
    const command = (options?.silent === true) ? 'delete_sandbox_silent' : 'delete_sandbox'

    for (const sandbox of sandboxes) {
      const startString = `[${sandbox.name}]`
      const endString = this.configLineBreak.repeat(2)
      const startPosition = processedConfig.indexOf(startString, 0)
      const endPosition = processedConfig.indexOf(endString, startPosition) + endString.length

      processedConfig = processedConfig.slice(0, startPosition) + processedConfig.slice(endPosition)

      await execa(`${this.clientPath}/Start.exe`, [`/box:${sandbox.name}`, command])
      await setTimeout(this.delay)
    }

    await fs.writeFile(this.configPath, processedConfig, { encoding: this.configEncoding })
    await this.reload()
  }

  public async start (name: string, program: string[]): Promise<void> {
    await execa(`${this.clientPath}/Start.exe`, [`/box:${name}`, ...program], { windowsHide: false })
  }

  public async startMany (starts: Start[]): Promise<void> {
    const startOperations = starts.map(async (start) => await this.start(start.name, start.program))
    await Promise.all(startOperations)
  }

  public async stop (name: string): Promise<void> {
    await execa(`${this.clientPath}/Start.exe`, [`/box:${name}`, '/terminate'])
    await setTimeout(this.delay)
  }

  public async stopAll (): Promise<void> {
    await execa(`${this.clientPath}/Start.exe`, ['/terminate_all'])
    await setTimeout(this.delay)
  }

  public async sandboxes (): Promise<Sandbox[]> {
    const config = await fs.readFile(this.configPath, { encoding: this.configEncoding })

    const startString = '['
    const endString = this.configLineBreak.repeat(2)
    const startPositions: number[] = []
    const endPositions: number[] = []

    const search = (): void => {
      const startPositionsLast = startPositions[startPositions.length - 1]
      const startPosition = config.indexOf(startString, (startPositionsLast != null) ? startPositionsLast + 1 : 0)
      const endPosition = config.indexOf(endString, startPosition) + endString.length

      if (startPosition === -1 || endPosition === -1) {
        return
      }

      startPositions.push(startPosition)
      endPositions.push(endPosition)
      search()
    }

    search()

    return startPositions
      .map((startPosition, i) => {
        const string = config.slice(startPosition, endPositions[i])
        const endLinePosition = string.indexOf(this.configLineBreak)
        const firstLineString = string.slice(0, endLinePosition)

        const name = firstLineString.slice(1, -1)
        const settings = string.slice(endLinePosition).trim()

        return { name, settings }
      })
      .filter((sandbox) => !(sandbox.name.startsWith('GlobalSettings') || sandbox.name.startsWith('UserSettings')))
  }

  public async pids (name: string): Promise<number[]> {
    const response = await execa(`${this.clientPath}/Start.exe`, [`/box:${name}`, '/listpids'])
    return response.stdout
      .split(this.configLineBreak)
      .map((pid) => Number(pid))
      .slice(1)
  }

  public async reload (): Promise<void> {
    await execa(`${this.clientPath}/Start.exe`, ['/reload'])
  }
}

export default Sandboxie
