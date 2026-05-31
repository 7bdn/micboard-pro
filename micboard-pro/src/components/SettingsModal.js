import React, { useState } from 'react';

export default function SettingsModal({ db, onClose, onSave }) {
  const s = db.settings;
  const [settings, setSettings] = useState({
    minimizeToTray: s.minimizeToTray ?? true,
    startMinimized: s.startMinimized ?? false,
    stopAllKey: s.stopAllKey ?? 'F8',
    fadeInDuration: s.fadeInDuration ?? 0,
    fadeOutDuration: s.fadeOutDuration ?? 0.3,
    defaultVolume: s.defaultVolume ?? 1.0,
    enableHotkeys: s.enableHotkeys ?? true,
    showNotifications: s.showNotifications ?? true,
    accentColor: s.accentColor ?? '#c8a86b',
  });

  const update = (k, v) => setSettings(p => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxHeight:'80vh',overflowY:'auto'}} onClick={e => e.stopPropagation()}>
        <div className="modal-title"><i className="ti ti-settings" /> Settings</div>

        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          {/* General */}
          <div>
            <div style={{fontSize:10,color:'var(--text-dim)',letterSpacing:3,textTransform:'uppercase',marginBottom:10,fontWeight:600}}>General</div>
            <div className="form-row">
              <label style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
                <span className="form-label" style={{marginBottom:0}}>Minimize to Tray</span>
                <div className={`toggle-pill${settings.minimizeToTray?' on':''}`} onClick={() => update('minimizeToTray', !settings.minimizeToTray)} />
              </label>
            </div>
            <div className="form-row">
              <label style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
                <span className="form-label" style={{marginBottom:0}}>Start Minimized</span>
                <div className={`toggle-pill${settings.startMinimized?' on':''}`} onClick={() => update('startMinimized', !settings.startMinimized)} />
              </label>
            </div>
            <div className="form-row">
              <label style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
                <span className="form-label" style={{marginBottom:0}}>Enable Global Hotkeys</span>
                <div className={`toggle-pill${settings.enableHotkeys?' on':''}`} onClick={() => update('enableHotkeys', !settings.enableHotkeys)} />
              </label>
            </div>
          </div>

          {/* Audio */}
          <div>
            <div style={{fontSize:10,color:'var(--text-dim)',letterSpacing:3,textTransform:'uppercase',marginBottom:10,fontWeight:600}}>Audio</div>
            <div className="form-row">
              <div className="form-label">Stop All Hotkey</div>
              <input className="form-input" value={settings.stopAllKey} onChange={e => update('stopAllKey', e.target.value)} placeholder="e.g. F8" />
            </div>
            <div className="form-row">
              <div className="form-label">Default Volume: {Math.round(settings.defaultVolume * 100)}%</div>
              <input type="range" min="0" max="1" step="0.05" value={settings.defaultVolume} onChange={e => update('defaultVolume', parseFloat(e.target.value))} />
            </div>
            <div className="form-row">
              <div className="form-label">Fade In: {settings.fadeInDuration}s</div>
              <input type="range" min="0" max="2" step="0.1" value={settings.fadeInDuration} onChange={e => update('fadeInDuration', parseFloat(e.target.value))} />
            </div>
            <div className="form-row">
              <div className="form-label">Fade Out: {settings.fadeOutDuration}s</div>
              <input type="range" min="0" max="2" step="0.1" value={settings.fadeOutDuration} onChange={e => update('fadeOutDuration', parseFloat(e.target.value))} />
            </div>
          </div>

          {/* Data */}
          <div>
            <div style={{fontSize:10,color:'var(--text-dim)',letterSpacing:3,textTransform:'uppercase',marginBottom:10,fontWeight:600}}>Data</div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn" style={{flex:1}} onClick={() => window.electronAPI.exportSettings()}><i className="ti ti-download" /> Export</button>
              <button className="btn" style={{flex:1}} onClick={async () => { await window.electronAPI.importSettings(); window.location.reload(); }}><i className="ti ti-upload" /> Import</button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn accent" onClick={() => onSave(settings)}><i className="ti ti-check" /> Save</button>
        </div>
      </div>
    </div>
  );
}
