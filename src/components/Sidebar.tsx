import React, { useState } from 'react';
import { motion, springSoft } from './motion';
import { useChat } from '../stores/conversations';
import { PlusIcon, SearchIcon, TrashIcon, PinIcon, ChatIcon } from './Icons';
import { Logo } from './Logo';
import { useT } from '../i18n';
import type { Lang } from '../i18n/translations';

function timeAgo(ts: number, t: any, lang: Lang): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return t.justNow;
  if (min < 60) return `${min} ${t.minAgo}`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ${t.hourAgo}`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ${t.dayAgo}`;
  return new Date(ts).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US');
}

export const Sidebar: React.FC = () => {
  const { list, activeId, openConversation, newConversation, deleteConversation, togglePin } = useChat();
  const { t, lang } = useT();
  const [query, setQuery] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = list
    .filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(b.pinned ?? 0) - Number(a.pinned ?? 0) || b.updatedAt - a.updatedAt);

  return (
    <aside className="sidebar glass">
      <div className="sidebar-header">
        <div style={{ position: 'relative', flex: 1 }}>
          <SearchIcon size={15} style={{ position: 'absolute', left: 11, top: 9, color: 'var(--text-tertiary)' }} />
          <input
            className="sidebar-search"
            style={{ paddingLeft: 32 }}
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="btn btn-icon" title={t.newChat} onClick={newConversation}>
          <PlusIcon size={18} />
        </button>
      </div>

      <div className="conv-list">
        {filtered.length === 0 && (
          <div style={{ padding: '30px 14px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            {query ? t.sidebarNoMatch : t.sidebarStartFirst}
          </div>
        )}
        {filtered.map((c, idx) => (
          <motion.div
            key={c.id}
            className={`conv-item ${c.id === activeId ? 'active' : ''}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSoft, delay: Math.min(idx, 8) * 0.03 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => openConversation(c.id)}
          >
            {c.id === activeId && <motion.div layoutId="conv-active" className="conv-active-pill" transition={springSoft} />}
            {c.pinned && <PinIcon size={11} style={{ opacity: 0.8, position: 'relative', zIndex: 1 }} />}
            <div className="conv-item-main">
              <div className="conv-item-title">{c.title}</div>
              <div className="conv-meta">
                <span>{timeAgo(c.updatedAt, t, lang)}</span>
                <span>· {c.messageCount} {t.msgs}</span>
                {c.btwCount > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <ChatIcon size={10} /> {c.btwCount}
                  </span>
                )}
              </div>
            </div>
            <div className="conv-actions">
              <button
                className="conv-action"
                title={c.pinned ? t.unpin : t.pin}
                onClick={(e) => { e.stopPropagation(); togglePin(c.id); }}
              >
                <PinIcon size={13} />
              </button>
              <button
                className="conv-action"
                title={t.delete}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirmId === c.id) {
                    deleteConversation(c.id);
                    setConfirmId(null);
                  } else {
                    setConfirmId(c.id);
                    setTimeout(() => setConfirmId(null), 2500);
                  }
                }}
              >
                {confirmId === c.id ? <span style={{ fontSize: 9 }}>{t.confirmAgain}</span> : <TrashIcon size={13} />}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="sidebar-footer">
        <Logo size={30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t.appName}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{t.sidebarVersion}</div>
        </div>
      </div>
    </aside>
  );
};
