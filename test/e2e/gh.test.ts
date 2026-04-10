import { expect, it } from 'vitest'
import { describeInCI, generateJsonFor } from './shared.js'

describeInCI('e2e: gh', () => {
  it('generates docs from gh --help', async () => {
    const generated = await generateJsonFor('gh')

    expect(generated.name).toBe('gh')
    expect(generated.usage?.toLowerCase()).toContain('gh')
    expect(generated.subcommands.length).toBeGreaterThan(0)
  })
})
