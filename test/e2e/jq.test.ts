import { expect, it } from 'vitest'
import { describeInCI, generateJsonFor } from './shared.js'

describeInCI('e2e: jq', () => {
  it('generates docs from jq --help', async () => {
    const generated = await generateJsonFor('jq')

    expect(generated.name).toBe('jq')
    expect(generated.usage?.toLowerCase()).toContain('jq')
  })
})
