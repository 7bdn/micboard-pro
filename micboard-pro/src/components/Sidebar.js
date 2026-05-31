import React from 'react';

const VIEWS = [
  { id: 'soundboard', icon: 'ti-layout-grid', label: 'Soundboard' },
  { id: 'mic',        icon: 'ti-microphone',  label: 'Microphone' },
  { id: 'mixer',      icon: 'ti-adjustments-horizontal', label: 'Mixer' },
  { id: 'favorites',  icon: 'ti-star',        label: 'Favorites' },
  { id: 'recent',     icon: 'ti-clock',       label: 'Recent' },
  { id: 'hotkeys',    icon: 'ti-keyboard',    label: 'Hotkeys' },
];

const PROFILES = [
  { id: 'gaming',    label: 'GAME' },
  { id: 'streaming', label: 'STRM' },
  { id: 'discord',   label: 'DISC' },
];

export default function Sidebar({ activeView, onViewChange, activeProfile, onProfileChange, categories, activeCategory, onCategoryChange, onOpenSettings }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-name">Mic<span>Board</span></div>
        <div className="logo-sub">Pro Edition</div>
      </div>

      <div className="sidebar-nav">
        <div className="nav-section">Navigation</div>
        {VIEWS.map(v => (
          <div key={v.id} className={`nav-item${activeView === v.id ? ' active' : ''}`} onClick={() => onViewChange(v.id)}>
            <i className={`ti ${v.icon}`} />
            {v.label}
          </div>
        ))}

        <div className="nav-section">Categories</div>
        {(categories || []).map(c => (
          <div key={c.id} className={`nav-item${activeCategory === c.id ? ' active' : ''}`} onClick={() => { onViewChange('soundboard'); onCategoryChange(c.id); }}>
            <i className={`ti ti-${c.icon}`} style={{ color: activeCategory === c.id ? c.color : undefined }} />
            {c.name}
          </div>
        ))}

        <div className="nav-section">System</div>
        <div className={`nav-item${activeView === 'settings' ? ' active' : ''}`} onClick={onOpenSettings}>
          <i className="ti ti-settings" /> Settings
        </div>
      </div>

      <div className="sidebar-profiles">
        <div className="profile-label">Profile</div>
        <div className="profile-tabs">
          {PROFILES.map(p => (
            <div key={p.id} className={`ptab${activeProfile === p.id ? ' active' : ''}`} onClick={() => onProfileChange(p.id)}>
              {p.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
