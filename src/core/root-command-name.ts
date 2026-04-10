import type { CommandNode } from '../types.js'

function hasPathPrefix(path: string[], prefix: string[]): boolean {
  if (prefix.length === 0 || path.length < prefix.length) {
    return false
  }

  return prefix.every((segment, index) => path[index] === segment)
}

function rewriteNodePath(path: string[], originalRootPath: string[], rootCommandName: string): string[] {
  if (!hasPathPrefix(path, originalRootPath)) {
    return path
  }

  return [rootCommandName, ...path.slice(originalRootPath.length)]
}

export function withRootCommandName(tree: CommandNode, rootCommandName: string | undefined): CommandNode {
  const normalizedName = rootCommandName?.trim()
  if (!normalizedName) {
    return tree
  }

  const originalRootPath = tree.path.length > 0 ? tree.path : [tree.name]

  const rewrite = (node: CommandNode, isRoot: boolean): CommandNode => ({
    ...node,
    name: isRoot ? normalizedName : node.name,
    path: rewriteNodePath(node.path, originalRootPath, normalizedName),
    children: node.children.map((child) => rewrite(child, false)),
  })

  return rewrite(tree, true)
}
