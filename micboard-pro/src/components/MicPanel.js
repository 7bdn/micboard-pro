import React, { useEffect, useState } from 'react';

export default function MicPanel({
  micActive, micMuted, micLevel, micLevelDb,
  micVolume, micBoost, micDevices, selectedMicId, fxState, eqValues,
  pitchSemitones, recording,
  onStart, onStop, onMute,
  onVolumeChange, onBoostChange,
  onDeviceChange, onLoadDevices, onFxChange, onEqChange, onPitchChange,
  onRecordToggle, mixerMode
}) {
  const [devicesLoaded, setDevicesLoaded] = useState(false);

  useEffect(() => {
    if (!devicesLoaded) {
      onLoadDevices().then(() => setDevicesLoaded(true));
    }
  }, []);

  const pitchLabel = pitchSemitones > 0 ? `+${pitchSemitones}` : `${pitchSemitones}`;
  const pitchClass = pitchSemitones > 0 ? 'positive' : pitchSemitones < 0 ? 'negative' : 'zero';

  return (
    <div className="mic-panel">
      {/* Status + controls */}
      <div className="panel-card fade-in">
        <div className="panel-card-title">
          Microphone Control
          <span onClick={onRecordToggle} style={recording ? {color:'var(--red)'} : {}}>
            <i className={`ti ${recording ? 'ti-record-mail' : 'ti-record-mail'}`} /> {recording ? 'Stop Rec' : 'Record'}
          </span>
        </div>

        <div style={{display:'flex',gap:10,marginBottom:14}}>
          <button className={`btn${micActive ? ' danger' : ' accent'}`} style={{flex:1}} onClick={micActive ? onStop : () => onStart()}>
            <i className={`ti ${micActive ? 'ti-microphone-off' : 'ti-microphone'}`} />
            {micActive ? 'Stop Mic' : 'Start Mic'}
          </button>
          <button className={`btn${micMuted ? ' danger' : ''}`} onClick={onMute} title={micMuted ? 'Unmute' : 'Mute'}>
            <i className={`ti ${micMuted ? 'ti-microphone-off' : 'ti-microphone'}`} />
          </button>
        </div>

        {/* Level meter */}
        <div className="meter-wrap">
          <div className="meter-row">
            <span className="meter-label">Input Level</span>
            <div className="meter-bar">
              <div className="meter-fill" style={{width: `${Math.min(100, micLevel * 100)}%`}} />
            </div>
            <span className="meter-db">{micLevelDb > -60 ? `${Math.round(micLevelDb)} dB` : '-∞'}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="slider-row">
          <div className="slider-label">Mic Volume <span>{micVolume}%</span></div>
          <input type="range" min="0" max="200" value={micVolume} onChange={e => onVolumeChange(parseInt(e.target.value))} />
        </div>

        {/* Boost */}
        <div className="slider-row">
          <div className="slider-label">Mic Boost <span>+{micBoost} dB</span></div>
          <input type="range" min="0" max="30" value={micBoost} onChange={e => onBoostChange(parseInt(e.target.value))} />
        </div>
      </div>

      {/* Device selector */}
      <div className="panel-card fade-in">
        <div className="panel-card-title">Input Device <span onClick={onLoadDevices}>↻ Refresh</span></div>
        {micDevices.length === 0 ? (
          <div style={{color:'var(--text-dim)',fontSize:12,textAlign:'center',padding:'8px 0'}}>
            {devicesLoaded ? 'No microphones found' : 'Loading devices...'}
          </div>
        ) : micDevices.map(dev => (
          <div key={dev.deviceId}
            className={`device-card${selectedMicId === dev.deviceId ? ' active' : ''}`}
            onClick={() => onDeviceChange(dev.deviceId)}
          >
            <i className="ti ti-microphone" />
            <span className="device-name">{dev.label || `Microphone ${dev.deviceId.slice(0,8)}`}</span>
            {selectedMicId === dev.deviceId && <i className="ti ti-check" style={{color:'var(--gold)',fontSize:14}} />}
          </div>
        ))}
      </div>

      {/* FX */}
      <div className="panel-card fade-in">
        <div className="panel-card-title">FX Processing</div>
        <div className="fx-grid">
          {[
            { key: 'noiseGate',     label: 'Noise Gate' },
            { key: 'noiseReduction',label: 'Noise Reduce' },
            { key: 'compressor',    label: 'Compressor' },
            { key: 'echoCancel',    label: 'Echo Cancel' },
            { key: 'autoDucking',   label: 'Auto Duck' },
            { key: 'voiceChanger',  label: 'Voice Changer' },
          ].map(fx => (
            <div key={fx.key} className={`fx-toggle${fxState[fx.key] ? ' on' : ''}`} onClick={() => onFxChange(fx.key, !fxState[fx.key])}>
              <span className="fx-name">{fx.label}</span>
              <div className={`toggle-pill${fxState[fx.key] ? ' on' : ''}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Voice Changer / Pitch */}
      {fxState.voiceChanger && (
        <div className="panel-card fade-in">
          <div className="panel-card-title">Voice Changer — Pitch Shift</div>
          <div className={`pitch-display ${pitchClass}`}>{pitchLabel} st</div>
          <input type="range" min="-12" max="12" step="1" value={pitchSemitones}
            onChange={e => onPitchChange(parseInt(e.target.value))} />
          <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
            {[{label:'Chipmunk',val:8},{label:'Normal',val:0},{label:'Deep',val:-8}].map(p => (
              <button key={p.label} className="btn sm" onClick={() => onPitchChange(p.val)}>{p.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* EQ */}
      {mixerMode && (
        <div className="panel-card fade-in">
          <div className="panel-card-title">Equalizer</div>
          <div className="eq-grid">
            {[
              { key: 'lowCut',  label: 'Low Cut', min: 20,  max: 400, unit: 'Hz' },
              { key: 'lowMid',  label: '300 Hz',  min: -12, max: 12,  unit: 'dB' },
              { key: 'highMid', label: '3 kHz',   min: -12, max: 12,  unit: 'dB' },
              { key: 'high',    label: 'High',    min: -12, max: 12,  unit: 'dB' },
            ].map(band => (
              <div key={band.key} className="eq-band">
                <div className="eq-value">{eqValues[band.key]}{band.unit}</div>
                <input type="range" min={band.min} max={band.max} step="1"
                  value={eqValues[band.key]}
                  onChange={e => onEqChange(band.key, parseInt(e.target.value))}
                  className="eq-slider"
                  style={{writingMode:'vertical-lr',direction:'rtl',height:70}}
                />
                <div className="eq-label">{band.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Virtual output */}
      <div className="panel-card fade-in">
        <div className="panel-card-title">Virtual Output</div>
        <div className="output-badge">
          <span className="output-badge-name"><i className="ti ti-device-speaker" /> Virtual Mic</span>
          <span className={`output-status ${micActive ? 'active' : 'inactive'}`}>{micActive ? 'ACTIVE' : 'INACTIVE'}</span>
        </div>
        <div className="output-badge">
          <span className="output-badge-name"><i className="ti ti-brand-discord" /> Discord</span>
          <span className="output-status linked">LINKED</span>
        </div>
        <div className="output-badge">
          <span className="output-badge-name"><i className="ti ti-brand-twitch" /> OBS / Stream</span>
          <span className="output-status linked">LINKED</span>
        </div>
        <div style={{fontSize:11,color:'var(--text-dim)',marginTop:10,lineHeight:1.6}}>
          Select <b style={{color:'var(--text-muted)'}}>MicBoard Virtual Mic</b> as your microphone input in Discord, OBS, or any app.
        </div>
      </div>
    </div>
  );
}
