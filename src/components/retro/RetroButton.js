import React from 'react';

export const RetroButton = ({ children, onClick, className, disabled, style }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        border: '2px solid #000',
        background: className?.includes('btn-default') ? '#000' : '#fff',
        color: className?.includes('btn-default') ? '#fff' : '#000',
        padding: '8px 16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        boxShadow: '2px 2px 0px #000',
        opacity: disabled ? 0.5 : 1,
        transition: 'transform 0.1s',
        fontSize: '12px',
        textTransform: 'uppercase',
        ...style
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'translate(2px, 2px)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'translate(0, 0)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(0, 0)'}
    >
      {children}
    </button>
  );
};
