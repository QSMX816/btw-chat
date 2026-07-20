import React from 'react';
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
      <div className="scrim" onClick={onClose} />
      <div className="bottom-sheet">
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
                  <div
                    key={m.id}
                    className={`model-row ${isActive ? 'active' : ''}`}
                    onClick={() => pick(p.id, m.id)}
                  >
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
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
