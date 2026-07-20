import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import hljs from 'highlight.js/lib/common';
import { CopyIcon, CheckIcon } from './Icons';
import { useT } from '../i18n';
import 'katex/dist/katex.min.css';

export const Markdown: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }: any) => {
            const isInline = !className;
            if (isInline) return <code {...props}>{children}</code>;
            const match = /language-([\w-]+)/.exec(className || '');
            const lang = match?.[1] || 'text';
            const text = nodeToString(children).replace(/\n$/, '');
            return <CodeBlock lang={lang}>{text}</CodeBlock>;
          },
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

function nodeToString(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToString).join('');
  if (typeof node === 'object' && node.props) return nodeToString(node.props.children);
  return '';
}

const CodeBlock: React.FC<{ lang: string; children: string }> = ({ lang, children }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useT();
  const html = useMemo(() => {
    try {
      if (lang && lang !== 'text' && hljs.getLanguage(lang)) {
        return hljs.highlight(children, { language: lang }).value;
      }
      return hljs.highlightAuto(children).value;
    } catch {
      return null;
    }
  }, [lang, children]);
  const copy = () => {
    navigator.clipboard?.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="code-block">
      <div className="code-block-bar">
        <span>{lang}</span>
        <button className="copy-btn" onClick={copy}>
          {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />} {copied ? t.copied : t.copy}
        </button>
      </div>
      <pre>
        {html != null ? (
          <code className={`hljs language-${lang}`} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <code className={`language-${lang}`}>{children}</code>
        )}
      </pre>
    </div>
  );
};
