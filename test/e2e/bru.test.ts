import { expect, it } from 'vitest'
import { describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

describeInCI('e2e: bru', () => {
  it.skipIf(!isCliAvailable('bru'))('generates docs from Bruno CLI --help', async () => {
    const generated = await generateJsonFor('bru', { maxDepth: 2, timeoutMs: 20000 })

    expect(generated.name).toBe('bru')
    expect(generated.usage?.toLowerCase()).toContain('bru')
    expect(generated.subcommands).toEqual(expect.arrayContaining(['import', 'run']))
  }, 45000)
})
