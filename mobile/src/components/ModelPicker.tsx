import React from 'react';
import { motion, bottomSheetV, scrimV, springSoft } from './motion';
import { useConfig } from '../stores/config';
import { useConversations } from '../stores/conversations';
import { useT, formatPricePerM } from '../i18n';
import { CheckIcon, BrainIcon } from './Icons';

function ctx(n?: number) { if (!n) return ''; return n >= 1000000 ? (n / 1000000) + 'M ctx' : Math.round(n / 1000) + 'k ctx'; }

export const ModelPicker: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t, lang } = useT();
  const cfg = useConfig();
  const conv = useConversations();
  const active = conv.conversations.find((c) => c.id === conv.activeId);
  const providers = cfg.providers.filter((p) => p.enabled && p.models.length);

  return (
    <>
      <motion.div className="scrim" variants={scrimV} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} onClick={onClose} />
      <motion.div className="bsheet" variants={bottomSheetV} initial="initial" animate="animate" exit="exit" transition={springSoft}>
        <div className="bsheet-grip" />
        <div className="bsheet-title">{t.selectModel}</div>
        <div className="bsheet-list">
          {providers.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-faint)', fontSize: 14 }}>{t.needApiKey}</div>
          )}
          {providers.map((p) => (
            <div key={p.id}>
              <div className="group-name">{p.name}</div>
              {p.models.map((m) => {
                const on = (active?.modelId || cfg.settings.activeModelId) === m.id;
                const price = formatPricePerM(m.inputPricePerM || 0, lang);
                return (
                  <motion.div key={m.id} className={`row ${on ? 'active' : ''}`}
                    whileTap={{ scale: 0.985 }} transition={springSoft}
                    onClick={() => { void conv.switchModel(p.id, m.id); onClose(); }}>
                    {on && <motion.div layoutId="model-active" className="row-pill" transition={springSoft} />}
                    <div className="row-main">
                      <div className="row-name">{m.name}</div>
                      <div className="row-meta">{[ctx(m.contextWindow), price].filter(Boolean).join(' · ')}</div>
                    </div>
                    <div className="row-flags">
                      {m.supportsThinking && <span className="flag"><BrainIcon size={11} /></span>}
                      {m.supportsVision && <span className="flag">👁</span>}
                    </div>
                    {on && <CheckIcon size={18} className="row-check" />}
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
