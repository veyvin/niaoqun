import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Boid, SimulationParams } from '../types';
import { updateBoid, randomRange } from '../utils/math';

interface Scene3DProps {
  params: SimulationParams;
  boidsRef: React.MutableRefObject<Boid[]>;
}

const BoidSwarm: React.FC<{ params: SimulationParams; boidsRef: React.MutableRefObject<Boid[]> }> = ({ params, boidsRef }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  
  // Bounds for 3D space
  const bounds = { x: 50, y: 50, z: 50 };

  const totalBoids = useMemo(() => params.groups.reduce((sum, g) => sum + g.count, 0), [params.groups]);

  // Sync boids array with groups config
  useEffect(() => {
     const currentCount = boidsRef.current.length;
     
     // If counts mismatch, completely regenerate to ensure clean group distribution
     // In a production app, we might optimize to only add/remove necessary ones
     if (currentCount !== totalBoids) {
         const newBoids: Boid[] = [];
         let idCounter = 0;
         params.groups.forEach(group => {
            for (let i = 0; i < group.count; i++) {
                newBoids.push({
                    id: idCounter++,
                    groupId: group.id,
                    position: { x: randomRange(-bounds.x, bounds.x), y: randomRange(-bounds.y, bounds.y), z: randomRange(-bounds.z, bounds.z) },
                    velocity: { x: randomRange(-1, 1), y: randomRange(-1, 1), z: randomRange(-1, 1) },
                    acceleration: { x: 0, y: 0, z: 0 },
                    color: group.color
                });
            }
         });
         boidsRef.current = newBoids;
     } else {
         // Update colors if groups changed but count remained same (edge case, but good for UX)
         const groupColorMap = new Map(params.groups.map(g => [g.id, g.color]));
         boidsRef.current.forEach(b => {
             const c = groupColorMap.get(b.groupId);
             if (c) b.color = c;
         });
     }
  }, [params.groups, totalBoids, boidsRef]);


  useFrame(() => {
    if (!meshRef.current) return;

    const boids = boidsRef.current;
    
    // Only render what we have
    const count = Math.min(boids.length, totalBoids);
    
    for (let i = 0; i < count; i++) {
        // Physics
        boids[i] = updateBoid(boids[i], boids, params, bounds);
        const b = boids[i];

        // Update Instance Position/Rotation
        dummy.position.set(b.position.x, b.position.y, b.position.z);
        
        const velocityVec = new THREE.Vector3(b.velocity.x, b.velocity.y, b.velocity.z);
        const target = new THREE.Vector3().copy(dummy.position).add(velocityVec);
        dummy.lookAt(target);
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        
        // Update Instance Color
        color.set(b.color);
        meshRef.current.setColorAt(i, color);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, totalBoids]}>
      <coneGeometry args={[0.5, 2, 8]} />
      <meshStandardMaterial roughness={0.4} metalness={0.6} />
    </instancedMesh>
  );
};

const Scene3D: React.FC<Scene3DProps> = ({ params, boidsRef }) => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 100], fov: 60 }}>
        <color attach="background" args={['#0f172a']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <BoidSwarm params={params} boidsRef={boidsRef} />
        <OrbitControls autoRotate={false} autoRotateSpeed={0.5} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

export default Scene3D;