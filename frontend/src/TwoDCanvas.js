import React, { useRef, useEffect, useState, useCallback } from 'react';

const TwoDCanvas = ({ entities, selectedEntity, setSelectedEntity, setEntities, gridCellSize, numGridCells = 100 }) => {
  const canvasRef = useRef(null);
  const pixelsPerMeter = 50; // 1미터당 50픽셀로 가정

  // 미니맵을 위한 새로운 상수
  const minimapWidth = 200;
  const minimapHeight = 200;
  const minimapPadding = 20; // 상단 및 왼쪽으로부터의 패딩
  // Calculate minimapPixelsPerMeter based on desired world size (numGridCells)
  const minimapWorldSize = numGridCells * gridCellSize; // Total world size covered by minimap
  const minimapPixelsPerMeter = minimapWidth / minimapWorldSize; // Pixels per meter for minimap

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

    // 미니맵을 위한 원점 조정
    const originX = minimapPadding + minimapWidth / 2;
    const originY = minimapPadding + minimapHeight / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 격자 그리기 (전체 캔버스에 그려짐)
    ctx.strokeStyle = '#cccccc'; // 격자선 색상
    ctx.lineWidth = 0.5; // 격자선 두께

    const step = gridCellSize * pixelsPerMeter; // 격자 한 칸의 픽셀 크기 (메인 뷰 스케일 사용)

    // 세로선 그리기
    for (let x = originX % step; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let x = originX % step - step; x >= 0; x -= step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // 가로선 그리기
    for (let y = originY % step; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    for (let y = originY % step - step; y >= 0; y -= step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 엔터티 그리기
    if (entities) { // Add null check here
      console.log("TwoDCanvas: Entities received:", entities);
      entities.forEach(entity => {
        console.log(`Entity ID: ${entity.id}, Type: ${entity.type}, Position: [${entity.position[0]}, ${entity.position[1]}, ${entity.position[2]}]`);
        const [width, , depth] = entity.size || [gridCellSize, 0.2, gridCellSize];
        // Apply zoom to minimap scale
        const scaledMinimapPixelsPerMeter = minimapPixelsPerMeter * zoom;
        const x = entity.position[0] * scaledMinimapPixelsPerMeter; // 미니맵 스케일 사용
        const y = entity.position[2] * scaledMinimapPixelsPerMeter; // 미니맵 스케일 사용

        const rectX = originX + x - (width * scaledMinimapPixelsPerMeter) / 2;
        const rectY = originY + y - (depth * scaledMinimapPixelsPerMeter) / 2;
        const rectWidth = width * scaledMinimapPixelsPerMeter;
        const rectHeight = depth * scaledMinimapPixelsPerMeter;

        ctx.fillStyle = '#555555';
        ctx.strokeStyle = selectedEntity?.id === entity.id ? 'cyan' : '#333333';
        ctx.lineWidth = 2;

        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
        ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

        ctx.fillStyle = 'white';
        ctx.font = '12px Arial'; // Font size might need to scale too
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(entity.name || entity.type, originX + x, originY + y);
      });
    }

  }, [entities, selectedEntity, gridCellSize, pixelsPerMeter, zoom]);

  const getEntityAtCoordinates = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    // Use minimap origin for interaction
    const originX = minimapPadding + minimapWidth / 2;
    const originY = minimapPadding + minimapHeight / 2;

    // 클릭된 엔터티 찾기 (역순으로 찾아야 위에 있는게 먼저 선택됨)
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      const [width, , depth] = entity.size || [gridCellSize, 0.2, gridCellSize];
      // Use minimap scale for entity position
      const x = entity.position[0] * minimapPixelsPerMeter;
      const y = entity.position[2] * minimapPixelsPerMeter;

      // Use minimap scale for rectangle dimensions
      const rectX = originX + x - (width * minimapPixelsPerMeter) / 2;
      const rectY = originY + y - (depth * minimapPixelsPerMeter) / 2;
      const rectWidth = width * minimapPixelsPerMeter;
      const rectHeight = depth * minimapPixelsPerMeter;

      if (clickX >= rectX && clickX <= rectX + rectWidth && clickY >= rectY && clickY <= rectY + rectHeight) {
        return entity;
      }
    }
    return null;
  }, [entities, gridCellSize, minimapPixelsPerMeter, minimapPadding, minimapWidth, minimapHeight]);

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

      // Use minimap origin for interaction
      const originX = minimapPadding + minimapWidth / 2;
      const originY = minimapPadding + minimapHeight / 2;

      // Use minimap scale for entity position
      const entityX = originX + clickedEntity.position[0] * minimapPixelsPerMeter;
      const entityY = originY + clickedEntity.position[2] * minimapPixelsPerMeter;

      setDragOffset([
        mouseX - entityX,
        0, // Y축은 0으로 고정
        mouseY - entityY,
      ]);
    } else {
      setSelectedEntity(null);
    }
  }, [getEntityAtCoordinates, setSelectedEntity, minimapPixelsPerMeter, minimapPadding, minimapWidth, minimapHeight]);

  const handleMouseMove = useCallback((event) => {
    if (!isDraggingExisting || !draggedEntityId) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Use minimap origin for interaction
    const originX = minimapPadding + minimapWidth / 2;
    const originY = minimapPadding + minimapHeight / 2;

    // Use minimap scale for new position calculation
    const newPositionX = (mouseX - originX - dragOffset[0]) / minimapPixelsPerMeter;
    const newPositionY = 0; // Y축은 고정
    const newPositionZ = (mouseY - originY - dragOffset[2]) / minimapPixelsPerMeter;

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

    // 충돌 여부에 따라 상태 업데이트 (2D에서는 시각적 피드백은 아직 없음)
    // TODO: 2D에서도 시각적 피드백 제공

    setEntities(prev =>
      (prev || []).map(entity =>
        entity.id === draggedEntityId ? { ...entity, position: newPosition } : entity
      )
    );
    setSelectedEntity(prev => prev && prev.id === draggedEntityId ? { ...prev, position: newPosition } : prev);

  }, [isDraggingExisting, draggedEntityId, entities, dragOffset, setEntities, setSelectedEntity, gridCellSize, minimapPixelsPerMeter, minimapPadding, minimapWidth, minimapHeight]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingExisting(false);
    setDraggedEntityId(null);
    setDragOffset([0, 0, 0]);
  }, []);

  // 드래그 앤 드롭 핸들러 (새로운 오브젝트 드롭용)
  const handleDrop = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return; // 데이터가 없으면 처리하지 않음

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Use minimap origin for interaction
    const originX = minimapPadding + minimapWidth / 2;
    const originY = minimapPadding + minimapHeight / 2;

    // 2D 캔버스 좌표를 3D 공간 좌표로 변환
    const newPosition = [
      (x - originX) / minimapPixelsPerMeter,
      0, // Y축은 0으로 고정
      (y - originY) / minimapPixelsPerMeter,
    ];

    const newEntitySize = [gridCellSize, 0.2, gridCellSize]; // 격자 크기에 맞춤

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