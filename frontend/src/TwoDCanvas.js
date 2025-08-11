import React, { useRef, useEffect } from 'react';

const TwoDCanvas = ({ entities, selectedEntity, setSelectedEntity }) => {
  const canvasRef = useRef(null);
  const scale = 15; // 3D 공간 1단위당 2D 캔버스의 픽셀 수

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 캔버스 크기 조절 (부모 요소에 맞게)
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    // 캔버스 중앙을 (0,0)으로 설정하기 위한 오프셋
    const originX = canvas.width / 2;
    const originY = canvas.height / 2;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 엔터티 그리기
    entities.forEach(entity => {
      const [width, , depth] = entity.size || [5, 0.2, 2]; // y축 크기는 2D에서 무시
      const x = entity.position[0] * scale;
      const y = entity.position[2] * scale; // 3D의 z축을 2D의 y축으로 사용

      const rectX = originX + x - (width * scale) / 2;
      const rectY = originY + y - (depth * scale) / 2;
      const rectWidth = width * scale;
      const rectHeight = depth * scale;

      // 스타일 설정
      ctx.fillStyle = '#555555';
      ctx.strokeStyle = selectedEntity?.id === entity.id ? 'cyan' : '#333333';
      ctx.lineWidth = 2;

      // 사각형 그리기
      ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
      ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

      // 텍스트 그리기
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(entity.name || entity.type, originX + x, originY + y);
    });

  }, [entities, selectedEntity, scale]); // entities나 selectedEntity가 변경될 때마다 다시 그림

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const originX = canvas.width / 2;
    const originY = canvas.height / 2;

    // 클릭된 엔터티 찾기 (역순으로 찾아야 위에 있는게 먼저 선택됨)
    let clickedEntity = null;
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      const [width, , depth] = entity.size || [5, 0.2, 2];
      const x = entity.position[0] * scale;
      const y = entity.position[2] * scale;

      const rectX = originX + x - (width * scale) / 2;
      const rectY = originY + y - (depth * scale) / 2;
      const rectWidth = width * scale;
      const rectHeight = depth * scale;

      if (clickX >= rectX && clickX <= rectX + rectWidth && clickY >= rectY && clickY <= rectY + rectHeight) {
        clickedEntity = entity;
        break;
      }
    }
    setSelectedEntity(clickedEntity);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      style={{ display: 'block', width: '100%', height: '100%', backgroundColor: '#f0f0f0' }}
    />
  );
};

export default TwoDCanvas;