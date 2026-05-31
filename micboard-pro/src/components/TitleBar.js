import React from 'react';

export default function TitleBar({ onMinimize, onMaximize, onClose }) {
  return (
    <div className="titlebar">
      <button className="win-btn wb-close" onClick={onClose} title="Close" />
      <button className="win-btn wb-min"   onClick={onMinimize} title="Minimize" />
      <button className="win-btn wb-max"   onClick={onMaximize} title="Maximize" />
      <div className="tb-title">MICBOARD PRO</div>
      <div className="tb-icons">
        <i className="ti ti-bell tb-icon" title="Notifications" />
        <i className="ti ti-brand-discord tb-icon" title="Discord" style={{color:'#5865f2'}} />
      </div>
    </div>
  );
}
