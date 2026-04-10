import { execa } from 'execa'

export class HelpExecutionTimeoutError extends Error {
  constructor(command: string, timeoutMs: number) {
    super(`Timed out running ${command} --help after ${timeoutMs}ms`)
    this.name = 'HelpExecutionTimeoutError'
  }
}

export async function runHelpCommand(commandPath: string[], timeoutMs: number): Promise<string> {
  const [binary, ...args] = commandPath
  const fullArgs = [...args, '--help']

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
    if (error instanceof Error && /timed out/i.test(error.message)) {
      throw new HelpExecutionTimeoutError(commandPath.join(' '), timeoutMs)
    }

    throw error
  }
}
