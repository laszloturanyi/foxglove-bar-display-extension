import React from 'react';

interface BarLevelIndicatorProps {
  level: number;
  color?: string;
  value?: number;
  orientation?: 'horizontal' | 'vertical';
}

const BarLevelIndicator: React.FC<BarLevelIndicatorProps> = ({ level, color = "#00ff00", value, orientation = "horizontal" }) => {
  const barContainerStyle: React.CSSProperties = {
    border: '1px solid gray',
    borderRadius: '5px',
    backgroundColor: '#3a3a3e',
    padding: '0.1rem',
    position: 'relative',
    overflow: 'hidden',
    ...(orientation === 'horizontal' ? {
      width: '100%',
      height: '100%',
      minWidth: '3.5rem',
      minHeight: '3rem',
    } : {
      width: '4rem',
      height: '100%',
      minHeight: '3.5rem',
    })
  };

  const barLevelStyle: React.CSSProperties = {
    backgroundColor: color,
    borderRadius: '2.5px',
    position: 'absolute',
    ...(orientation === 'horizontal' ? {
      left: 0,
      top: 0,
      width: `${level}%`,
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
    } : {
      left: 0,
      bottom: 0,
      height: `${level}%`,
      width: '100%',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    })
  };

  const barTextStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#fff',
    padding: "0.5rem",
    position: 'absolute',
    zIndex: 10,
    ...(orientation === 'horizontal' ? {
      left: '0.5rem',
      top: '50%',
      transform: 'translateY(-50%)',
    } : {
      top: '0.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
    })
  };

  const displayText = value !== undefined ? `${value.toFixed(2)}` : `${Math.floor(level)}`;

  return (
    <div style={barContainerStyle}>
      <div style={barLevelStyle}></div>
      <div style={barTextStyle}>{displayText}</div>
    </div>
  );
};

export default BarLevelIndicator;