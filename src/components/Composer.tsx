import React, { useRef, useState, useEffect } from 'react';
import { SendIcon, StopIcon, GlobeIcon, PaperclipIcon, BrainIcon, RefreshIcon, CloseIcon } from './Icons';
import { useChat } from '../stores/conversations';
import { useConfig } from '../stores/config';
import { Attachment } from '../types';
import { v4 as uuid } from 'uuid';
import { useT } from '../i18n';
import { extractTextFromFile, isDocument } from '../utils/fileExtract';

const ACCEPT =
  'image/*,.pdf,.docx,.xlsx,.xls,.txt,.md,.markdown,.csv,.tsv,.json,.xml,.html,.htm,.log,.yaml,.yml,.ini,.toml,.js,.mjs,.ts,.tsx,.jsx,.py,.java,.c,.h,.cpp,.cs,.go,.rs,.rb,.php,.swift,.kt,.sh,.bash,.sql,.vue,.svelte,.css,.scss,.tex';

function fmtSize(n: number): string {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}

interface Props {
  variant?: 'main' | 'btw';
  btwId?: string;
  canRegenerate?: boolean;
  regenerateLast?: () => void;
}

export const Composer: React.FC<Props> = ({ variant = 'main', btwId, canRegenerate, regenerateLast }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, sendBtwMessage, stopStreaming, streaming } = useChat();
  const { settings, updateSettings, getActiveModel } = useConfig();
  const { t } = useT();

  const model = getActiveModel();

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [text]);

  const submit = async () => {
    // 有文档还在解析中时禁止发送
    if (attachments.some((a) => a.kind === 'document' && a.extracting)) return;
    if ((!text.trim() && attachments.length === 0) || streaming) return;
    const tt = text;
    const atts = attachments;
    setText('');
    setAttachments([]);
    if (variant === 'btw' && btwId) {
      await sendBtwMessage(btwId, tt);
    } else {
      await sendMessage(tt, atts);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (settings.sendOnEnter ? !e.shiftKey : (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      submit();
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      const image = f.type.startsWith('image/');
      if (image) {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(',')[1];
          setAttachments((a) => [
            ...a,
            { id: uuid(), name: f.name, type: f.type, size: f.size, kind: 'image', data: base64 },
          ]);
        };
        reader.readAsDataURL(f);
      } else if (isDocument(f)) {
        const attId = uuid();
        setAttachments((a) => [
          ...a,
          { id: attId, name: f.name, type: f.type, size: f.size, kind: 'document', extracting: true },
        ]);
        extractTextFromFile(f)
          .then((r) =>
            setAttachments((a) =>
              a.map((x) =>
                x.id === attId
                  ? { ...x, extracting: false, extractedText: r.text, truncated: r.truncated, pages: r.pages }
                  : x
              )
            )
          )
          .catch((err) =>
            setAttachments((a) =>
              a.map((x) => (x.id === attId ? { ...x, extracting: false, extractError: err?.message || t.docFailed } : x))
            )
          );
      }
      // 不支持的类型直接忽略
    }
    e.target.value = '';
  };

  const removeAtt = (id: string) => setAttachments((a) => a.filter((x) => x.id !== id));

  const docParsing = attachments.some((a) => a.kind === 'document' && a.extracting);

  return (
    <div className="composer">
      {attachments.length > 0 && (
        <div className="attachments">
          {attachments.map((a) =>
            a.kind === 'image' && a.data ? (
              <div key={a.id} className="attachment-wrap">
                <img className="attachment-thumb" src={`data:${a.type};base64,${a.data}`} alt={a.name} />
                <button className="attachment-x" title={t.docRemove} onClick={() => removeAtt(a.id)}>
                  <CloseIcon size={11} />
                </button>
              </div>
            ) : (
              <div key={a.id} className="doc-chip" title={a.name}>
                <span className="doc-chip-icon">📄</span>
                <span className="doc-chip-main">
                  <span className="doc-chip-name">{a.name}</span>
                  <span className="doc-chip-meta">
                    {a.extracting
                      ? t.docParsing
                      : a.extractError
                      ? t.docFailed
                      : `${t.docParsed}${a.pages ? ` · ${a.pages}p` : ''}${a.truncated ? ` · ${t.docTruncated}` : ''} · ${fmtSize(a.size)}`}
                  </span>
                </span>
                <button className="attachment-x" title={t.docRemove} onClick={() => removeAtt(a.id)}>
                  <CloseIcon size={11} />
                </button>
              </div>
            )
          )}
        </div>
      )}
      <div className="composer-inner">
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={variant === 'btw' ? t.composerBtwPh : t.composerPh}
        />
        <div className="composer-actions">
          {variant === 'main' && (
            <label className="composer-tool" title={t.attach}>
              <PaperclipIcon size={18} />
              <input type="file" multiple accept={ACCEPT} style={{ display: 'none' }} onChange={onFile} />
            </label>
          )}
          {variant === 'main' && (
            <button
              className={`composer-tool ${settings.webSearchEnabled ? 'active' : ''}`}
              title={t.webSearch}
              onClick={() => updateSettings({ webSearchEnabled: !settings.webSearchEnabled })}
            >
              <GlobeIcon size={18} />
            </button>
          )}
          {model?.supportsThinking && variant === 'main' && (
            <div className="composer-tool active" title={t.thinkingSupported}>
              <BrainIcon size={17} />
            </div>
          )}
          {variant === 'main' && canRegenerate && !streaming && (
            <button className="composer-tool" title={t.regenerateLast} onClick={() => regenerateLast?.()}>
              <RefreshIcon size={17} />
            </button>
          )}
          {streaming ? (
            <button className="send-btn stop" onClick={stopStreaming} title={t.stop}>
              <StopIcon size={16} />
            </button>
          ) : (
            <button className="send-btn" onClick={submit} disabled={docParsing || (!text.trim() && attachments.length === 0)} title={t.send}>
              <SendIcon size={17} />
            </button>
          )}
        </div>
      </div>
      {variant === 'main' && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
          {(settings.sendOnEnter ? t.composerEnter : t.composerCtrl)} · {t.fileHint}
        </div>
      )}
    </div>
  );
};
