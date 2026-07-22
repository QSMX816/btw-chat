import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { useTheme } from './hooks/useTheme';
import { usePresence } from './hooks/usePresence';
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

  // 覆盖层退场动画
  const dr = usePresence(drawer);
  const pk = usePresence(picker);
  const st = usePresence(settings);
  const btw = usePresence(!!conv.btwOpen);
  // BTW 关闭时 store 立即清空 btwOpen，这里保留快照让退场动画有内容可播
  const lastBtw = useRef(conv.btwOpen);
  if (conv.btwOpen) lastBtw.current = conv.btwOpen;

  // 首次加载本地配置 + 对话
  useEffect(() => {
    (async () => {
      await cfg.load();
      await conv.load();
      if (!conv.conversations.length && !conv.activeId) conv.newConversation();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 安卓返回键：先关覆盖层
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const h = CapApp.addListener('backButton', ({ canGoBack }) => {
      // 任一覆盖层处于「打开中」或「退场中」都不退出 app
      const anyVisible = conv.btwOpen || settings || picker || drawer;
      const anyLeaving = btw.leaving || st.leaving || pk.leaving || dr.leaving;
      if (anyVisible || anyLeaving) {
        if (conv.btwOpen) conv.closeBtw();
        else if (settings) setSettings(false);
        else if (picker) setPicker(false);
        else if (drawer) setDrawer(false);
        return;
      }
      if (!canGoBack) CapApp.exitApp();
    });
    return () => { void h.then((hh) => hh.remove()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv, settings, picker, drawer, btw.leaving, st.leaving, pk.leaving, dr.leaving]);

  if (!cfg.loaded || !conv.loaded) {
    return (
      <div className="app">
        <div className="empty-state">
          <div className="empty-logo">BTW</div>
          <div className="empty-sub">{t.loadingApp}</div>
        </div>
      </div>
    );
  }

  const active = conv.conversations.find((c) => c.id === conv.activeId);
  const provider = cfg.providers.find((p) => p.id === (active?.providerId || cfg.settings.activeProviderId));
  const model = provider?.models.find((m) => m.id === (active?.modelId || cfg.settings.activeModelId));
  const hasKey = !!provider?.apiKey;

  // token / 费用估算
  const { input, output } = estimateInputOutputTokens(active?.messages || [], cfg.settings.systemPrompt);
  const cost = estimateCostUsd(input, output, model);
  const tokLine = active && active.messages.length
    ? `${(input + output) >= 1000 ? ((input + output) / 1000).toFixed(1) + 'k' : (input + output)} tok${cost ? ' · ' + (resolveLang(cfg.settings.language) === 'zh' ? '¥' + (cost * 7.2).toFixed(3) : '$' + cost.toFixed(4)) : ''}`
    : '';

  const showEmpty = !active || active.messages.length === 0;

  return (
    <div className="app">
      <div className="appbar">
        <button className="icon-btn" onClick={() => setDrawer(true)}><MenuIcon size={22} /></button>
        <div className="appbar-title" onClick={() => setPicker(true)}>
          <div className={`appbar-model ${hasKey ? '' : 'no-key'}`}>
            <span className="model-pill-dot" />
            <span>{model?.name || t.selectModel}</span>
            <ChevronDownIcon size={16} />
          </div>
          <div className="appbar-provider">
            {provider?.name || '—'}{hasKey ? (tokLine ? ' · ' + tokLine : '') : ` · ${t.noApiKeyMobile}`}
          </div>
        </div>
        <button className="icon-btn" onClick={() => conv.newConversation()}><PlusIcon size={22} /></button>
        <button className="icon-btn" onClick={() => setSettings(true)}><GearIcon size={21} /></button>
      </div>

      {showEmpty ? (
        <div className="empty-state">
          <div className="empty-logo">BTW</div>
          <div className="empty-title">{t.chatWelcome}</div>
          <div className="empty-sub">{t.chatWelcomeSub}</div>
          <div className="empty-sub" style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
            <SparkIcon size={14} /> {t.chatBtwFeature}
          </div>
        </div>
      ) : (
        <ChatPanel />
      )}

      <Composer variant="main" />

      {dr.render && <Sidebar leaving={dr.leaving} onClose={() => setDrawer(false)} onOpenSettings={() => setSettings(true)} />}
      {pk.render && <ModelPicker leaving={pk.leaving} onClose={() => setPicker(false)} />}
      {st.render && <SettingsModal leaving={st.leaving} onClose={() => setSettings(false)} />}
      {btw.render && <BtwSheet leaving={btw.leaving} open={lastBtw.current} />}
    </div>
  );
}
