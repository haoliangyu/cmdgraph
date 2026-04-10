import { describe, expect, it, vi } from 'vitest'
import { execa } from 'execa'
import { HelpExecutionTimeoutError, runHelpCommand } from '../src/core/executor.js'

vi.mock('execa', () => ({
  execa: vi.fn(),
}))

describe('runHelpCommand', () => {
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
})
