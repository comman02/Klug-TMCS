import React, { useRef, useEffect, useState, useCallback } from 'react';

const TwoDCanvas = ({ entities, selectedEntity, setSelectedEntity, setEntities, gridCellSize, numGridCells = 100 }) => {
  const canvasRef = useRef(null);
  const pixelsPerMeter = 50; // 1미터당 50픽셀로 가정

  const [isDraggingExisting, setIsDraggingExisting] = useState(false);
  const [draggedEntityId, setDraggedEntityId] = useState(null);
  const [dragOffset, setDragOffset] = useState([0, 0, 0]); // 드래그 시작 시 마우스와 객체 중심의 오프셋

  const [zoom, setZoom] = useState(1.0); // Initial zoom level

  const handleWheel = useCallback((event) => {
    event.preventDefault(); // Prevent page scrolling
    const scaleAmount = 1.1; // Zoom in/out factor
    let newZoom = zoom;

    if (event.deltaY < 0) { // Zoom in
      newZoom = zoom * scaleAmount;
    } else { // Zoom out
      newZoom = zoom / scaleAmount;
    }

    // Optional: Clamp zoom to reasonable limits
    newZoom = Math.max(0.1, Math.min(newZoom, 10.0)); // Example limits

    setZoom(newZoom);
  }, [zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 캔버스 크기 조절 (부모 요소에 맞게)
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    // 메인 뷰 원점 (캔버스 중앙)
    const mainViewOriginX = canvas.width / 2;
    const mainViewOriginY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 메인 뷰 격자 그리기
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 0.5;
    const step = gridCellSize * pixelsPerMeter * zoom;

    for (let x = mainViewOriginX % step; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let x = mainViewOriginX % step - step; x >= 0; x -= step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = mainViewOriginY % step; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    for (let y = mainViewOriginY % step - step; y >= 0; y -= step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 메인 뷰 엔터티 그리기
    if (entities) {
      entities.forEach(entity => {
        const [width, , depth] = entity.size || [gridCellSize, 0.2, gridCellSize];
        const x = entity.position[0] * pixelsPerMeter * zoom;
        const y = entity.position[2] * pixelsPerMeter * zoom;

        const rectX = mainViewOriginX + x - (width * pixelsPerMeter * zoom) / 2;
        const rectY = mainViewOriginY + y - (depth * pixelsPerMeter * zoom) / 2;
        const rectWidth = width * pixelsPerMeter * zoom;
        const rectHeight = depth * pixelsPerMeter * zoom;

        ctx.fillStyle = '#555555';
        ctx.strokeStyle = selectedEntity?.id === entity.id ? 'cyan' : '#333333';
        ctx.lineWidth = 2;

        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
        ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

        ctx.fillStyle = 'white';
        ctx.font = `${12 * zoom}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(entity.name || entity.type, mainViewOriginX + x, mainViewOriginY + y);
      });
    }

    // 미니맵 그리기
    const minimapWidth = 200;
    const minimapHeight = 200;
    const minimapPadding = 10;
    const minimapX = canvas.width - minimapWidth - minimapPadding;
    const minimapY = canvas.height - minimapHeight - minimapPadding;

    // 미니맵 배경
    ctx.fillStyle = 'rgba(240, 240, 240, 0.9)';
    ctx.fillRect(minimapX, minimapY, minimapWidth, minimapHeight);
    ctx.strokeStyle = '#999';
    ctx.strokeRect(minimapX, minimapY, minimapWidth, minimapHeight);

    // 미니맵 스케일 계산
    const worldWidth = numGridCells * gridCellSize;
    const worldHeight = numGridCells * gridCellSize;
    const minimapScale = Math.min(minimapWidth / worldWidth, minimapHeight / worldHeight);
    const minimapOriginX = minimapX + minimapWidth / 2;
    const minimapOriginY = minimapY + minimapHeight / 2;

    // 미니맵 엔터티 그리기
    if (entities) {
      entities.forEach(entity => {
        const [width, , depth] = entity.size || [gridCellSize, 0.2, gridCellSize];
        const x = entity.position[0] * minimapScale;
        const y = entity.position[2] * minimapScale;

        const rectX = minimapOriginX + x - (width * minimapScale) / 2;
        const rectY = minimapOriginY + y - (depth * minimapScale) / 2;
        const rectWidth = width * minimapScale;
        const rectHeight = depth * minimapScale;

        ctx.fillStyle = '#555555';
        ctx.strokeStyle = selectedEntity?.id === entity.id ? 'cyan' : '#333333';
        ctx.lineWidth = 1;
        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
        ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
      });
    }
    
    // 미니맵에 현재 뷰포트 표시
    const viewPortWidthOnMinimap = (canvas.width / (pixelsPerMeter * zoom)) * minimapScale;
    const viewPortHeightOnMinimap = (canvas.height / (pixelsPerMeter * zoom)) * minimapScale;
    
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      minimapOriginX - viewPortWidthOnMinimap / 2,
      minimapOriginY - viewPortHeightOnMinimap / 2,
      viewPortWidthOnMinimap,
      viewPortHeightOnMinimap
    );


  }, [entities, selectedEntity, gridCellSize, pixelsPerMeter, zoom, numGridCells]);

  const getEntityAtCoordinates = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const mainViewOriginX = canvas.width / 2;
    const mainViewOriginY = canvas.height / 2;

    // 클릭된 엔터티 찾기 (역순으로 찾아야 위에 있는게 먼저 선택됨)
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      const [width, , depth] = entity.size || [gridCellSize, 0.2, gridCellSize];
      
      const entityX = entity.position[0] * pixelsPerMeter * zoom;
      const entityY = entity.position[2] * pixelsPerMeter * zoom;

      const rectX = mainViewOriginX + entityX - (width * pixelsPerMeter * zoom) / 2;
      const rectY = mainViewOriginY + entityY - (depth * pixelsPerMeter * zoom) / 2;
      const rectWidth = width * pixelsPerMeter * zoom;
      const rectHeight = depth * pixelsPerMeter * zoom;

      if (clickX >= rectX && clickX <= rectX + rectWidth && clickY >= rectY && clickY <= rectY + rectHeight) {
        return entity;
      }
    }
    return null;
  }, [entities, gridCellSize, pixelsPerMeter, zoom]);

  const handleMouseDown = useCallback((event) => {
    const clickedEntity = getEntityAtCoordinates(event.clientX, event.clientY);
    if (clickedEntity) {
      setSelectedEntity(clickedEntity);
      setIsDraggingExisting(true);
      setDraggedEntityId(clickedEntity.id);

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const mainViewOriginX = canvas.width / 2;
      const mainViewOriginY = canvas.height / 2;

      const entityX = mainViewOriginX + clickedEntity.position[0] * pixelsPerMeter * zoom;
      const entityY = mainViewOriginY + clickedEntity.position[2] * pixelsPerMeter * zoom;

      setDragOffset([
        mouseX - entityX,
        0, // Y축은 0으로 고정
        mouseY - entityY,
      ]);
    } else {
      setSelectedEntity(null);
    }
  }, [getEntityAtCoordinates, setSelectedEntity, pixelsPerMeter, zoom]);

  const handleMouseMove = useCallback((event) => {
    if (!isDraggingExisting || !draggedEntityId) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const mainViewOriginX = canvas.width / 2;
    const mainViewOriginY = canvas.height / 2;

    const newPositionX = (mouseX - mainViewOriginX - dragOffset[0]) / (pixelsPerMeter * zoom);
    const newPositionY = 0; // Y축은 고정
    const newPositionZ = (mouseY - mainViewOriginY - dragOffset[2]) / (pixelsPerMeter * zoom);

    const newPosition = [newPositionX, newPositionY, newPositionZ];

    const draggedEntity = entities.find(e => e.id === draggedEntityId);
    if (!draggedEntity) return;

    const [draggedWidth, , draggedDepth] = draggedEntity.size || [gridCellSize, 0.2, gridCellSize];

    const newEntityRect = {
      x: newPosition[0] - draggedWidth / 2,
      y: newPosition[2] - draggedDepth / 2,
      width: draggedWidth,
      height: draggedDepth,
    };

    let collision = false;
    for (const existingEntity of entities) {
      if (existingEntity.id === draggedEntityId) continue;

      const [existingWidth, , existingDepth] = existingEntity.size || [gridCellSize, 0.2, gridCellSize];
      const existingEntityRect = {
        x: existingEntity.position[0] - existingWidth / 2,
        y: existingEntity.position[2] - existingDepth / 2,
        width: existingEntity.size ? existingEntity.size[0] : existingWidth,
        height: existingEntity.size ? existingEntity.size[2] : existingDepth,
      };

      if (
        newEntityRect.x < existingEntityRect.x + existingEntityRect.width &&
        newEntityRect.x + newEntityRect.width > existingEntityRect.x &&
        newEntityRect.y < existingEntityRect.y + existingEntityRect.height &&
        newEntityRect.y + newEntityRect.height > existingEntityRect.y
      ) {
        collision = true;
        break;
      }
    }

    setEntities(prev =>
      (prev || []).map(entity =>
        entity.id === draggedEntityId ? { ...entity, position: newPosition } : entity
      )
    );
    setSelectedEntity(prev => prev && prev.id === draggedEntityId ? { ...prev, position: newPosition } : prev);

  }, [isDraggingExisting, draggedEntityId, entities, dragOffset, setEntities, setSelectedEntity, gridCellSize, pixelsPerMeter, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingExisting(false);
    setDraggedEntityId(null);
    setDragOffset([0, 0, 0]);
  }, []);

  // 드래그 앤 드롭 핸들러 (새로운 오브젝트 드롭용)
  const handleDrop = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const mainViewOriginX = canvas.width / 2;
    const mainViewOriginY = canvas.height / 2;

    // 2D 캔버스 좌표를 3D 공간 좌표로 변환
    const newPosition = [
      (x - mainViewOriginX) / (pixelsPerMeter * zoom),
      0, // Y축은 0으로 고정
      (y - mainViewOriginY) / (pixelsPerMeter * zoom),
    ];

    const newEntitySize = [5, 0.5, 5];

    // 2D 충돌 감지 (간단한 AABB 충돌)
    const newEntityRect = {
      x: newPosition[0] - newEntitySize[0] / 2,
      y: newPosition[2] - newEntitySize[2] / 2,
      width: newEntitySize[0],
      height: newEntitySize[2],
    };

    let collision = false;
    for (const existingEntity of entities) {
      const existingEntityRect = {
        x: existingEntity.position[0] - (existingEntity.size ? existingEntity.size[0] : gridCellSize) / 2,
        y: existingEntity.position[2] - (existingEntity.size ? existingEntity.size[2] : gridCellSize) / 2,
        width: existingEntity.size ? existingEntity.size[0] : gridCellSize,
        height: existingEntity.size ? existingEntity.size[2] : gridCellSize,
      };

      if (
        newEntityRect.x < existingEntityRect.x + existingEntityRect.width &&
        newEntityRect.x + newEntityRect.width > existingEntityRect.x &&
        newEntityRect.y < existingEntityRect.y + existingEntityRect.height &&
        newEntityRect.y + newEntityRect.height > existingEntityRect.y
      ) {
        collision = true;
        break;
      }
    }

    if (!collision) {
      const newEntity = {
        id: `${type}-${entities.length}-${Date.now()}`,
        type,
        position: newPosition,
        size: newEntitySize,
        properties: {},
      };
      setEntities((prev) => [...prev, newEntity]);
    } else {
      console.warn("2D: 엔터티가 겹칩니다. 다른 위치에 놓아주세요.");
      // TODO: 2D에서도 시각적 피드백 제공
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // 캔버스 밖으로 마우스가 나갈 때 드래그 종료
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onWheel={handleWheel} // Add this line
      style={{ display: 'block', width: '100%', height: '100%', backgroundColor: '#f0f0f0' }}
    />
  );
};

export default TwoDCanvas;