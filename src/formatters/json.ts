import type { CommandNode } from '../types.js'

export function formatAsJson(root: CommandNode): string {
  return JSON.stringify(root, null, 2)
}
