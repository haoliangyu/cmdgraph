import { execa } from 'execa'
import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI } from './shared.js'

describeInCI('e2e: bin entrypoint', () => {
  it('prints oclif help via bin/run.js', async () => {
    const result = await execa('node', ['./bin/run.js', '--help'])

    expect(result.stdout).toContain('USAGE')
    expect(result.stdout).toContain('cmdgraph [COMMAND]')
    expect(result.stdout).toContain('generate')
  }, E2E_TEST_TIMEOUT_MS)
})