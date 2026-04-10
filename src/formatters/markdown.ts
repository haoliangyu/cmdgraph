import type { CommandNode } from '../types.js'

function formatNode(node: CommandNode, depth: number): string {
  const headingLevel = Math.min(depth + 2, 6)
  const heading = `${'#'.repeat(headingLevel)} ${node.path.join(' ')}`

  const sections: string[] = [heading]

  if (node.description) {
    sections.push(node.description)
  }

  if (node.usage) {
    sections.push(`**Usage:** \`${node.usage}\``)
  }

  if (node.aliases.length > 0) {
    sections.push(`**Aliases:** ${node.aliases.map((alias) => `\`${alias}\``).join(', ')}`)
  }

  if (node.arguments.length > 0) {
    sections.push('**Arguments**')
    for (const argument of node.arguments) {
      sections.push(`- \`${argument}\``)
    }
  }

  if (node.examples.length > 0) {
    sections.push('**Examples**')
    for (const example of node.examples) {
      sections.push(`- \`${example}\``)
    }
  }

  if (node.options.length > 0) {
    sections.push('**Options**')
    for (const option of node.options) {
      const description = option.description || 'No description'
      sections.push(`- \`${option.flag}\`: ${description}`)
    }
  }

  if (node.subcommands.length > 0) {
    sections.push('**Subcommands**')
    for (const subcommand of node.subcommands) {
      sections.push(`- \`${subcommand}\``)
    }
  }

  sections.push('')

  for (const child of node.children) {
    sections.push(formatNode(child, depth + 1))
  }

  return sections.join('\n')
}

export function formatAsMarkdown(root: CommandNode): string {
  const header = '# Command Documentation\n'
  return `${header}\n${formatNode(root, 0)}`.trimEnd() + '\n'
}
