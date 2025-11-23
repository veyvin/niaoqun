import React, { useRef, useEffect } from 'react';
import { Boid, SimulationParams } from '../types';
import { updateBoid, randomRange } from '../utils/math';

interface Scene2DProps {
  params: SimulationParams;
  boidsRef: React.MutableRefObject<Boid[]>;
}

const lerp = (start: number, end: number, t: number) => {
  return start * (1 - t) + end * t;
};

const Scene2D: React.FC<Scene2DProps> = ({ params, boidsRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Refs to handle interpolation without re-triggering the animation loop
  const targetParamsRef = useRef<SimulationParams>(params);
  const currentParamsRef = useRef<SimulationParams>({ ...params });

  // Viewport Transform State: x, y (translation), k (scale)
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const initializedRef = useRef(false);

  // Update target params whenever props change
  useEffect(() => {
    targetParamsRef.current = params;
  }, [params]);

  // Manage Boid Population/Groups
  useEffect(() => {
    if (!canvasRef.current) return;
    const { width, height } = canvasRef.current.getBoundingClientRect();

    const createBoids = (w: number, h: number, groups: typeof params.groups) => {
        const newBoids: Boid[] = [];
        let idCounter = 0;
        groups.forEach(group => {
            for (let i = 0; i < group.count; i++) {
                newBoids.push({
                    id: idCounter++,
                    groupId: group.id,
                    position: { x: randomRange(-w/2, w/2), y: randomRange(-h/2, h/2), z: 0 },
                    velocity: { x: randomRange(-1, 1), y: randomRange(-1, 1), z: 0 },
                    acceleration: { x: 0, y: 0, z: 0 },
                    color: group.color
                });
            }
        });
        return newBoids;
    };

    // Calculate total expected
    const expectedCount = params.groups.reduce((sum, g) => sum + g.count, 0);
    
    let needsReset = boidsRef.current.length !== expectedCount;
    
    if (!needsReset) {
        // Check if colors updated
        const groupColorMap = new Map(params.groups.map(g => [g.id, g.color]));
        for (let b of boidsRef.current) {
             const targetColor = groupColorMap.get(b.groupId);
             if (targetColor && b.color !== targetColor) {
                 b.color = targetColor; 
             }
        }
    }

    if (needsReset) {
       boidsRef.current = createBoids(width, height, params.groups);
    }
  }, [params.groups, boidsRef]);

  // Event Listeners for Pan/Zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const zoomIntensity = 0.001;
        const delta = -e.deltaY * zoomIntensity;
        const newScale = Math.min(Math.max(0.05, transformRef.current.k + delta), 5);
        
        const k = transformRef.current.k;
        // Zoom towards mouse pointer
        // 1. Get mouse position in world space before zoom
        const worldX = (e.clientX - transformRef.current.x) / k;
        const worldY = (e.clientY - transformRef.current.y) / k;

        // 2. Update scale
        transformRef.current.k = newScale;

        // 3. Adjust translation to keep world point under mouse
        transformRef.current.x = e.clientX - worldX * newScale;
        transformRef.current.y = e.clientY - worldY * newScale;
    };

    const onMouseDown = (e: MouseEvent) => {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        transformRef.current.x += dx;
        transformRef.current.y += dy;
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
        isDragging.current = false;
        canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
        canvas.removeEventListener('wheel', onWheel);
        canvas.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Main Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bounds = { x: canvas.width / 2, y: canvas.height / 2, z: 0 };

    // Handle Resize
    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        bounds = { x: canvas.width / 2, y: canvas.height / 2, z: 0 };
        
        // Center view on initial load
        if (!initializedRef.current) {
            transformRef.current.x = canvas.width / 2;
            transformRef.current.y = canvas.height / 2;
            initializedRef.current = true;
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number, scale: number) => {
        const step = 100;
        const opacity = Math.min(0.15, Math.max(0.02, 0.1 * scale)); // Fade grid based on zoom
        
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 1 / scale; // Keep line width constant on screen

        // Calculate visible grid range based on viewport to optimize rendering
        // Using fixed large range for simplicity in this demo context
        const range = Math.max(w, h) * 10 / scale + 5000; 
        
        // Use translation to snap grid lines
        const offsetX = transformRef.current.x % (step * scale);
        const offsetY = transformRef.current.y % (step * scale);

        for (let x = -range; x <= range; x += step) {
            ctx.moveTo(x, -range);
            ctx.lineTo(x, range);
        }
        for (let y = -range; y <= range; y += step) {
            ctx.moveTo(-range, y);
            ctx.lineTo(range, y);
        }
        ctx.stroke();
    };

    const animate = () => {
      if (!ctx) return;
      
      // Interpolation Logic
      const t = 0.1; // Smoothing factor
      const target = targetParamsRef.current;
      const current = currentParamsRef.current;

      current.separation = lerp(current.separation, target.separation, t);
      current.alignment = lerp(current.alignment, target.alignment, t);
      current.cohesion = lerp(current.cohesion, target.cohesion, t);
      current.maxSpeed = lerp(current.maxSpeed, target.maxSpeed, t);
      current.perceptionRadius = lerp(current.perceptionRadius, target.perceptionRadius, t);
      current.maxForce = lerp(current.maxForce, target.maxForce, t);
      current.groups = target.groups;
      current.boundaryType = target.boundaryType; // discrete switch, no lerp

      // Clear Screen
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply Pan/Zoom Transform
      const { x, y, k } = transformRef.current;
      ctx.setTransform(k, 0, 0, k, x, y);

      // Draw Grid
      drawGrid(ctx, bounds.x, bounds.y, k);

      // Draw Boundary or Center Marker
      if (current.boundaryType === 'wrap') {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)'; // Cyan border
        ctx.lineWidth = 2 / k;
        ctx.setLineDash([10 / k, 10 / k]);
        ctx.strokeRect(-bounds.x, -bounds.y, bounds.x * 2, bounds.y * 2);
        ctx.setLineDash([]);
      } else {
        // Infinite mode: Draw origin marker
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1 / k;
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(20, 0);
        ctx.moveTo(0, -20);
        ctx.lineTo(0, 20);
        ctx.stroke();
      }

      const currentBoids = boidsRef.current;
      
      // Update Physics & Draw
      for (let i = 0; i < currentBoids.length; i++) {
        // Physics Update using interpolated params
        currentBoids[i] = updateBoid(currentBoids[i], currentBoids, current, bounds);
        
        // Draw
        const b = currentBoids[i];
        const angle = Math.atan2(b.velocity.y, b.velocity.x);

        ctx.save();
        ctx.translate(b.position.x, b.position.y);
        ctx.rotate(angle);
        
        ctx.beginPath();
        // Scale bird size slightly by zoom, but not fully, to keep them visible
        // Actually, standard zoom scales everything.
        ctx.moveTo(6, 0);
        ctx.lineTo(-4, 3);
        ctx.lineTo(-4, -3);
        ctx.closePath();
        
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.restore();
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, []); 

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full block cursor-grab active:cursor-grabbing"
    />
  );
};

export default Scene2D;