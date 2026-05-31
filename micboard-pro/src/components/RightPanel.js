import React, { useEffect, useState } from 'react';

export default function RightPanel({
  nowPlaying, playingSounds, masterVolume, onMasterVolumeChange,
  micVolume, onMicVolumeChange, micBoost, onMicBoostChange,
  micLevel, micLevelDb, outputLevel, micMuted, onMicMute,
  fxState, onFxChange, virtualMicActive, onStopAll, onPlayPause, queue
}) {
  const [progress, setProgress] = useState(35);

  useEffect(() => {
    if (!nowPlaying) { setProgress(0); return; }
    const iv = setInterval(() => setProgress(p => p >= 100 ? 0 : p + 0.2), 100);
    return () => clearInterval(iv);
  }, [nowPlaying]);

  return (
    <div className="right-panel">
      {/* Now Playing */}
      <div className="rp-section">
        <div className="rp-title">Now Playing</div>
        {nowPlaying ? (
          <div className="now-card">
            <div style={{fontSize:10,color:'var(--text-dim)',marginBottom:3}}>Track</div>
            <div className="now-name">{nowPlaying.name}</div>
            <div className="prog-bar"><div className="prog-fill" style={{width:`${progress}%`}} /></div>
            <div className="now-controls">
              <div className="nc-btn" onClick={onPlayPause}>
                <i className={`ti ${playingSounds.has(nowPlaying.id) ? 'ti-player-pause' : 'ti-player-play'}`} />
              </div>
              <div className="nc-btn stop" onClick={onStopAll}><i className="ti ti-player-stop" /></div>
              <div style={{flex:1}} />
              <span style={{fontSize:10,color:'var(--text-dim)',fontFamily:'var(--font-mono)'}}>
                {playingSounds.size} playing
              </span>
            </div>
          </div>
        ) : (
          <div className="now-card" style={{border:'1px solid var(--border)'}}>
            <div className="now-empty"><i className="ti ti-volume-off" style={{display:'block',fontSize:22,marginBottom:4}} /> Nothing playing</div>
          </div>
        )}
      </div>

      {/* Master Volume */}
      <div className="rp-section">
        <div className="rp-title">Master Volume</div>
        <div className="master-vol-row">
          <span className="master-num">{masterVolume}</span>
          <input type="range" min="0" max="100" value={masterVolume} onChange={e => onMasterVolumeChange(parseInt(e.target.value))} style={{flex:1}} />
        </div>
      </div>

      {/* Mic quick controls */}
      <div className="rp-section">
        <div className="rp-title">Microphone</div>
        <div className="meter-wrap">
          <div className="meter-row">
            <span className="meter-label" style={{fontSize:10}}>Input</span>
            <div className="meter-bar"><div className="meter-fill" style={{width:`${Math.min(100,micLevel*100)}%`}} /></div>
            <span className="meter-db">{micLevelDb > -60 ? `${Math.round(micLevelDb)}` : '-∞'}</span>
          </div>
        </div>
        <div className="slider-row">
          <div className="slider-label">Volume <span>{micVolume}%</span></div>
          <input type="range" min="0" max="200" value={micVolume} onChange={e => onMicVolumeChange(parseInt(e.target.value))} />
        </div>
        <div className="slider-row">
          <div className="slider-label">Boost <span>+{micBoost}dB</span></div>
          <input type="range" min="0" max="30" value={micBoost} onChange={e => onMicBoostChange(parseInt(e.target.value))} />
        </div>
        <button className={`btn${micMuted ? ' danger' : ''}`} style={{width:'100%'}} onClick={onMicMute}>
          <i className={`ti ${micMuted ? 'ti-microphone-off' : 'ti-microphone'}`} />
          {micMuted ? 'Unmute Mic' : 'Mute Mic'}
        </button>
      </div>

      {/* FX Quick */}
      <div className="rp-section">
        <div className="rp-title">FX Processing</div>
        <div style={{display:'flex',flexDirection:'column',gap:5}}>
          {[
            { key:'noiseGate', label:'Noise Gate' },
            { key:'noiseReduction', label:'Noise Reduce' },
            { key:'compressor', label:'Compressor' },
            { key:'echoCancel', label:'Echo Cancel' },
            { key:'autoDucking', label:'Auto Ducking' },
            { key:'voiceChanger', label:'Voice Changer' },
          ].map(fx => (
            <div key={fx.key} className={`fx-toggle${fxState[fx.key] ? ' on' : ''}`} onClick={() => onFxChange(fx.key, !fxState[fx.key])}>
              <span className="fx-name">{fx.label}</span>
              <div className={`toggle-pill${fxState[fx.key] ? ' on' : ''}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Virtual Output */}
      <div className="rp-section">
        <div className="rp-title">Virtual Output</div>
        <div className="output-badge">
          <span className="output-badge-name"><i className="ti ti-device-speaker" /> Virtual Mic</span>
          <span className={`output-status ${virtualMicActive ? 'active' : 'inactive'}`}>{virtualMicActive ? 'ACTIVE' : 'OFF'}</span>
        </div>
        <div className="output-badge">
          <span className="output-badge-name"><i className="ti ti-brand-discord" /> Discord</span>
          <span className="output-status linked">LINKED</span>
        </div>
      </div>
    </div>
  );
}
