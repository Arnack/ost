'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MarkdownViewerProps {
  content: string
  className?: string
}

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] }
  | { type: 'code'; text: string }

function parseInline(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]
    const key = `${match.index}-${token}`

    if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
      parts.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">
          {token.slice(1, -1)}
        </code>
      )
    } else if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
      parts.push(<em key={key}>{token.slice(1, -1)}</em>)
    }

    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    if (trimmed.startsWith('```')) {
      const codeLines: string[] = []
      index += 1

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }

      blocks.push({ type: 'code', text: codeLines.join('\n') })
      index += 1
      continue
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] })
      index += 1
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = []

      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''))
        index += 1
      }

      blocks.push({ type: 'unordered-list', items })
      continue
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = []

      while (index < lines.length && /^\d+[.)]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+[.)]\s+/, ''))
        index += 1
      }

      blocks.push({ type: 'ordered-list', items })
      continue
    }

    const paragraphLines: string[] = []

    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith('```') &&
      !/^(#{1,6})\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+[.)]\s+/.test(lines[index].trim())
    ) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }

    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') })
  }

  return blocks
}

function renderHeading(level: number, children: ReactNode[], key: number) {
  const className = 'mt-5 first:mt-0 font-semibold leading-tight text-foreground'

  if (level <= 1) return <h3 key={key} className={className}>{children}</h3>
  if (level === 2) return <h4 key={key} className={className}>{children}</h4>
  if (level === 3) return <h5 key={key} className={className}>{children}</h5>
  return <h6 key={key} className={className}>{children}</h6>
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  const blocks = parseBlocks(content)

  return (
    <div className={cn('space-y-3 text-sm leading-7 text-foreground', className)}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return renderHeading(block.level, parseInline(block.text), index)
        }

        if (block.type === 'unordered-list') {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{parseInline(item)}</li>
              ))}
            </ul>
          )
        }

        if (block.type === 'ordered-list') {
          return (
            <ol key={index} className="list-decimal space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{parseInline(item)}</li>
              ))}
            </ol>
          )
        }

        if (block.type === 'code') {
          return (
            <pre key={index} className="overflow-x-auto rounded-md bg-muted p-3 text-xs leading-6">
              <code>{block.text}</code>
            </pre>
          )
        }

        return <p key={index}>{parseInline(block.text)}</p>
      })}
    </div>
  )
}
