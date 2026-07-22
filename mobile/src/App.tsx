import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { useTheme } from './hooks/useTheme';
import { useConfig } from './stores/config';
import { useConversations } from './stores/conversations';
import { useT, resolveLang } from './i18n';
import { estimateInputOutputTokens, estimateCostUsd } from './utils/tokens';
import { ChatPanel } from './components/ChatPanel';
import { Composer } from './components/Composer';
import { Sidebar } from './components/Sidebar';
import { ModelPicker } from './components/ModelPicker';
import { SettingsModal } from './components/SettingsModal';
import { BtwSheet } from './components/BtwSheet';
import { MenuIcon, PlusIcon, GearIcon, ChevronDownIcon, SparkIcon } from './components/Icons';

export default function App() {
  useTheme();
  const cfg = useConfig();
  const conv = useConversations();
  const { t } = useT();
  const [drawer, setDrawer] = useState(false);
  const [picker, setPicker] = useState(false);
  const [settings, setSettings] = useState(false);

  useEffect(() => {
    (async () => {
      await cfg.load();
      await conv.load();
      if (!conv.conversations.length && !conv.activeId) conv.newConversation();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const h = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (conv.btwOpen) { conv.closeBtw(); return; }
      if (settings) { setSettings(false); return; }
      if (picker) { setPicker(false); return; }
      if (drawer) { setDrawer(false); return; }
      if (!canGoBack) CapApp.exitApp();
    });
    return () => { void h.then((hh) => hh.remove()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv.btwOpen, settings, picker, drawer]);

  if (!cfg.loaded || !conv.loaded) {
    return (
      <div className="app">
        <div className="empty">
          <div className="empty-mark">BTW</div>
          <div className="empty-sub">{t.loadingApp}</div>
        </div>
      </div>
    );
  }

  const active = conv.conversations.find((c) => c.id === conv.activeId);
  const provider = cfg.providers.find((p) => p.id === (active?.providerId || cfg.settings.activeProviderId));
  const model = provider?.models.find((m) => m.id === (active?.modelId || cfg.settings.activeModelId));
  const hasKey = !!provider?.apiKey;
  const { input, output } = estimateInputOutputTokens(active?.messages || [], cfg.settings.systemPrompt);
  const cost = estimateCostUsd(input, output, model);
  const total = input + output;
  const tokLine = active && active.messages.length
    ? `${total >= 1000 ? (total / 1000).toFixed(1) + 'k' : total} tok${cost ? ' · ' + (resolveLang(cfg.settings.language) === 'zh' ? '¥' + (cost * 7.2).toFixed(3) : '$' + cost.toFixed(4)) : ''}`
    : '';
  const showEmpty = !active || active.messages.length === 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <div className="appbar">
          <button className="icon-btn" onClick={() => setDrawer(true)}><MenuIcon size={22} /></button>
          <button className="appbar-center" onClick={() => setPicker(true)} style={{ background: 'none', border: 'none' }}>
            <div className="appbar-model">
              <span className={`dot-key ${hasKey ? '' : 'no'}`} />
              <span className="label">{model?.name || t.selectModel}</span>
              <ChevronDownIcon className="appbar-chevron" size={16} />
            </div>
            <div className="appbar-sub">{provider?.name || '—'}{hasKey ? (tokLine ? ' · ' + tokLine : '') : ` · ${t.noApiKeyMobile}`}</div>
          </button>
          <button className="icon-btn" onClick={() => conv.newConversation()}><PlusIcon size={22} /></button>
          <button className="icon-btn" onClick={() => setSettings(true)}><GearIcon size={21} /></button>
        </div>

        {showEmpty ? (
          <div className="empty">
            <div className="empty-mark">BTW</div>
            <div className="empty-title">{t.chatWelcome}</div>
            <div className="empty-sub">{t.chatWelcomeSub}</div>
            <div className="empty-sub" style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}><SparkIcon size={14} /> {t.chatBtwFeature}</div>
          </div>
        ) : <ChatPanel />}

        <Composer variant="main" />

        <AnimatePresence>
          {drawer && <Sidebar onClose={() => setDrawer(false)} onOpenSettings={() => { setDrawer(false); setSettings(true); }} />}
        </AnimatePresence>
        <AnimatePresence>{picker && <ModelPicker onClose={() => setPicker(false)} />}</AnimatePresence>
        <AnimatePresence>{settings && <SettingsModal onClose={() => setSettings(false)} />}</AnimatePresence>
        <AnimatePresence>{conv.btwOpen && <BtwSheet open={conv.btwOpen} onClose={() => conv.closeBtw()} />}</AnimatePresence>
      </div>
    </MotionConfig>
  );
}
