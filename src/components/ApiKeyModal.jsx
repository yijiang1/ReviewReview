import { useState, useEffect } from 'react';
import { KeyRound, Eye, EyeOff, X, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import {
  PROVIDERS, MODELS,
  getSelectedProvider, setSelectedProvider,
  getApiKey, setApiKey, clearApiKey, isKeyValid,
  getSelectedModel, setSelectedModel,
  estimateRunCost,
} from '../lib/api.js';

const PROVIDER_ORDER = ['anthropic', 'openai', 'gemini'];

const PROVIDER_COLORS = {
  anthropic: { bg: '#fdf4ff', border: '#e9d5ff', fg: '#7c3aed', dot: '#a855f7' },
  openai:    { bg: '#f0fdf4', border: '#bbf7d0', fg: '#16a34a', dot: '#22c55e' },
  gemini:    { bg: '#eff6ff', border: '#bfdbfe', fg: '#1d4ed8', dot: '#3b82f6' },
};

export function ApiKeyModal({ onClose }) {
  const [activeProvider, setActiveProvider] = useState(getSelectedProvider);
  const [keys, setKeys] = useState(() =>
    Object.fromEntries(PROVIDER_ORDER.map(id => [id, getApiKey(id)]))
  );
  const [selectedModels, setSelectedModels] = useState(() =>
    Object.fromEntries(PROVIDER_ORDER.map(id => [id, getSelectedModel(id)]))
  );
  const [show, setShow] = useState({});
  const [saved, setSaved] = useState(false);

  const prov   = PROVIDERS[activeProvider];
  const colors = PROVIDER_COLORS[activeProvider];
  const currentKey   = keys[activeProvider] || '';
  const currentValid = isKeyValid(activeProvider, currentKey);
  const currentModel = selectedModels[activeProvider];
  const models       = MODELS[activeProvider] || [];
  const costEst      = estimateRunCost(activeProvider, currentModel);

  const handleSave = () => {
    PROVIDER_ORDER.forEach(id => {
      const k = keys[id]?.trim();
      if (k) setApiKey(id, k); else clearApiKey(id);
      setSelectedModel(id, selectedModels[id]);
    });
    setSelectedProvider(activeProvider);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 700);
  };

  const handleClear = () => setKeys(prev => ({ ...prev, [activeProvider]: '' }));

  const selectModel = (modelId) =>
    setSelectedModels(prev => ({ ...prev, [activeProvider]: modelId }));

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const keyCount = PROVIDER_ORDER.filter(id => getApiKey(id) || keys[id]?.trim()).length;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 540 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <KeyRound size={17} style={{ color: 'var(--accent-500)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>API Settings</h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                {keyCount === 0 ? 'No keys saved' : `${keyCount} provider${keyCount > 1 ? 's' : ''} configured`}
              </p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose}><X size={17} /></button>
        </div>

        {/* Provider tabs */}
        <div style={{
          display: 'flex', gap: 5, marginBottom: '1.25rem',
          background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', padding: 4,
        }}>
          {PROVIDER_ORDER.map(id => {
            const p = PROVIDERS[id];
            const hasKey = !!(getApiKey(id) || keys[id]?.trim());
            const isActive = activeProvider === id;
            const c = PROVIDER_COLORS[id];
            return (
              <button key={id} onClick={() => setActiveProvider(id)} style={{
                flex: 1, padding: '7px 4px', borderRadius: 'var(--radius-md)',
                border: isActive ? `1px solid ${c.border}` : '1px solid transparent',
                background: isActive ? c.bg : 'transparent',
                color: isActive ? c.fg : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                transition: 'all 0.15s ease',
              }}>
                <span>{p.label}</span>
                {hasKey && <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot }} />}
              </button>
            );
          })}
        </div>

        {/* Security notice */}
        <div style={{
          display: 'flex', gap: 8, padding: '9px 12px',
          background: 'var(--amber-bg)', border: '1px solid var(--amber-border)',
          borderRadius: 'var(--radius-md)', marginBottom: '1.25rem',
        }}>
          <AlertTriangle size={13} style={{ color: 'var(--amber-fg)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: 'var(--amber-fg)', margin: 0, lineHeight: 1.6 }}>
            Keys are stored in this browser's localStorage only — never sent to our servers.
          </p>
        </div>

        {/* Key input */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="label">{prov.label} API Key</label>
          <div style={{ position: 'relative' }}>
            <input
              type={show[activeProvider] ? 'text' : 'password'}
              value={currentKey}
              onChange={e => setKeys(prev => ({ ...prev, [activeProvider]: e.target.value }))}
              placeholder={prov.placeholder}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              style={{ fontFamily: 'var(--font-mono)', paddingRight: 44, fontSize: 13,
                letterSpacing: show[activeProvider] ? 'normal' : '0.08em' }}
            />
            <button className="btn btn-ghost"
              onClick={() => setShow(prev => ({ ...prev, [activeProvider]: !prev[activeProvider] }))}
              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', padding: 6 }}>
              {show[activeProvider] ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
            <a href={prov.docsUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--accent-500)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              {prov.docsLabel} <ChevronRight size={10} />
            </a>
            {' '}· {prov.note}
          </p>
        </div>

        {/* Model selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="label">Model</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {models.map(m => {
              const isSelected = currentModel === m.id;
              const cost = estimateRunCost(activeProvider, m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => selectModel(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: isSelected ? `1.5px solid ${colors.border}` : '1px solid var(--border-subtle)',
                    background: isSelected ? colors.bg : 'var(--bg-glass)',
                    transition: 'all 0.15s ease', textAlign: 'left', fontFamily: 'var(--font-sans)',
                    width: '100%',
                  }}
                >
                  {/* Left: radio + label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      border: isSelected ? `4px solid ${colors.fg}` : '2px solid var(--border-medium)',
                      background: isSelected ? colors.bg : 'white',
                      transition: 'all 0.15s ease',
                    }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isSelected ? colors.fg : 'var(--text-primary)' }}>
                        {m.label}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{m.tag}</p>
                    </div>
                  </div>

                  {/* Right: cost estimate */}
                  {cost && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isSelected ? colors.fg : 'var(--text-secondary)' }}>
                        {cost.formatted}
                      </p>
                      <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)' }}>per run</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Cost breakdown */}
          {costEst && (
            <div style={{
              marginTop: 8, padding: '8px 12px',
              background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)', fontSize: 11, color: 'var(--text-muted)',
              display: 'flex', gap: 12, flexWrap: 'wrap',
            }}>
              <span>Tokens: <strong style={{ color: 'var(--text-secondary)' }}>${costEst.tokenCost.toFixed(4)}</strong></span>
              <span>Web search: <strong style={{ color: 'var(--text-secondary)' }}>${costEst.searchCost.toFixed(4)}</strong></span>
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Based on ~9K input + 6K output tokens per run</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {currentKey && (
            <button className="btn btn-danger" onClick={handleClear} style={{ fontSize: 12, padding: '8px 14px' }}>Clear</button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!currentValid}>
            {saved ? <><CheckCircle size={14} /> Saved!</> : `Use ${prov.label}`}
          </button>
        </div>
      </div>
    </div>
  );
}
