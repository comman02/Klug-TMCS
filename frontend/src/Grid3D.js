import React, { useMemo } from 'react';
import { LineSegments, BufferGeometry, Float32BufferAttribute, LineBasicMaterial } from 'three';

const Grid3D = ({ gridCellSize, size = 100, divisions = 100 }) => {
  const grid = useMemo(() => {
    const halfSize = size / 2;
    const step = gridCellSize; // 격자 한 칸의 실제 크기 (미터)

    const vertices = [];

    // 가로선
    for (let i = 0; i <= divisions; i++) {
      const y = -halfSize + (i * size) / divisions;
      vertices.push(-halfSize, 0, y, halfSize, 0, y);
    }

    // 세로선
    for (let i = 0; i <= divisions; i++) {
      const x = -halfSize + (i * size) / divisions;
      vertices.push(x, 0, -halfSize, x, 0, halfSize);
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));

    const material = new LineBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.5 });

    return new LineSegments(geometry, material);
  }, [gridCellSize, size, divisions]);

  return <primitive object={grid} />;
};

export default Grid3D;