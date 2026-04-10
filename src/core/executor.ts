import { execa } from 'execa'

const helpCommandCache = new Map<string, Promise<string>>()

export class HelpExecutionTimeoutError extends Error {
  constructor(command: string, timeoutMs: number) {
    super(`Timed out running ${command} --help after ${timeoutMs}ms`)
    this.name = 'HelpExecutionTimeoutError'
  }
}

function cacheKey(commandPath: string[], timeoutMs: number): string {
  return `${commandPath.join('\u0000')}::${timeoutMs}`
}

export function clearHelpCommandCache(): void {
  helpCommandCache.clear()
}

export async function runHelpCommand(commandPath: string[], timeoutMs: number): Promise<string> {
  const key = cacheKey(commandPath, timeoutMs)
  const cached = helpCommandCache.get(key)
  if (cached) {
    return cached
  }

  const [binary, ...args] = commandPath
  const fullArgs = [...args, '--help']

  const pending = (async () => {
    try {
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

      return (result.all ?? '').trim()
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
