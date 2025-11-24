import React from 'react';

export const RetroWindow = ({ title, children, style, className }) => {
  return (
    <div className={className} style={{
      border: '2px solid #000',
      boxShadow: '4px 4px 0px #000',
      backgroundColor: '#fff',
      fontFamily: 'monospace',
      ...style
    }}>
      <div style={{
        borderBottom: '2px solid #000',
        padding: '8px',
        background: '#eee',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px'
      }}>
        <span>{title}</span>
        <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', border: '1px solid #000', background: '#fff' }}></div>
        </div>
      </div>
      <div style={{ padding: '0' }}>
        {children}
      </div>
    </div>
  );
};
