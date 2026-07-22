import React from 'react';
import { motion, bottomSheetV, scrimV, springSoft } from './motion';
import { useConfig } from '../stores/config';
import { useConversations } from '../stores/conversations';
import { useT, formatPricePerM } from '../i18n';
import { CheckIcon, BrainIcon } from './Icons';

function fmtCtx(n?: number): string {
  if (!n) return '';
  if (n >= 1000000) return (n / 1000000) + 'M ctx';
  return Math.round(n / 1000) + 'k ctx';
}

export const ModelPicker: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t, lang } = useT();
  const cfg = useConfig();
  const conv = useConversations();
  const active = conv.conversations.find((c) => c.id === conv.activeId);

  const providers = cfg.providers.filter((p) => p.enabled && p.models.length);

  const pick = (providerId: string, modelId: string) => {
    void conv.switchModel(providerId, modelId);
    onClose();
  };

  return (
    <>
      <motion.div className="scrim" variants={scrimV} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} onClick={onClose} />
      <motion.div className="bottom-sheet" variants={bottomSheetV} initial="initial" animate="animate" exit="exit" transition={springSoft}>
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-title">{t.selectModel}</div>
        <div className="bottom-sheet-list">
          {providers.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
              {t.needApiKey}
            </div>
          )}
          {providers.map((p) => (
            <div className="provider-group" key={p.id}>
              <div className="provider-group-name">{p.name}</div>
              {p.models.map((m) => {
                const isActive = (active?.modelId || cfg.settings.activeModelId) === m.id;
                const price = formatPricePerM(m.inputPricePerM || 0, lang);
                return (
                  <motion.div
                    key={m.id}
                    className={`model-row ${isActive ? 'active' : ''}`}
                    whileTap={{ scale: 0.98 }}
                    transition={springSoft}
                    onClick={() => pick(p.id, m.id)}
                  >
                    {isActive && <motion.div layoutId="model-active" className="model-active-pill" transition={springSoft} />}
                    <div className="model-row-main">
                      <div className="model-row-name">{m.name}</div>
                      <div className="model-row-meta">
                        {[fmtCtx(m.contextWindow), price].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div className="model-row-flags">
                      {m.supportsThinking && <span className="flag-chip"><BrainIcon size={11} /></span>}
                      {m.supportsVision && <span className="flag-chip">👁</span>}
                    </div>
                    {isActive && <CheckIcon size={18} className="model-row-check" />}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
};
