export interface Option {
  flag: string
  description: string
}

export interface ParsedCommand {
  name: string
  description?: string
  usage?: string
  aliases: string[]
  arguments: string[]
  examples: string[]
  options: Option[]
  subcommands: string[]
}

export interface CommandNode extends ParsedCommand {
  children: CommandNode[]
  path: string[]
}
