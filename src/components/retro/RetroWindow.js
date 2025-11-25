import React from 'react';

export const RetroWindow = ({ title, children, style, className, onClose }) => {
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
            {onClose ? (
              <button 
                onClick={onClose}
                style={{ 
                  width: '20px', 
                  height: '20px', 
                  border: '1px solid #000', 
                  background: '#ff5f57', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  lineHeight: 1,
                  zIndex: 1000,
                  position: 'relative'
                }}
              >
                ×
              </button>
            ) : (
              <div style={{ width: '12px', height: '12px', border: '1px solid #000', background: '#fff' }}></div>
            )}
        </div>
      </div>
      <div style={{ padding: '0', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};
