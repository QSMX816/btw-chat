import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { CopyIcon, CheckIcon } from './Icons';

export const Markdown: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ node, className, children, ...props }: any) => {
            const isInline = !className;
            if (isInline) {
              return <code {...props}>{children}</code>;
            }
            const match = /language-(\w+)/.exec(className || '');
            const lang = match?.[1] || 'text';
            return (
              <CodeBlock lang={lang}>{String(children).replace(/\n$/, '')}</CodeBlock>
            );
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

const CodeBlock: React.FC<{ lang: string; children: string }> = ({ lang, children }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="code-block">
      <div className="code-block-bar">
        <span>{lang}</span>
        <button className="copy-btn" onClick={copy}>
          {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />} {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre>
        <code className={`language-${lang}`}>{children}</code>
      </pre>
    </div>
  );
};
