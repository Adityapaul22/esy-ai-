import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming }) => {
  // Pre-process and render blocks
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="markdown-body space-y-3 leading-relaxed text-slate-100 break-words">
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <CodeBlock
              key={index}
              code={block.content}
              language={block.language || 'code'}
            />
          );
        }

        if (block.type === 'table') {
          return (
            <div key={index} className="overflow-x-auto my-3 rounded-lg border border-slate-700/60 bg-slate-900/60 shadow-sm">
              <table className="min-w-full text-left text-sm divide-y divide-slate-700/60">
                <thead>
                  <tr className="bg-slate-800/80">
                    {block.headers?.map((h, i) => (
                      <th key={i} className="px-3.5 py-2.5 font-semibold text-slate-200">
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {block.rows?.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 text-slate-300">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={index}
              className="border-l-4 border-indigo-500 bg-indigo-500/10 px-4 py-2.5 rounded-r-lg text-slate-200 italic my-2"
            >
              {renderInline(block.content)}
            </blockquote>
          );
        }

        if (block.type === 'heading') {
          const Tag = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3';
          const sizeClass =
            block.level === 1
              ? 'text-xl font-bold text-white pt-2 border-b border-slate-700/50 pb-1.5'
              : block.level === 2
              ? 'text-lg font-semibold text-slate-100 pt-1.5'
              : 'text-base font-semibold text-indigo-300 pt-1';
          return (
            <Tag key={index} className={sizeClass}>
              {renderInline(block.content)}
            </Tag>
          );
        }

        if (block.type === 'list') {
          return (
            <ul key={index} className="space-y-1.5 my-2 pl-5 list-disc text-slate-200 marker:text-indigo-400">
              {block.items?.map((item, i) => (
                <li key={i} className="pl-1">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ordered-list') {
          return (
            <ol key={index} className="space-y-1.5 my-2 pl-5 list-decimal text-slate-200 marker:text-indigo-400 font-medium">
              {block.items?.map((item, i) => (
                <li key={i} className="pl-1 font-normal">
                  {renderInline(item)}
                </li>
              ))}
            </ol>
          );
        }

        // Paragraph
        return (
          <p key={index} className="text-slate-200 text-[15px] leading-relaxed">
            {renderInline(block.content)}
            {isStreaming && index === blocks.length - 1 && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-400 animate-pulse rounded-sm align-middle" />
            )}
          </p>
        );
      })}
    </div>
  );
};

interface Block {
  type: 'paragraph' | 'code' | 'heading' | 'list' | 'ordered-list' | 'blockquote' | 'table';
  content: string;
  language?: string;
  level?: number;
  items?: string[];
  headers?: string[];
  rows?: string[][];
}

function parseMarkdownBlocks(text: string): Block[] {
  if (!text) return [];

  const lines = text.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check code blocks ```lang
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({
        type: 'code',
        language,
        content: codeLines.join('\n'),
      });
      continue;
    }

    // Check headings
    if (line.startsWith('#')) {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        blocks.push({
          type: 'heading',
          level: match[1].length,
          content: match[2],
        });
        i++;
        continue;
      }
    }

    // Check blockquote
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        type: 'blockquote',
        content: quoteLines.join('\n'),
      });
      continue;
    }

    // Check unordered list (- or *)
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'list',
        content: '',
        items,
      });
      continue;
    }

    // Check ordered list (1. 2.)
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'ordered-list',
        content: '',
        items,
      });
      continue;
    }

    // Check table (| ... |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (r: string) =>
          r
            .slice(1, -1)
            .split('|')
            .map((cell) => cell.trim());
        const headers = parseRow(tableLines[0]);
        // line 1 is usually separator like |---|---|
        const dataRows = tableLines.slice(2).map(parseRow);
        blocks.push({
          type: 'table',
          content: '',
          headers,
          rows: dataRows,
        });
        continue;
      }
    }

    // Empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Accumulate regular paragraph lines
    const paragraphLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].startsWith('#') &&
      !lines[i].trim().startsWith('>') &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !(lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|'))
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }

    blocks.push({
      type: 'paragraph',
      content: paragraphLines.join(' '),
    });
  }

  return blocks;
}

// Inline formatting (bold, italic, inline code, links)
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split by code `...`
  const parts = text.split(/(`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="font-mono text-[13px] bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded border border-slate-700/60 select-all"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Process bold, italics, links
    return <span key={index}>{renderMarkdownStyles(part)}</span>;
  });
}

function renderMarkdownStyles(text: string): React.ReactNode {
  // Simple regex parser for **bold**, *italic*, [link](url)
  const regex = /(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g;
  const tokens = text.split(regex);

  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      return (
        <em key={i} className="italic text-slate-200">
          {token.slice(1, -1)}
        </em>
      );
    }
    if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
      const match = token.match(/^\[(.*?)\]\((.*?)\)$/);
      if (match) {
        const [, label, url] = match;
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors inline-flex items-center gap-0.5"
          >
            {label}
          </a>
        );
      }
    }
    return token;
  });
}

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-medium text-slate-400">
        <span className="uppercase tracking-wider font-mono text-slate-300 font-semibold">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs cursor-pointer active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-[13.5px] font-mono leading-relaxed text-slate-200">
        <pre className="m-0 whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
