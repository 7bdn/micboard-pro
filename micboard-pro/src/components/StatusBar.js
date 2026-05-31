import React from 'react';

export default function StatusBar({ micActive, virtualMicActive, playingCount, latency, sampleRate, micLevel }) {
  return (
    <div className="statusbar">
      <div className="sb-item">
        <div className={`sb-dot ${micActive ? 'green' : 'gray'}`} />
        {micActive ? 'Mic Active' : 'Mic Off'}
      </div>
      <div className="sb-item">
        <div className={`sb-dot ${virtualMicActive ? 'green' : 'gray'}`} />
        Virtual Mic
      </div>
      {playingCount > 0 && (
        <div className="sb-item">
          <div className="sb-dot gold" />
          {playingCount} Playing
        </div>
      )}
      <div className="sb-spacer" />
      <div className="sb-item">
        <i className="ti ti-activity" style={{fontSize:12}} />
        WASAPI
      </div>
      <div className="sb-item">
        <i className="ti ti-cpu" style={{fontSize:12}} />
        {latency}
      </div>
      <div className="sb-item">
        <i className="ti ti-wave-sine" style={{fontSize:12}} />
        {sampleRate}
      </div>
      <div className="sb-item" style={{color:'var(--gold)',fontSize:9,letterSpacing:2,fontFamily:'var(--font-mono)'}}>
        v1.0.0
      </div>
    </div>
  );
}
