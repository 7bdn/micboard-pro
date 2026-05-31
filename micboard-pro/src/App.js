import React, { useState, useEffect, useCallback, useRef } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Soundboard from './components/Soundboard';
import MicPanel from './components/MicPanel';
import RightPanel from './components/RightPanel';
import StatusBar from './components/StatusBar';
import SettingsModal from './components/SettingsModal';
import HotkeyModal from './components/HotkeyModal';
import AddSoundModal from './components/AddSoundModal';
import audioEngine from './audio/AudioEngine';
import db from './database/db';
import './styles/global.css';

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [activeView, setActiveView] = useState('soundboard');
  const [activeProfile, setActiveProfile] = useState('gaming');
  const [sounds, setSounds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingSounds, setPlayingSounds] = useState(new Set());
  const [masterVolume, setMasterVolume] = useState(85);
  const [micVolume, setMicVolume] = useState(80);
  const [micBoost, setMicBoost] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micLevelDb, setMicLevelDb] = useState(-60);
  const [outputLevel, setOutputLevel] = useState(0);
  const [micActive, setMicActive] = useState(false);
  const [micDevices, setMicDevices] = useState([]);
  const [selectedMicId, setSelectedMicId] = useState(null);
  const [fxState, setFxState] = useState({
    noiseGate: true, compressor: false, noiseReduction: true,
    echoCancel: false, autoDucking: false, voiceChanger: false,
  });
  const [pitchSemitones, setPitchSemitones] = useState(0);
  const [eqValues, setEqValues] = useState({ lowCut: 80, lowMid: 0, highMid: 0, high: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [showHotkeyModal, setShowHotkeyModal] = useState(false);
  const [hotkeyTarget, setHotkeyTarget] = useState(null);
  const [showAddSound, setShowAddSound] = useState(false);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loopMode, setLoopMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [virtualMicActive] = useState(true);

  // Init
  useEffect(() => {
    (async () => {
      await db.load();
      setSounds(db.sounds);
      setCategories(db.categories);
      const s = db.settings;
      setMasterVolume(Math.round((s.masterVolume ?? 0.85) * 100));
      setMicVolume(Math.round((s.micVolume ?? 0.8) * 100));
      audioEngine.onMicLevel = (norm, db_) => {
        setMicLevel(norm);
        setMicLevelDb(db_);
      };
      audioEngine.onOutputLevel = (norm) => setOutputLevel(norm);
      audioEngine.onSoundEnded = (id) => {
        setPlayingSounds(p => { const n = new Set(p); n.delete(id); return n; });
        if (nowPlaying?.id === id) setNowPlaying(null);
      };
      // Register hotkeys
      await registerAllHotkeys();
      // Listen for global hotkey triggers
      window.electronAPI.onHotkeyTriggered(handleHotkeyTriggered);
      window.electronAPI.onStopAll(() => stopAllSounds());
      setLoaded(true);
    })();
    return () => {
      audioEngine.destroy();
      window.electronAPI.removeAllListeners('hotkey-triggered');
      window.electronAPI.removeAllListeners('stop-all');
    };
  }, []);

  // Master volume
  useEffect(() => {
    audioEngine.setMasterVolume(masterVolume / 100);
  }, [masterVolume]);

  // Mic volume
  useEffect(() => {
    audioEngine.setMicVolume(micVolume / 100 * 2); // 0-200%
  }, [micVolume]);

  // Mic boost
  useEffect(() => {
    audioEngine.setMicBoost(micBoost);
  }, [micBoost]);

  // FX
  useEffect(() => {
    audioEngine.setCompressor(fxState.compressor);
    audioEngine.setNoiseGate(fxState.noiseGate);
    audioEngine.setAutoDucking(fxState.autoDucking);
    audioEngine.pitchEnabled = fxState.voiceChanger;
  }, [fxState]);

  // Pitch
  useEffect(() => {
    audioEngine.setPitch(pitchSemitones);
  }, [pitchSemitones]);

  const registerAllHotkeys = async () => {
    await window.electronAPI.unregisterAllHotkeys();
    for (const [acc, soundId] of Object.entries(db.hotkeys)) {
      await window.electronAPI.registerHotkey({ accelerator: acc, id: soundId });
    }
    // Stop all hotkey
    const stopKey = db.settings.stopAllKey;
    if (stopKey) {
      await window.electronAPI.registerHotkey({ accelerator: stopKey, id: '__stopAll__' });
    }
  };

  const handleHotkeyTriggered = useCallback((id) => {
    if (id === '__stopAll__') { stopAllSounds(); return; }
    const sound = db.getSoundById(id);
    if (sound) togglePlaySound(sound);
  }, []);

  const togglePlaySound = useCallback(async (sound) => {
    if (playingSounds.has(sound.id)) {
      audioEngine.stopSound(sound.id, 0.1);
      setPlayingSounds(p => { const n = new Set(p); n.delete(sound.id); return n; });
      if (nowPlaying?.id === sound.id) setNowPlaying(null);
    } else {
      const ok = await audioEngine.playSound(sound, {
        volume: sound.volume ?? 1.0,
        loop: loopMode,
        fadeIn: db.settings.fadeInDuration ?? 0,
      });
      if (ok) {
        setPlayingSounds(p => new Set([...p, sound.id]));
        setNowPlaying(sound);
        await db.recordPlay(sound.id);
        if (fxState.autoDucking) audioEngine._applyDucking(true);
      }
    }
  }, [playingSounds, loopMode, fxState.autoDucking, nowPlaying]);

  const stopAllSounds = useCallback(() => {
    audioEngine.stopAllSounds(0.15);
    setPlayingSounds(new Set());
    setNowPlaying(null);
    if (fxState.autoDucking) audioEngine._applyDucking(false);
  }, [fxState.autoDucking]);

  const startMic = async (deviceId) => {
    const ok = await audioEngine.startMic(deviceId || selectedMicId);
    setMicActive(ok);
    return ok;
  };

  const stopMic = () => {
    audioEngine.stopMic();
    setMicActive(false);
  };

  const loadMicDevices = async () => {
    const devs = await audioEngine.getInputDevices();
    setMicDevices(devs);
    return devs;
  };

  const toggleMicMute = () => {
    const muted = audioEngine.toggleMicMute();
    setMicMuted(muted);
  };

  const handleAddSounds = async (filePaths) => {
    const added = await db.addSounds(filePaths);
    setSounds([...db.sounds]);
    return added;
  };

  const handleDeleteSound = async (id) => {
    if (playingSounds.has(id)) audioEngine.stopSound(id);
    await db.deleteSound(id);
    setSounds([...db.sounds]);
  };

  const handleUpdateSound = async (id, updates) => {
    await db.updateSound(id, updates);
    setSounds([...db.sounds]);
  };

  const handleToggleFavorite = async (id) => {
    await db.toggleFavorite(id);
    setSounds([...db.sounds]);
  };

  const handleSetHotkey = async (sound, accelerator) => {
    await db.setHotkey(accelerator, sound.id);
    await db.updateSound(sound.id, { hotkey: accelerator });
    setSounds([...db.sounds]);
    await registerAllHotkeys();
  };

  const handleProfileSwitch = async (profileId) => {
    setActiveProfile(profileId);
    const profile = db.getProfile(profileId);
    if (!profile) return;
    setMicVolume(Math.round(profile.micVol * 100));
    setMasterVolume(Math.round(profile.masterVol * 100));
    setFxState(f => ({ ...f, compressor: profile.compressor, noiseGate: profile.noiseGate, noiseReduction: profile.noiseReduction ?? f.noiseReduction }));
  };

  const handleEqChange = (band, value) => {
    setEqValues(prev => ({ ...prev, [band]: value }));
    audioEngine.setEQ(band, value);
  };

  const handleRecordToggle = async () => {
    if (!recording) {
      if (!micActive) await startMic();
      audioEngine.startRecording();
      setRecording(true);
    } else {
      const blob = await audioEngine.stopRecording();
      setRecording(false);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `recording-${Date.now()}.webm`; a.click();
      }
    }
  };

  const filteredSounds = db.getSounds({ category: activeCategory, search: searchQuery, favorites: activeView === 'favorites', recent: activeView === 'recent' });

  if (!loaded) return (
    <div className="splash">
      <div className="splash-logo">MicBoard<span>Pro</span></div>
      <div className="splash-loading"><div className="splash-bar"></div></div>
    </div>
  );

  return (
    <div className="app-root">
      <TitleBar onMinimize={() => window.electronAPI.minimize()} onMaximize={() => window.electronAPI.maximize()} onClose={() => window.electronAPI.close()} />
      <div className="app-body">
        <Sidebar
          activeView={activeView} onViewChange={setActiveView}
          activeProfile={activeProfile} onProfileChange={handleProfileSwitch}
          categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory}
          onOpenSettings={() => setShowSettings(true)}
        />
        <main className="app-main">
          {(activeView === 'soundboard' || activeView === 'favorites' || activeView === 'recent') && (
            <Soundboard
              sounds={filteredSounds} playingSounds={playingSounds}
              searchQuery={searchQuery} onSearchChange={setSearchQuery}
              onPlay={togglePlaySound} onStop={id => audioEngine.stopSound(id, 0.1)}
              onStopAll={stopAllSounds} onAddSounds={() => setShowAddSound(true)}
              onDelete={handleDeleteSound} onUpdate={handleUpdateSound}
              onToggleFavorite={handleToggleFavorite}
              onSetHotkey={(s) => { setHotkeyTarget(s); setShowHotkeyModal(true); }}
              onVolumeChange={(id, v) => { audioEngine.setSoundVolume(id, v); handleUpdateSound(id, { volume: v }); }}
              loopMode={loopMode} onLoopToggle={() => setLoopMode(l => !l)}
            />
          )}
          {activeView === 'mic' && (
            <MicPanel
              micActive={micActive} micMuted={micMuted} micLevel={micLevel} micLevelDb={micLevelDb}
              micVolume={micVolume} micBoost={micBoost} micDevices={micDevices}
              selectedMicId={selectedMicId} fxState={fxState} eqValues={eqValues}
              pitchSemitones={pitchSemitones} recording={recording}
              onStart={startMic} onStop={stopMic} onMute={toggleMicMute}
              onVolumeChange={setMicVolume} onBoostChange={setMicBoost}
              onDeviceChange={(id) => { setSelectedMicId(id); if (micActive) startMic(id); }}
              onLoadDevices={loadMicDevices} onFxChange={(k, v) => setFxState(f => ({ ...f, [k]: v }))}
              onEqChange={handleEqChange} onPitchChange={setPitchSemitones}
              onRecordToggle={handleRecordToggle}
            />
          )}
          {activeView === 'mixer' && (
            <MicPanel
              micActive={micActive} micMuted={micMuted} micLevel={micLevel} micLevelDb={micLevelDb}
              micVolume={micVolume} micBoost={micBoost} micDevices={micDevices}
              selectedMicId={selectedMicId} fxState={fxState} eqValues={eqValues}
              pitchSemitones={pitchSemitones} recording={recording}
              onStart={startMic} onStop={stopMic} onMute={toggleMicMute}
              onVolumeChange={setMicVolume} onBoostChange={setMicBoost}
              onDeviceChange={(id) => { setSelectedMicId(id); if (micActive) startMic(id); }}
              onLoadDevices={loadMicDevices} onFxChange={(k, v) => setFxState(f => ({ ...f, [k]: v }))}
              onEqChange={handleEqChange} onPitchChange={setPitchSemitones}
              onRecordToggle={handleRecordToggle} mixerMode
            />
          )}
        </main>
        <RightPanel
          nowPlaying={nowPlaying} playingSounds={playingSounds}
          masterVolume={masterVolume} onMasterVolumeChange={setMasterVolume}
          micVolume={micVolume} onMicVolumeChange={setMicVolume}
          micBoost={micBoost} onMicBoostChange={setMicBoost}
          micLevel={micLevel} micLevelDb={micLevelDb} outputLevel={outputLevel}
          micMuted={micMuted} onMicMute={toggleMicMute}
          fxState={fxState} onFxChange={(k, v) => setFxState(f => ({ ...f, [k]: v }))}
          virtualMicActive={virtualMicActive}
          onStopAll={stopAllSounds}
          onPlayPause={() => nowPlaying && togglePlaySound(nowPlaying)}
          queue={queue}
        />
      </div>
      <StatusBar
        micActive={micActive} virtualMicActive={virtualMicActive}
        playingCount={playingSounds.size} latency="1.2ms" sampleRate="48kHz"
        micLevel={micLevel}
      />
      {showSettings && <SettingsModal db={db} onClose={() => setShowSettings(false)} onSave={async (s) => { await db.updateSettings(s); setShowSettings(false); }} />}
      {showHotkeyModal && <HotkeyModal sound={hotkeyTarget} onSave={handleSetHotkey} onClose={() => { setShowHotkeyModal(false); setHotkeyTarget(null); }} />}
      {showAddSound && <AddSoundModal onAdd={handleAddSounds} onClose={() => setShowAddSound(false)} categories={categories} />}
    </div>
  );
}
