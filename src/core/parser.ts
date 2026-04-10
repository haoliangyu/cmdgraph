import type { ParsedCommand } from '../types.js'

export interface CLIParser {
  name: string
  detect(helpText: string): boolean
  parse(helpText: string): ParsedCommand
}
