import React, { useRef, useState, useEffect } from 'react';
import { SendIcon, StopIcon, GlobeIcon, PaperclipIcon, BrainIcon, RefreshIcon } from './Icons';
import { useChat } from '../stores/conversations';
import { useConfig } from '../stores/config';
import { Attachment } from '../types';
import { v4 as uuid } from 'uuid';
import { useT } from '../i18n';

interface Props {
  variant?: 'main' | 'btw';
  btwId?: string;
  /** 主聊天：非流式且有 assistant 消息时可重新生成 */
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
  const supportsVision = model?.supportsVision;

  // 自适应高度
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [text]);

  const submit = async () => {
    if (!text.trim() || streaming) return;
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
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        setAttachments((a) => [
          ...a,
          { id: uuid(), name: f.name, type: f.type, size: f.size, data: base64 },
        ]);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  return (
    <div className="composer">
      {attachments.length > 0 && (
        <div className="attachments">
          {attachments.map((a) =>
            a.type.startsWith('image/') ? (
              <img key={a.id} className="attachment-thumb" src={`data:${a.type};base64,${a.data}`} alt={a.name} />
            ) : (
              <div key={a.id} className="attachment-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, padding: 4, textAlign: 'center' }}>
                {a.name}
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
          {supportsVision && variant === 'main' && (
            <label className="composer-tool" title={t.attach}>
              <PaperclipIcon size={18} />
              <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={onFile} />
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
          {/* 重新生成：非流式、有上一条回答时显示 */}
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
            <button className="send-btn" onClick={submit} disabled={!text.trim()} title={t.send}>
              <SendIcon size={17} />
            </button>
          )}
        </div>
      </div>
      {variant === 'main' && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
          {(settings.sendOnEnter ? t.composerEnter : t.composerCtrl)} · {t.composerBtwHint}
        </div>
      )}
    </div>
  );
};
