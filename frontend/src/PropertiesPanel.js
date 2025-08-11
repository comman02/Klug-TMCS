import React, { useState, useEffect } from 'react';

const PropertiesPanel = ({ selectedEntity, onUpdate }) => {
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    // 선택된 엔터티가 변경되면 폼 데이터를 업데이트합니다.
    if (selectedEntity) {
      setFormData({
        name: selectedEntity.name || '',
        size: selectedEntity.size || [0, 0, 0],
        properties: selectedEntity.properties || {},
      });
    } else {
      setFormData(null);
    }
  }, [selectedEntity]);

  if (!selectedEntity || !formData) {
    return <div style={{ padding: '20px' }}>선택된 엔터티가 없습니다.</div>;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSizeChange = (e, index) => {
    const { value } = e.target;
    const newSize = [...formData.size];
    newSize[index] = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, size: newSize }));
  };

  const handlePropertyChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      properties: { ...prev.properties, [name]: value },
    }));
  };

  const handleSaveChanges = () => {
    onUpdate(selectedEntity.id, {
      name: formData.name,
      size: formData.size,
      properties: formData.properties,
    });
    alert('변경 사항이 저장되었습니다!');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>{selectedEntity.type} 속성</h3>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>ID: {selectedEntity.id}</label>
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }} htmlFor="name">이름:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>크기 (Width/Height/Depth):</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="number" value={formData.size[0]} onChange={(e) => handleSizeChange(e, 0)} style={{ width: '30%' }} />
          <input type="number" value={formData.size[1]} onChange={(e) => handleSizeChange(e, 1)} style={{ width: '30%' }} />
          <input type="number" value={formData.size[2]} onChange={(e) => handleSizeChange(e, 2)} style={{ width: '30%' }} />
        </div>
      </div>
      
      {/* 기존 속성 필드 (예: 속도) */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }} htmlFor="speed">속도:</label>
        <input
          type="number"
          id="speed"
          name="speed"
          value={formData.properties.speed || 1}
          onChange={handlePropertyChange}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <button onClick={handleSaveChanges} style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        변경 사항 저장
      </button>
    </div>
  );
};

export default PropertiesPanel;