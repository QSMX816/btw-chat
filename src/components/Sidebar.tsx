import React, { useState } from 'react';
import { useChat } from '../stores/conversations';
import { PlusIcon, SearchIcon, TrashIcon, PinIcon, ChatIcon } from './Icons';
import { Logo } from './Logo';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} 天前`;
  return new Date(ts).toLocaleDateString('zh-CN');
}

export const Sidebar: React.FC = () => {
  const { list, activeId, openConversation, newConversation, deleteConversation, togglePin } = useChat();
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
            placeholder="搜索对话"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="btn btn-icon" title="新建对话" onClick={newConversation}>
          <PlusIcon size={18} />
        </button>
      </div>

      <div className="conv-list">
        {filtered.length === 0 && (
          <div style={{ padding: '30px 14px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            {query ? '没有匹配的对话' : '点击 + 开始第一个对话'}
          </div>
        )}
        {filtered.map((c) => (
          <div
            key={c.id}
            className={`conv-item ${c.id === activeId ? 'active' : ''}`}
            onClick={() => openConversation(c.id)}
          >
            {c.pinned && <PinIcon size={11} style={{ opacity: 0.8 }} />}
            <div className="conv-item-main">
              <div className="conv-item-title">{c.title}</div>
              <div className="conv-meta">
                <span>{timeAgo(c.updatedAt)}</span>
                <span>· {c.messageCount} 条</span>
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
                title={c.pinned ? '取消置顶' : '置顶'}
                onClick={(e) => { e.stopPropagation(); togglePin(c.id); }}
              >
                <PinIcon size={13} />
              </button>
              <button
                className="conv-action"
                title="删除"
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
                {confirmId === c.id ? <span style={{ fontSize: 9 }}>再点确认</span> : <TrashIcon size={13} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <Logo size={30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>BTW Chat</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>v1.0 · 多模型 · 毛玻璃</div>
        </div>
      </div>
    </aside>
  );
};
