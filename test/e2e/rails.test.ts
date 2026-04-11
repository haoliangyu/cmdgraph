import { spawnSync } from 'node:child_process'
import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

function isRailsRunnable(): boolean {
  if (!isCliAvailable('rails')) {
    return false
  }

  const result = spawnSync('rails', ['--help'], { encoding: 'utf8' })
  if (result.status !== 0) {
    return false
  }

  return !/not currently installed/i.test(`${result.stdout}\n${result.stderr}`)
}

describeInCI('e2e: rails', () => {
  it.skipIf(!isRailsRunnable())('generates docs from Rails CLI --help', async () => {
    const generated = await generateJsonFor('rails')

    expect(generated.name).toBe('rails')
    expect(generated.usage?.toLowerCase()).toContain('rails')
    expect(generated.subcommands.length).toBeGreaterThan(0)
  }, E2E_TEST_TIMEOUT_MS)
})
