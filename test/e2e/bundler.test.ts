import { spawnSync } from 'node:child_process'
import { expect, it } from 'vitest'
import { E2E_TEST_TIMEOUT_MS, describeInCI, generateJsonFor, isCliAvailable } from './shared.js'

function isBundlerRunnable(): boolean {
  if (!isCliAvailable('bundle')) {
    return false
  }

  const result = spawnSync('bundle', ['--help'], { encoding: 'utf8' })
  if (result.status !== 0) {
    return false
  }

  return !/command not found|not currently installed/i.test(`${result.stdout}\n${result.stderr}`)
}

describeInCI('e2e: bundler', () => {
  it.skipIf(!isBundlerRunnable())('generates docs from Bundler CLI --help', async () => {
    const generated = await generateJsonFor('bundle')
    const synopsis = (generated.usage ?? generated.description ?? '').toLowerCase()

    expect(generated.name.toLowerCase()).toBe('bundler')
    expect(synopsis.includes('bundle') || synopsis.includes('bundler')).toBe(true)
    expect(Array.isArray(generated.subcommands)).toBe(true)
  }, E2E_TEST_TIMEOUT_MS)
})
