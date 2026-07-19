import React, { useState, useEffect } from 'react';
import { SettingsIcon, MinusIcon, PlusMini } from './Icons';
import { Logo } from './Logo';
import { useT } from '../i18n';

interface Props {
  onOpenSettings: () => void;
}

export const TitleBar: React.FC<Props> = ({ onOpenSettings }) => {
  const [maximized, setMaximized] = useState(false);
  const isMac = window.btw.platform === 'darwin';
  const { t } = useT();

  useEffect(() => {
    const unsub = window.btw.window.onMaximizeChange(setMaximized);
    return () => { unsub(); };
  }, []);

  return (
    <div className="titlebar glass">
      {/* 左侧：logo + 标题（可拖拽区域） */}
      <div className="titlebar-brand">
        <Logo size={24} />
        <span className="titlebar-appname">{t.appName}</span>
      </div>

      {/* 中间：可拖拽空区 */}
      <div className="titlebar-drag" />

      {/* 右侧：设置 + Windows 风格窗口按钮 */}
      <div className="titlebar-actions">
        <button className="btn btn-icon" title={t.settings} onClick={onOpenSettings}>
          <SettingsIcon size={18} />
        </button>

        {/* macOS 保留原生红绿灯；Windows 用标准三按钮 */}
        {isMac ? (
          <div className="traffic">
            <button className="traffic-light close" onClick={() => window.btw.window.close()} />
            <button className="traffic-light min" onClick={() => window.btw.window.minimize()} />
            <button className="traffic-light max" onClick={() => window.btw.window.maximize()} />
          </div>
        ) : (
          <div className="win-buttons">
            <button className="win-btn" title={t.tbMinimize} onClick={() => window.btw.window.minimize()}>
              <MinusIcon size={15} />
            </button>
            <button className="win-btn" title={maximized ? t.tbRestore : t.tbMaximize} onClick={() => window.btw.window.maximize()}>
              {maximized ? <RestoreIcon /> : <PlusMini size={13} />}
            </button>
            <button className="win-btn win-close" title={t.tbClose} onClick={() => window.btw.window.close()}>
              <CloseGlyph />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Windows 风格的还原图标（两个重叠方框）
const RestoreIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.2">
    <rect x="2.5" y="4.5" width="7" height="6" rx="1" />
    <path d="M4.5 4.5V3a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H8.5" />
  </svg>
);

const CloseGlyph: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.2">
    <path d="M1 1l10 10M11 1L1 11" />
  </svg>
);
