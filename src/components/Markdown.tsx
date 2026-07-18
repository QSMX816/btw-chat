import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import hljs from 'highlight.js/lib/common';
import { CopyIcon, CheckIcon } from './Icons';
import 'katex/dist/katex.min.css';

export const Markdown: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
        components={{
          // react-markdown 默认会用 <pre><code> 包裹块级代码；这里把外层 <pre> 去掉，
          // 由 CodeBlock 自己渲染带顶栏 + 复制按钮的代码块。
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

// 从 react-markdown 传入的 children 里稳妥地取出纯文本（避免渲染成 [object Object]）
function nodeToString(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToString).join('');
  if (typeof node === 'object' && node.props) return nodeToString(node.props.children);
  return '';
}

const CodeBlock: React.FC<{ lang: string; children: string }> = ({ lang, children }) => {
  const [copied, setCopied] = useState(false);
  // 用 highlight.js 手动高亮（不再依赖 rehype-highlight，避免 children 变成高亮 span 后被 String 成 [object Object]）
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
        {html != null ? (
          <code className={`hljs language-${lang}`} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <code className={`language-${lang}`}>{children}</code>
        )}
      </pre>
    </div>
  );
};
