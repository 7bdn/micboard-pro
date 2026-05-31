import React, { useState, useRef, useCallback } from 'react';

const EMOJIS = ['🔊','🎵','🎶','💥','🎸','🥁','🎺','🎻','🔔','🎤','🎧','📢','🔥','⚡','💫','😂','👏','🎉','🚨','💀'];

export default function Soundboard({
  sounds, playingSounds, searchQuery, onSearchChange,
  onPlay, onStop, onStopAll, onAddSounds, onDelete, onUpdate,
  onToggleFavorite, onSetHotkey, onVolumeChange, loopMode, onLoopToggle
}) {
  const [dragOver, setDragOver] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [showVolId, setShowVolId] = useState(null);
  const fileInput = useRef();

  const handleFileDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files)
      .filter(f => /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(f.name))
      .map(f => f.path);
    if (files.length) onAddSounds(files);
  }, [onAddSounds]);

  const handleFileInput = async (e) => {
    const files = Array.from(e.target.files).map(f => f.path);
    if (files.length) onAddSounds(files);
    e.target.value = '';
  };

  const handleBrowse = async () => {
    const files = await window.electronAPI.openAudioFiles();
    if (files.length) onAddSounds(files);
  };

  const handleFolderImport = async () => {
    const files = await window.electronAPI.openAudioFolder();
    if (files.length) onAddSounds(files);
  };

  const startEdit = (sound, e) => {
    e.stopPropagation();
    setEditingId(sound.id);
    setEditName(sound.name);
  };

  const commitEdit = async (id) => {
    if (editName.trim()) await onUpdate(id, { name: editName.trim() });
    setEditingId(null);
  };

  const cycleEmoji = async (sound, e) => {
    e.stopPropagation();
    const idx = EMOJIS.indexOf(sound.emoji || '🔊');
    const next = EMOJIS[(idx + 1) % EMOJIS.length];
    await onUpdate(sound.id, { emoji: next });
  };

  return (
    <div className="soundboard"
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleFileDrop}
    >
      {/* Top bar */}
      <div className="topbar">
        <div className="search-box">
          <i className="ti ti-search" />
          <input value={searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder="Search sounds..." />
          {searchQuery && <i className="ti ti-x" style={{cursor:'pointer',color:'#444'}} onClick={() => onSearchChange('')} />}
        </div>
        <button className="btn accent" onClick={handleBrowse}><i className="ti ti-plus" /> Add</button>
        <button className="btn" onClick={handleFolderImport} title="Import folder"><i className="ti ti-folder-open" /></button>
        <button className="btn" onClick={onLoopToggle} title="Loop mode" style={loopMode ? {color:'var(--gold)',borderColor:'var(--gold-border)'} : {}}>
          <i className="ti ti-repeat" />
        </button>
        <button className="btn danger" onClick={onStopAll}><i className="ti ti-player-stop" /> Stop All</button>
        <input ref={fileInput} type="file" accept=".mp3,.wav,.ogg,.flac,.m4a,.aac" multiple style={{display:'none'}} onChange={handleFileInput} />
      </div>

      {/* Grid */}
      {sounds.length === 0 ? (
        <div className="sounds-empty fade-in">
          <i className="ti ti-music-off" />
          <p>{searchQuery ? 'No results found' : 'Drop audio files here or click Add'}</p>
          <button className="btn accent" onClick={handleBrowse}><i className="ti ti-plus" /> Add Sounds</button>
          <div className={`drop-zone${dragOver ? ' dragover' : ''}`} style={{width:260}} onClick={handleBrowse}>
            <i className="ti ti-drag-drop" />
            <span>Drag & Drop audio files</span>
          </div>
        </div>
      ) : (
        <div className={`sounds-grid${dragOver ? ' dragover-grid' : ''}`}>
          {dragOver && (
            <div className="drop-zone" style={{gridColumn:'1/-1',margin:'0 0 4px'}}>
              <i className="ti ti-drag-drop" /> Drop files to add
            </div>
          )}
          {sounds.map(sound => (
            <SoundCard
              key={sound.id}
              sound={sound}
              playing={playingSounds.has(sound.id)}
              editing={editingId === sound.id}
              editName={editName}
              showVol={showVolId === sound.id}
              onEditNameChange={setEditName}
              onPlay={() => onPlay(sound)}
              onStop={() => onStop(sound.id)}
              onStartEdit={(e) => startEdit(sound, e)}
              onCommitEdit={() => commitEdit(sound.id)}
              onDelete={(e) => { e.stopPropagation(); onDelete(sound.id); }}
              onFav={(e) => { e.stopPropagation(); onToggleFavorite(sound.id); }}
              onHotkey={(e) => { e.stopPropagation(); onSetHotkey(sound); }}
              onVolToggle={(e) => { e.stopPropagation(); setShowVolId(showVolId === sound.id ? null : sound.id); }}
              onVolChange={(v) => onVolumeChange(sound.id, v)}
              onCycleEmoji={(e) => cycleEmoji(sound, e)}
            />
          ))}
          {/* Add more card */}
          <div className="sound-card add-card" onClick={handleBrowse} style={{border:'1px dashed #1a1a1a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,color:'#2a2a2a',minHeight:100}}>
            <i className="ti ti-plus" style={{fontSize:28}} />
            <span style={{fontSize:11,letterSpacing:1}}>Add Sound</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SoundCard({ sound, playing, editing, editName, showVol, onEditNameChange, onPlay, onStop, onStartEdit, onCommitEdit, onDelete, onFav, onHotkey, onVolToggle, onVolChange, onCycleEmoji }) {
  return (
    <div className={`sound-card fade-in${playing ? ' playing' : ''}`} onClick={playing ? onStop : onPlay}>
      {playing && <div className="playing-dot" style={{position:'absolute',top:8,right:8}} />}
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        <span style={{fontSize:22,lineHeight:1,cursor:'pointer'}} onClick={onCycleEmoji} title="Click to change emoji">{sound.emoji || '🔊'}</span>
        {editing ? (
          <input
            className="form-input"
            style={{fontSize:12,padding:'2px 6px',flex:1}}
            value={editName}
            autoFocus
            onChange={e => onEditNameChange(e.target.value)}
            onBlur={onCommitEdit}
            onKeyDown={e => { if(e.key==='Enter') onCommitEdit(); if(e.key==='Escape') onCommitEdit(); }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <div className="sound-card-name">{sound.name}</div>
        )}
      </div>

      {showVol && (
        <div onClick={e => e.stopPropagation()}>
          <input type="range" min="0" max="1" step="0.05"
            defaultValue={sound.volume ?? 1}
            onChange={e => onVolChange(parseFloat(e.target.value))}
            style={{width:'100%'}}
          />
        </div>
      )}

      <div className="sound-card-meta">
        <span className={`sound-card-key${sound.hotkey ? '' : ' unset'}`}>
          {sound.hotkey || 'No key'}
        </span>
      </div>

      <div className="sound-card-actions">
        <div className={`sc-action fav${sound.favorite ? ' active' : ''}`} onClick={onFav} title="Favorite"><i className="ti ti-star" /></div>
        <div className="sc-action" onClick={onVolToggle} title="Volume"><i className="ti ti-volume" /></div>
        <div className="sc-action" onClick={onHotkey} title="Set hotkey"><i className="ti ti-keyboard" /></div>
        <div className="sc-action" onClick={onStartEdit} title="Rename"><i className="ti ti-pencil" /></div>
        <div className="sc-action del" onClick={onDelete} title="Delete"><i className="ti ti-trash" /></div>
      </div>
    </div>
  );
}
