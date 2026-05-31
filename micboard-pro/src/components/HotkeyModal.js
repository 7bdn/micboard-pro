import React, { useState, useEffect } from 'react';

export default function HotkeyModal({ sound, onSave, onClose }) {
  const [listening, setListening] = useState(false);
  const [captured, setCaptured] = useState(sound?.hotkey || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!listening) return;
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const parts = [];
      if (e.ctrlKey)  parts.push('Ctrl');
      if (e.altKey)   parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      const key = e.key;
      if (!['Control','Alt','Shift','Meta'].includes(key)) {
        const keyStr = key.length === 1 ? key.toUpperCase() : key;
        parts.push(keyStr);
        const combo = parts.join('+');
        setCaptured(combo);
        setListening(false);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [listening]);

  const handleSave = async () => {
    if (!captured) { setError('Please capture a hotkey first'); return; }
    await onSave(sound, captured);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          <i className="ti ti-keyboard" />
          Set Hotkey — {sound?.name}
        </div>

        <div style={{marginBottom:14,fontSize:13,color:'var(--text-muted)'}}>
          Assign a global keyboard shortcut to trigger this sound from anywhere — even while gaming.
        </div>

        <div
          className={`hotkey-display${listening ? ' listening' : ''}`}
          onClick={() => { setListening(true); setCaptured(''); setError(''); }}
        >
          {listening ? '🎧 Press any key...' : (captured || 'Click to capture')}
        </div>

        {error && <div style={{color:'var(--red)',fontSize:12,marginBottom:8}}>{error}</div>}

        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
          {['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'].map(k => (
            <button key={k} className={`btn sm${captured===k?' accent':''}`} onClick={() => { setCaptured(k); setListening(false); }}>{k}</button>
          ))}
        </div>

        <div className="modal-footer">
          {sound?.hotkey && (
            <button className="btn danger" onClick={() => { onSave(sound, null); onClose(); }}>Remove</button>
          )}
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn accent" onClick={handleSave}><i className="ti ti-check" /> Save</button>
        </div>
      </div>
    </div>
  );
}
