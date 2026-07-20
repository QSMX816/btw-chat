import React, { useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useT } from '../i18n';
import { useConfig } from '../stores/config';
import { useConversations } from '../stores/conversations';
import { Attachment } from '../types';
import { extractTextFromFile, isDocument, isImage } from '../utils/fileExtract';
import { ClipIcon, SendIcon, StopIcon, RefreshIcon, XIcon, DocIcon } from './Icons';

const ACCEPT = '.png,.jpg,.jpeg,.gif,.webp,.pdf,.docx,.xlsx,.xls,.txt,.md,.csv,.json,.xml,.html,.log,.yaml,.yml,.ts,.tsx,.js,.py,.java,.c,.cpp,.go,.rs,.sql,.sh';

export const Composer: React.FC<{ variant?: 'main' | 'btw' }> = ({ variant = 'main' }) => {
  const { t } = useT();
  const cfg = useConfig();
  const conv = useConversations();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [docParsing, setDocParsing] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const streaming = variant === 'btw' ? conv.btwStreaming : conv.streaming;
  const activeConv = conv.conversations.find((c) => c.id === conv.activeId);
  const contentMsgs = activeConv?.messages.filter((m) => m.content || m.role === 'user') ?? [];
  const canRegenerate = variant === 'main' && contentMsgs.length >= 2 && !streaming;

  const autogrow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setDocParsing(true);
    for (const file of Array.from(files)) {
      const att: Attachment = {
        id: uuid(), name: file.name, type: file.type || 'application/octet-stream',
        size: file.size, extracting: false,
      };
      if (isImage(file)) {
        att.kind = 'image';
        att.data = await readAsBase64(file);
      } else if (isDocument(file)) {
        att.kind = 'document';
        att.extracting = true;
        setAttachments((a) => [...a, att]);
        try {
          const r = await extractTextFromFile(file);
          att.extractedText = r.text;
          att.truncated = r.truncated;
          att.pages = r.pages;
        } catch (e: any) {
          att.extractError = e?.message || 'failed';
        } finally {
          att.extracting = false;
          setAttachments((a) => [...a]); // 触发更新
        }
        continue;
      } else {
        continue;
      }
      setAttachments((a) => [...a, att]);
    }
    setDocParsing(false);
  };

  const submit = () => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || streaming || docParsing) return;
    if (variant === 'btw') {
      void conv.sendBtw(trimmed);
    } else {
      void conv.send(trimmed, attachments.length ? attachments : undefined);
    }
    setText('');
    setAttachments([]);
    requestAnimationFrame(autogrow);
  };

  const stop = () => conv.cancel();

  const removeAtt = (id: string) => setAttachments((a) => a.filter((x) => x.id !== id));

  return (
    <div className="composer-wrap">
      <div className="composer-inner">
        <div className="composer" style={{ flex: 1, minWidth: 0 }}>
          {attachments.length > 0 && (
            <div className="attachments">
              {attachments.map((a) => (
                <div key={a.id} className="doc-chip" style={{ position: 'relative' }}>
                  {a.kind === 'image' && a.data ? (
                    <img className="attachment-thumb" src={`data:${a.type};base64,${a.data}`} alt={a.name} style={{ width: 40, height: 40 }} />
                  ) : (
                    <DocIcon size={20} className="doc-chip-icon" />
                  )}
                  <div className="doc-chip-main">
                    <span className="doc-chip-name">{a.name}</span>
                    <span className="doc-chip-meta">
                      {a.extracting ? t.docParsing : a.extractError ? t.docFailed : a.kind === 'document' ? `${t.docParsed}${a.truncated ? ` · ${t.docTruncated}` : ''}` : ''}
                    </span>
                  </div>
                  <button className="attachment-x" onClick={() => removeAtt(a.id)}><XIcon size={13} /></button>
                </div>
              ))}
            </div>
          )}
          <textarea
            ref={taRef}
            className="composer-input"
            placeholder={variant === 'btw' ? t.composerBtwPh : t.composerPh}
            value={text}
            rows={1}
            onChange={(e) => { setText(e.target.value); autogrow(); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && cfg.settings.sendOnEnter) {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>
        <div className="composer-tools">
          {variant === 'main' && (
            <>
              <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => onFiles(e.target.files)} />
              <button className="tool-btn" onClick={() => fileRef.current?.click()} title={t.attach}>
                <ClipIcon size={21} />
              </button>
              {canRegenerate && (
                <button className="tool-btn" onClick={() => conv.regenerate()} title={t.regenerate}>
                  <RefreshIcon size={20} />
                </button>
              )}
            </>
          )}
          {streaming ? (
            <button className="send-btn stop" onClick={stop}><StopIcon size={18} /></button>
          ) : (
            <button className="send-btn" onClick={submit} disabled={docParsing || (!text.trim() && attachments.length === 0)}>
              <SendIcon size={19} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const s = String(fr.result || '');
      resolve(s.split(',')[1] || '');
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}
