import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder } from '@react-three/drei';

const Conveyor3D = ({ position, properties, size, onClick, onPointerDown, isColliding }) => {
  const beltRef = useRef();
  const [isHovered, setIsHovered] = useState(false);

  const [width, height, depth] = size;

  // 벨트 움직임 애니메이션
  useFrame((state, delta) => {
    if (beltRef.current && beltRef.current.material && beltRef.current.material.map) {
      // 간단한 벨트 움직임 시뮬레이션
      beltRef.current.material.map.offset.x -= 0.5 * delta; // 속도 조절
    }
  });

  const beltColor = isColliding ? 'red' : isHovered ? 'hotpink' : '#555555';

  return (
    <group position={position} onClick={onClick} onPointerOver={() => setIsHovered(true)} onPointerOut={() => setIsHovered(false)} onPointerDown={onPointerDown}>
      {/* 컨베이어 벨트 */}
      <Box args={[width, height * 0.5, depth * 0.75]} position={[0, height * 0.25, 0]}>
        <meshStandardMaterial color={beltColor} ref={beltRef} />
      </Box>

      {/* 컨베이어 프레임 (지지대) */}
      <Box args={[width + 0.2, height, depth * 0.1]} position={[0, 0, (depth * 0.75) / 2 + (depth * 0.1) / 2]}>
        <meshStandardMaterial color="#333333" />
      </Box>
      <Box args={[width + 0.2, height, depth * 0.1]} position={[0, 0, -((depth * 0.75) / 2 + (depth * 0.1) / 2)]}>
        <meshStandardMaterial color="#333333" />
      </Box>

      {/* 롤러 */}
      {[...Array(Math.floor(width))].map((_, i) => (
        <Cylinder key={i} args={[height * 0.75, height * 0.75, depth * 0.75, 16]} rotation={[Math.PI / 2, 0, 0]} position={[i - width / 2 + 0.5, -height * 0.25, 0]}>
          <meshStandardMaterial color="#888888" />
        </Cylinder>
      ))}
    </group>
  );
};

export default Conveyor3D;