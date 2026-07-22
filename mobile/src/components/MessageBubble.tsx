import React, { useState } from 'react';
import { motion, msgV, spring } from './motion';
import { Message } from '../types';
import { Markdown } from './Markdown';
import { useT } from '../i18n';
import { BrainIcon, SparkIcon, CopyIcon, CheckIcon, RefreshIcon, DocIcon } from './Icons';

interface Props {
  message: Message;
  live?: boolean;
  isLastAssistant?: boolean;
  onAskBtw?: () => void;
  onOpenBtw?: () => void;
  onRegenerate?: () => void;
}

export const MessageBubble: React.FC<Props> = ({ message, live, isLastAssistant, onAskBtw, onOpenBtw, onRegenerate }) => {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const [showThink, setShowThink] = useState(false);
  const isUser = message.role === 'user';
  const hasThink = !!message.reasoning && message.reasoning.length > 0;
  const images = message.attachments?.filter((a) => a.type.startsWith('image/'));
  const docs = message.attachments?.filter((a) => a.kind === 'document');

  const copy = () => { navigator.clipboard?.writeText(message.content); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const waiting = live && !message.content && !hasThink;

  return (
    <motion.div className={`msg ${isUser ? 'user' : 'assistant'}`} variants={msgV} initial="initial" animate="animate" transition={spring}>
      <div className="msg-body">
        {hasThink && (
          <div className="think">
            <div className={`think-head ${live && !message.content ? 'live' : ''}`} onClick={() => setShowThink((v) => !v)}>
              <span className="pulse" />
              <BrainIcon size={14} />
              <span>{live && !message.content ? t.thinkingNow : t.thinkingProcess}</span>
            </div>
            {showThink && <div className="think-body">{message.reasoning}</div>}
          </div>
        )}

        {message.content ? (
          <div className={live ? 'cursor' : ''}>
            <Markdown content={message.content} />
          </div>
        ) : waiting ? (
          <div className="dots"><i /><i /><i /></div>
        ) : null}

        {(images?.length || docs?.length) ? (
          <div className="msg-atts">
            {images?.map((img) => <img key={img.id} src={`data:${img.type};base64,${img.data}`} alt={img.name} />)}
            {docs?.map((d) => <span key={d.id} className="msg-att-doc"><DocIcon size={13} /> {d.name}</span>)}
          </div>
        ) : null}
      </div>

      {!isUser && !live && message.content && (
        <div className="msg-actions">
          <button className="chip" onClick={copy}>{copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />} {copied ? t.copied : t.copy}</button>
          {isLastAssistant && onRegenerate && (
            <button className="chip" onClick={onRegenerate}><RefreshIcon size={13} /> {t.regenerate}</button>
          )}
          {message.btwThreadId ? (
            <button className="chip is-btw" onClick={onOpenBtw}><SparkIcon size={13} /> {t.msgBtw}</button>
          ) : onAskBtw && (
            <button className="chip btw" onClick={onAskBtw}><SparkIcon size={13} /> {t.askBtw}</button>
          )}
        </div>
      )}
    </motion.div>
  );
};
