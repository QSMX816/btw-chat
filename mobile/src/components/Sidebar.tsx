import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { motion, drawerV, scrimV, springSoft, shouldDismiss } from './motion';
import { useConversations } from '../stores/conversations';
import { useT } from '../i18n';
import { PlusIcon, GearIcon, SearchIcon, TrashIcon, PinIcon, XIcon, SparkIcon } from './Icons';

function relTime(ts: number, t: ReturnType<typeof useT>['t']): string {
  const d = Date.now() - ts; const m = Math.floor(d / 60000);
  if (m < 1) return t.justNow;
  if (m < 60) return `${m} ${t.minAgo}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${t.hourAgo}`;
  return `${Math.floor(h / 24)} ${t.dayAgo}`;
}

export const Sidebar: React.FC<{ onClose: () => void; onOpenSettings: () => void }> = ({ onClose, onOpenSettings }) => {
  const { t } = useT();
  const conv = useConversations();
  const [q, setQ] = useState('');
  const list = conv.conversations.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));

  const open = (id: string) => { conv.select(id); onClose(); };
  const rename = (c: { id: string; title: string }) => { const v = window.prompt(t.rename, c.title); if (v && v.trim()) void conv.rename(c.id, v.trim()); };
  const del = (id: string) => { if (window.confirm(t.confirmDeleteConv)) void conv.remove(id); };

  return (
    <>
      <motion.div className="scrim" variants={scrimV} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} onClick={onClose} />
      <motion.div
        className="drawer"
        variants={drawerV} initial="initial" animate="animate" exit="exit" transition={springSoft}
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.18}
        onDragEnd={(e, info) => { if (shouldDismiss(e, info, 'x', 90, 500)) onClose(); }}
      >
        <div className="drawer-head">
          <div className="drawer-brand">
            <div className="brand-mark">BTW</div>
            <div>
              <div className="brand-name">{t.appName}</div>
              <div className="brand-sub">{t.sidebarVersion}</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><XIcon size={22} /></button>
        </div>

        <motion.button className="btn-primary" whileTap={{ scale: 0.98 }} transition={springSoft}
          onClick={() => { conv.newConversation(); onClose(); }}>
          <PlusIcon size={20} /> {t.sidebarNew}
        </motion.button>

        <input className="search" placeholder={t.searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} />

        <div className="list">
          {list.length === 0 && (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
              {q ? t.sidebarNoMatch : t.sidebarEmpty}
            </div>
          )}
          <AnimatePresence initial={false}>
            {list.map((c, idx) => (
              <motion.div key={c.id}
                className={`item ${c.id === conv.activeId ? 'active' : ''}`}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ ...springSoft, delay: Math.min(idx, 8) * 0.03 }}
                onClick={() => open(c.id)}
              >
                {c.id === conv.activeId && <motion.div layoutId="conv-active" className="item-pill" transition={springSoft} />}
                <div className="item-main">
                  <div className="item-title">{c.title}{c.pinned && <span> 📌</span>}</div>
                  <div className="item-meta">
                    {relTime(c.updatedAt, t)} · {c.messages.length} {t.msgs}
                    {c.btwConversations.some((b) => !b.closed) && <SparkIcon size={11} />}
                  </div>
                </div>
                <div className="item-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="mini" onClick={() => rename(c)} title={t.rename}><span style={{ fontSize: 13 }}>✎</span></button>
                  <button className="mini" onClick={() => conv.togglePin(c.id)} title={c.pinned ? t.unpin : t.pin}><PinIcon size={15} /></button>
                  <button className="mini" onClick={() => del(c.id)} title={t.delete}><TrashIcon size={15} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="drawer-foot">
          <motion.button className="ghost" whileTap={{ scale: 0.98 }} transition={springSoft} onClick={onOpenSettings}>
            <GearIcon size={20} /> {t.settings}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};
