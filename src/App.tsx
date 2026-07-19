import React, { useEffect, useState } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { ChatPanel } from './components/ChatPanel';
import { BtwPanel } from './components/BtwPanel';
import { SettingsModal } from './components/SettingsModal';
import { Logo } from './components/Logo';
import { useConfig } from './stores/config';
import { useChat } from './stores/conversations';
import { useTheme } from './hooks/useTheme';
import { useT } from './i18n';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const { loaded, load } = useConfig();
  const { loadList, list, activeId, newConversation, openConversation } = useChat();
  const { t } = useT();

  useTheme();

  useEffect(() => {
    (async () => {
      await load();
      await loadList();
      // 启动时：若有历史则打开最近一条，否则新建
      const recent = await window.btw.getConversations();
      if (recent.length > 0) {
        await openConversation(recent[0].id);
      } else {
        await newConversation();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded) {
    return (
      <div className="app">
        <div className="empty-state" style={{ height: '100vh' }}>
          <Logo size={72} />
          <div className="empty-sub">{t.loadingApp}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <TitleBar onOpenSettings={() => setShowSettings(true)} />
      <div className="app-body">
        <Sidebar />
        <ChatPanel />
        <BtwPanel />
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
