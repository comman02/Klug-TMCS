import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3, Box3, Plane } from 'three';
import Conveyor3D from './Conveyor3D';
import { GizmoHelper, GizmoViewport } from '@react-three/drei';

// Y=0 평면을 나타내는 Plane 객체를 컴포넌트 외부에서 한 번만 생성
const groundPlane = new Plane(new Vector3(0, 1, 0), 0); // 법선 (0,1,0), 원점으로부터의 거리 0

const SceneManager = ({ entities, setEntities, setSelectedEntity }) => {
  const { scene, camera, raycaster, mouse, gl, viewport } = useThree();
  const [isDraggingExisting, setIsDraggingExisting] = useState(false);
  const [draggedEntityId, setDraggedEntityId] = useState(null);
  const [collidingEntityId, setCollidingEntityId] = useState(null); // 충돌 상태 관리
  const [dragOffset, setDragOffset] = useState([0, 0, 0]); // 드래그 시작 시 마우스와 객체 중심의 오프셋

  const defaultConveyorSize = useMemo(() => {
    return [10, 0.2, 10];
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');

    if (!raycaster || !mouse || !camera || !gl.domElement) {
      console.error("useThree hooks not fully initialized.");
      return;
    }

    mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (!raycaster.ray) {
      console.error("Raycaster ray is not initialized.");
      return;
    }

    const intersectionPoint = new Vector3();
    const intersects = raycaster.ray.intersectPlane(groundPlane, intersectionPoint);

    if (intersects) {
      const newPosition = [intersectionPoint.x, 0, intersectionPoint.z];
      const newEntitySize = defaultConveyorSize; // 새 엔터티에 기본 크기 적용

      const newEntityBox = new Box3().setFromCenterAndSize(
        new Vector3(...newPosition),
        new Vector3(...newEntitySize) // 동적 크기 사용
      );

      let collision = false;
      for (const existingEntity of entities) {
        const existingEntityBox = new Box3().setFromCenterAndSize(
          new Vector3(...existingEntity.position),
          new Vector3(...(existingEntity.size || defaultConveyorSize)) // 기존 엔터티의 크기 사용
        );
        if (newEntityBox.intersectsBox(existingEntityBox)) {
          collision = true;
          break;
        }
      }

      if (!collision) {
        const newEntity = {
          id: `${type}-${entities.length}-${Date.now()}`,
          type,
          position: newPosition,
          size: newEntitySize, // size 속성 추가
          properties: {},
        };
        setEntities((prev) => [...prev, newEntity]);
      } else {
        console.warn("엔터티가 겹칩니다. 다른 위치에 놓아주세요.");
      }
    }
  }, [entities, setEntities, raycaster, mouse, camera, gl.domElement, defaultConveyorSize]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handlePointerMove = useCallback((event) => {
    if (!isDraggingExisting || !draggedEntityId) return;

    const draggedEntity = entities.find(e => e.id === draggedEntityId);
    if (!draggedEntity) return;

    mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (!raycaster.ray) return;

    const intersectionPoint = new Vector3();
    const intersects = raycaster.ray.intersectPlane(groundPlane, intersectionPoint);

    if (intersects) {
      const newPosition = [intersectionPoint.x - dragOffset[0], 0, intersectionPoint.z - dragOffset[2]];
      const draggedEntitySize = draggedEntity.size || defaultConveyorSize;

      const newEntityBox = new Box3().setFromCenterAndSize(
        new Vector3(...newPosition),
        new Vector3(...draggedEntitySize) // 드래그하는 엔터티의 크기 사용
      );

      let collision = false;
      for (const existingEntity of entities) {
        if (existingEntity.id === draggedEntityId) continue;

        const existingEntityBox = new Box3().setFromCenterAndSize(
          new Vector3(...existingEntity.position),
          new Vector3(...(existingEntity.size || defaultConveyorSize)) // 기존 엔터티의 크기 사용
        );
        if (newEntityBox.intersectsBox(existingEntityBox)) {
          collision = true;
          break;
        }
      }
      
      if (collision) {
        setCollidingEntityId(draggedEntityId);
      } else {
        setCollidingEntityId(null);
      }

      setEntities(prev =>
        (prev || []).map(entity =>
          entity.id === draggedEntityId ? { ...entity, position: newPosition } : entity
        )
      );
      setSelectedEntity(prev => prev && prev.id === draggedEntityId ? { ...prev, position: newPosition } : prev);
    }
  }, [isDraggingExisting, draggedEntityId, entities, setEntities, setSelectedEntity, raycaster, mouse, camera, gl.domElement, dragOffset, defaultConveyorSize]);

  const handlePointerUp = useCallback(() => {
    if (collidingEntityId) {
        console.warn("충돌 위치에는 놓을 수 없습니다.");
    }
    setIsDraggingExisting(false);
    setDraggedEntityId(null);
    setCollidingEntityId(null);
    setDragOffset([0, 0, 0]);
  }, [collidingEntityId]);

  const handleConveyorDragStart = useCallback((id, initialPosition, event) => {
    setIsDraggingExisting(true);
    setDraggedEntityId(id);

    mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersectionPoint = new Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersectionPoint);

    if (intersectionPoint) {
      setDragOffset([
        intersectionPoint.x - initialPosition[0],
        0,
        intersectionPoint.z - initialPosition[2],
      ]);
    }

    setSelectedEntity(entities.find(e => e.id === id));
  }, [entities, setSelectedEntity, raycaster, mouse, camera, gl.domElement]);

  useEffect(() => {
    const canvas = gl.domElement;
    if (canvas) {
      canvas.addEventListener('drop', handleDrop);
      canvas.addEventListener('dragover', handleDragOver);
      canvas.addEventListener('pointermove', handlePointerMove);
      canvas.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener('drop', handleDrop);
        canvas.removeEventListener('dragover', handleDragOver);
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerup', handlePointerUp);
      }
    };
  }, [gl.domElement, handleDrop, handleDragOver, handlePointerMove, handlePointerUp]);

  return (
    <>
      {(entities || []).map((entity) => {
        if (entity.type === 'CONVEYOR') {
          return (
            <Conveyor3D
              key={entity.id}
              position={entity.position}
              properties={entity.properties}
              size={entity.size || defaultConveyorSize} // size prop 전달
              isColliding={collidingEntityId === entity.id}
              onClick={() => setSelectedEntity(entity)}
              onPointerDown={(event) => handleConveyorDragStart(entity.id, entity.position, event)}
            />
          );
        }
        return null;
      })}
      <GizmoHelper
        alignment="top-left"
        margin={[80, 80]}
      >
        <GizmoViewport axisColors={['red', 'green', 'blue']} labelColor="black" />
      </GizmoHelper>
    </>
  );
};

export default SceneManager;
