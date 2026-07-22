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
  const [atts, setAtts] = useState<Attachment[]>([]);
  const [parsing, setParsing] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const streaming = variant === 'btw' ? conv.btwStreaming : conv.streaming;
  const active = conv.conversations.find((c) => c.id === conv.activeId);
  const contentMsgs = active?.messages.filter((m) => m.content || m.role === 'user') ?? [];
  const canRegen = variant === 'main' && contentMsgs.length >= 2 && !streaming;

  const grow = () => {
    const el = taRef.current; if (!el) return;
    el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setParsing(true);
    for (const file of Array.from(files)) {
      const att: Attachment = { id: uuid(), name: file.name, type: file.type || 'application/octet-stream', size: file.size, extracting: false };
      if (isImage(file)) {
        att.kind = 'image'; att.data = await readB64(file);
        setAtts((a) => [...a, att]);
      } else if (isDocument(file)) {
        att.kind = 'document'; att.extracting = true;
        setAtts((a) => [...a, att]);
        try {
          const r = await extractTextFromFile(file);
          att.extractedText = r.text; att.truncated = r.truncated; att.pages = r.pages;
        } catch (e: any) { att.extractError = e?.message || 'failed'; }
        finally { att.extracting = false; setAtts((a) => [...a]); }
      }
    }
    setParsing(false);
  };

  const submit = () => {
    const v = text.trim();
    if ((!v && !atts.length) || streaming || parsing) return;
    if (variant === 'btw') void conv.sendBtw(v); else void conv.send(v, atts.length ? atts : undefined);
    setText(''); setAtts([]); requestAnimationFrame(grow);
  };

  const rm = (id: string) => setAtts((a) => a.filter((x) => x.id !== id));

  return (
    <div className="composer">
      <div className="composer-card">
        <div style={{ flex: 1, minWidth: 0 }}>
          {atts.length > 0 && (
            <div className="composer-atts">
              {atts.map((a) => (
                <div key={a.id} className="att">
                  {a.kind === 'image' && a.data
                    ? <img src={`data:${a.type};base64,${a.data}`} alt={a.name} />
                    : <DocIcon size={18} />}
                  <div className="att-main">
                    <div className="att-name">{a.name}</div>
                    <div className="att-meta">{a.extracting ? t.docParsing : a.extractError ? t.docFailed : a.kind === 'document' ? `${t.docParsed}${a.truncated ? ` · ${t.docTruncated}` : ''}` : ''}</div>
                  </div>
                  <button className="att-x" onClick={() => rm(a.id)}><XIcon size={13} /></button>
                </div>
              ))}
            </div>
          )}
          <textarea
            ref={taRef}
            placeholder={variant === 'btw' ? t.composerBtwPh : t.composerPh}
            value={text} rows={1}
            onChange={(e) => { setText(e.target.value); grow(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && cfg.settings.sendOnEnter) { e.preventDefault(); submit(); } }}
          />
        </div>
        {variant === 'main' && (
          <>
            <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => onFiles(e.target.files)} />
            <button className="tool" onClick={() => fileRef.current?.click()} title={t.attach}><ClipIcon size={21} /></button>
            {canRegen && <button className="tool" onClick={() => conv.regenerate()} title={t.regenerate}><RefreshIcon size={20} /></button>}
          </>
        )}
        {streaming
          ? <button className="send stop" onClick={() => conv.cancel()}><StopIcon size={18} /></button>
          : <button className="send" onClick={submit} disabled={parsing || (!text.trim() && !atts.length)}><SendIcon size={19} /></button>}
      </div>
    </div>
  );
};

function readB64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result || '').split(',')[1] || '');
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}
