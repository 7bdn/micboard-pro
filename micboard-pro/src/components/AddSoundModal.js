import React, { useState, useRef } from 'react';

const EMOJIS = ['🔊','🎵','🎶','💥','🎸','🥁','🎺','🎻','🔔','🎤','🎧','📢','🔥','⚡','💫','😂','👏','🎉','🚨','💀'];

export default function AddSoundModal({ onAdd, onClose, categories }) {
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleBrowse = async () => {
    const paths = await window.electronAPI.openAudioFiles();
    if (paths.length) addFiles(paths);
  };

  const handleFolderBrowse = async () => {
    const paths = await window.electronAPI.openAudioFolder();
    if (paths.length) addFiles(paths);
  };

  const addFiles = (paths) => {
    const newFiles = paths.map(p => ({
      path: p,
      name: p.split(/[\\/]/).pop().replace(/\.[^.]+$/, ''),
      category: 'custom',
      volume: 1.0,
      emoji: '🔊',
    }));
    setFiles(f => [...f, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const paths = Array.from(e.dataTransfer.files).filter(f => /\.(mp3|wav|ogg|flac|m4a)$/i.test(f.name)).map(f => f.path);
    if (paths.length) addFiles(paths);
  };

  const updateFile = (idx, updates) => {
    setFiles(f => f.map((x, i) => i === idx ? { ...x, ...updates } : x));
  };

  const handleAdd = async () => {
    if (!files.length) return;
    await onAdd(files.map(f => f.path));
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:600,maxHeight:'80vh',overflow:'auto'}} onClick={e => e.stopPropagation()}>
        <div className="modal-title"><i className="ti ti-music-plus" /> Add Sounds</div>

        <div
          className={`drop-zone${dragOver ? ' dragover' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={handleBrowse}
        >
          <i className="ti ti-drag-drop" />
          <span>Drag & drop audio files here, or click to browse</span>
          <span style={{fontSize:11,marginTop:4,color:'#333'}}>MP3 · WAV · OGG · FLAC · M4A · AAC</span>
        </div>

        <div style={{display:'flex',gap:8,marginTop:10,marginBottom:14}}>
          <button className="btn" style={{flex:1}} onClick={handleBrowse}><i className="ti ti-file-music" /> Browse Files</button>
          <button className="btn" style={{flex:1}} onClick={handleFolderBrowse}><i className="ti ti-folder-open" /> Import Folder</button>
        </div>

        {files.length > 0 && (
          <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:280,overflowY:'auto'}}>
            {files.map((f, i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,background:'#111',border:'1px solid var(--border)',borderRadius:8,padding:'8px 10px'}}>
                <span style={{fontSize:20,cursor:'pointer'}} title="Click to change"
                  onClick={() => { const idx = EMOJIS.indexOf(f.emoji||'🔊'); updateFile(i, {emoji: EMOJIS[(idx+1)%EMOJIS.length]}); }}>
                  {f.emoji}
                </span>
                <input className="form-input" style={{flex:1,padding:'5px 8px',fontSize:12}}
                  value={f.name} onChange={e => updateFile(i, {name: e.target.value})} />
                <select className="form-select" style={{width:100,padding:'5px 8px',fontSize:11}}
                  value={f.category} onChange={e => updateFile(i, {category: e.target.value})}>
                  {(categories||[]).filter(c=>c.id!=='all').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button className="btn sm" style={{color:'var(--red)',borderColor:'#3a1000'}} onClick={() => setFiles(f => f.filter((_,j)=>j!==i))}>
                  <i className="ti ti-x" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn accent" disabled={!files.length} onClick={handleAdd}>
            <i className="ti ti-plus" /> Add {files.length > 0 ? `${files.length} Sound${files.length>1?'s':''}` : 'Sounds'}
          </button>
        </div>
      </div>
    </div>
  );
}
