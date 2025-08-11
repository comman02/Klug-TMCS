import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import DraggableConveyor from './DraggableConveyor';
import Conveyor3D from './Conveyor3D';
import PropertiesPanel from './PropertiesPanel';
import SceneManager from './SceneManager';
import TwoDCanvas from './TwoDCanvas'; // TwoDCanvas 임포트
import './App.css';

const App = () => {
  const [entities, setEntities] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [viewMode, setViewMode] = useState('2D'); // '2D' 또는 '3D'

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh' }}>
      <div className="toolbox" style={{ width: '200px', padding: '20px', borderRight: '1px solid #eee' }}>
        <h3>도구 상자</h3>
        <DraggableConveyor />
      </div>
      <div className="canvas-container" style={{ flex: 1 }}>
        <div style={{ marginBottom: '10px', textAlign: 'center' }}>
          <button onClick={() => setViewMode('2D')} style={{ marginRight: '10px', padding: '8px 15px', cursor: 'pointer' }}>2D View</button>
          <button onClick={() => setViewMode('3D')} style={{ padding: '8px 15px', cursor: 'pointer' }}>3D View</button>
        </div>
        {viewMode === '2D' ? (
          <TwoDCanvas entities={entities} setEntities={setEntities} setSelectedEntity={setSelectedEntity} />
        ) : (
          <Canvas>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
            <pointLight position={[-10, -10, -10]} />
            <SceneManager entities={entities} setEntities={setEntities} setSelectedEntity={setSelectedEntity} />
            <OrbitControls />
          </Canvas>
        )}
      </div>
      <div className="right-panel" style={{ width: '450px', borderLeft: '1px solid #eee', overflowY: 'auto'}}>
        <PropertiesPanel selectedEntity={selectedEntity} onUpdate={(id, updatedValues) => {
          setEntities(prev => prev.map(e => e.id === id ? { ...e, ...updatedValues } : e));
          setSelectedEntity(prev => prev && prev.id === id ? { ...prev, ...updatedValues } : prev);
        }} />
      </div>
    </div>
  );
};

export default App;
