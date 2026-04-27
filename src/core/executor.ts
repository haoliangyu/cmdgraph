import { execa } from 'execa'

const helpCommandCache = new Map<string, Promise<string>>()
const versionCommandCache = new Map<string, Promise<string>>()

export class HelpExecutionTimeoutError extends Error {
  constructor(command: string, timeoutMs: number) {
    super(`Timed out running ${command} --help after ${timeoutMs}ms`)
    this.name = 'HelpExecutionTimeoutError'
  }
}

export class VersionExecutionTimeoutError extends Error {
  constructor(command: string, timeoutMs: number) {
    super(`Timed out probing ${command} version after ${timeoutMs}ms`)
    this.name = 'VersionExecutionTimeoutError'
  }
}

function cacheKey(commandPath: string[], timeoutMs: number): string {
  return `${commandPath.join('\u0000')}::${timeoutMs}`
}

export function clearHelpCommandCache(): void {
  helpCommandCache.clear()
}

export function clearVersionCommandCache(): void {
  versionCommandCache.clear()
}

export async function runHelpCommand(commandPath: string[], timeoutMs: number): Promise<string> {
  const key = cacheKey(commandPath, timeoutMs)
  const cached = helpCommandCache.get(key)
  if (cached) {
    return cached
  }

  const [binary, ...args] = commandPath

  const pending = (async () => {
    try {
      const attempts = [[...args, '--help'], [...args, '-h'], [...args, '-H'], [...args, 'help']]

      for (const fullArgs of attempts) {
        const result = await execa(binary, fullArgs, {
          timeout: timeoutMs,
          all: true,
          reject: false,
          env: {
            ...process.env,
            CI: '1',
            NO_COLOR: '1',
          },
          stdin: 'ignore',
        })

        const output = (result.all ?? '').trim()
        if (output) {
          return output
        }
      }

      return ''
    } catch (error) {
      helpCommandCache.delete(key)

      if (error instanceof Error && /timed out/i.test(error.message)) {
        throw new HelpExecutionTimeoutError(commandPath.join(' '), timeoutMs)
      }

      throw error
    }
  })()

  helpCommandCache.set(key, pending)
  return pending
}

export async function runVersionCommand(commandPath: string[], timeoutMs: number): Promise<string> {
  const key = cacheKey(commandPath, timeoutMs)
  const cached = versionCommandCache.get(key)
  if (cached) {
    return cached
  }

  const [binary, ...args] = commandPath

  const pending = (async () => {
    try {
      const attempts = [[...args, '-v'], [...args, '--version'], [...args, 'version']]

      for (const fullArgs of attempts) {
        const result = await execa(binary, fullArgs, {
          timeout: timeoutMs,
          all: true,
          reject: false,
          env: {
            ...process.env,
            CI: '1',
            NO_COLOR: '1',
          },
          stdin: 'ignore',
        })

        const output = (result.all ?? '').trim()
        if (output) {
          return output
        }
      }

      return ''
    } catch (error) {
      versionCommandCache.delete(key)

      if (error instanceof Error && /timed out/i.test(error.message)) {
        throw new VersionExecutionTimeoutError(commandPath.join(' '), timeoutMs)
      }

      throw error
    }
  })()

  versionCommandCache.set(key, pending)
  return pending
}
