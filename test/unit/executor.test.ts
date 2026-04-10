import { beforeEach, describe, expect, it, vi } from 'vitest'
import { execa } from 'execa'
import { HelpExecutionTimeoutError, clearHelpCommandCache, runHelpCommand } from '../../src/core/executor.js'

vi.mock('execa', () => ({
  execa: vi.fn(),
}))

describe('runHelpCommand', () => {
  beforeEach(() => {
    clearHelpCommandCache()
    vi.clearAllMocks()
  })

  it('returns command output', async () => {
    vi.mocked(execa).mockResolvedValueOnce({ all: 'help text' } as Awaited<ReturnType<typeof execa>>)

    const output = await runHelpCommand(['git'], 2000)

    expect(output).toBe('help text')
    expect(execa).toHaveBeenCalledWith(
      'git',
      ['--help'],
      expect.objectContaining({ timeout: 2000 }),
    )
  })

  it('throws timeout error when execution times out', async () => {
    vi.mocked(execa).mockRejectedValueOnce(new Error('Command timed out after 1000 milliseconds'))

    await expect(runHelpCommand(['docker'], 1000)).rejects.toBeInstanceOf(HelpExecutionTimeoutError)
  })

  it('falls back to -h when --help has no output', async () => {
    vi.mocked(execa)
      .mockResolvedValueOnce({ all: '' } as Awaited<ReturnType<typeof execa>>)
      .mockResolvedValueOnce({ all: 'short help output' } as Awaited<ReturnType<typeof execa>>)

    const output = await runHelpCommand(['aws'], 2000)

    expect(output).toBe('short help output')
    expect(execa).toHaveBeenNthCalledWith(
      1,
      'aws',
      ['--help'],
      expect.objectContaining({ timeout: 2000 }),
    )
    expect(execa).toHaveBeenNthCalledWith(
      2,
      'aws',
      ['-h'],
      expect.objectContaining({ timeout: 2000 }),
    )
  })

  it('falls back to help subcommand after help flags produce no output', async () => {
    vi.mocked(execa)
      .mockResolvedValueOnce({ all: '' } as Awaited<ReturnType<typeof execa>>)
      .mockResolvedValueOnce({ all: '' } as Awaited<ReturnType<typeof execa>>)
      .mockResolvedValueOnce({ all: '' } as Awaited<ReturnType<typeof execa>>)
      .mockResolvedValueOnce({ all: 'aws help output' } as Awaited<ReturnType<typeof execa>>)

    const output = await runHelpCommand(['aws'], 2000)

    expect(output).toBe('aws help output')
    expect(execa).toHaveBeenNthCalledWith(
      1,
      'aws',
      ['--help'],
      expect.objectContaining({ timeout: 2000 }),
    )
    expect(execa).toHaveBeenNthCalledWith(
      2,
      'aws',
      ['-h'],
      expect.objectContaining({ timeout: 2000 }),
    )
    expect(execa).toHaveBeenNthCalledWith(
      3,
      'aws',
      ['-H'],
      expect.objectContaining({ timeout: 2000 }),
    )
    expect(execa).toHaveBeenNthCalledWith(
      4,
      'aws',
      ['help'],
      expect.objectContaining({ timeout: 2000 }),
    )
  })

  it('reuses cached output for identical help requests', async () => {
    vi.mocked(execa).mockResolvedValueOnce({ all: 'cached help text' } as Awaited<ReturnType<typeof execa>>)

    const first = await runHelpCommand(['git'], 2000)
    const second = await runHelpCommand(['git'], 2000)

    expect(first).toBe('cached help text')
    expect(second).toBe('cached help text')
    expect(execa).toHaveBeenCalledTimes(1)
  })

  it('does not cache failed executions', async () => {
    vi.mocked(execa)
      .mockRejectedValueOnce(new Error('Command timed out after 1000 milliseconds'))
      .mockResolvedValueOnce({ all: 'fresh help text' } as Awaited<ReturnType<typeof execa>>)

    await expect(runHelpCommand(['docker'], 1000)).rejects.toBeInstanceOf(HelpExecutionTimeoutError)

    await expect(runHelpCommand(['docker'], 1000)).resolves.toBe('fresh help text')
    expect(execa).toHaveBeenCalledTimes(2)
  })
})
