import React from 'react';

const DraggableConveyor = () => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/reactflow', 'CONVEYOR');
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="draggable-item conveyor-item"
      draggable
      onDragStart={handleDragStart}
    >
      <svg width="100" height="40" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Conveyor Belt */}
        <rect x="0" y="10" width="100" height="20" fill="#666666"/>
        {/* Rollers */}
        <circle cx="10" cy="20" r="8" fill="#444444"/>
        <circle cx="30" cy="20" r="8" fill="#444444"/>
        <circle cx="50" cy="20" r="8" fill="#444444"/>
        <circle cx="70" cy="20" r="8" fill="#444444"/>
        <circle cx="90" cy="20" r="8" fill="#444444"/>
        {/* Belt Lines (for movement illusion) */}
        <line x1="0" y1="15" x2="100" y2="15" stroke="#555555" strokeWidth="1"/>
        <line x1="0" y1="25" x2="100" y2="25" stroke="#555555" strokeWidth="1"/>
      </svg>
      <span className="conveyor-label">컨베이어</span>
    </div>
  );
};

export default DraggableConveyor;