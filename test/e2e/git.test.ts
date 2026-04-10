import { expect, it } from 'vitest'
import { describeInCI, generateJsonFor } from './shared.js'

describeInCI('e2e: git', () => {
  it('generates docs from git --help', async () => {
    const generated = await generateJsonFor('git')

    expect(generated.name).toBe('git')
    expect(generated.usage?.toLowerCase()).toContain('git')
    expect(generated.subcommands.length).toBeGreaterThan(0)
  })
})
