import { Vector3, Boid, SimulationParams } from '../types';

export class Vec3 {
  constructor(public x: number, public y: number, public z: number) {}

  static from(v: Vector3) {
    return new Vec3(v.x, v.y, v.z);
  }

  add(v: Vector3) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v: Vector3) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  mult(n: number) { this.x *= n; this.y *= n; this.z *= n; return this; }
  div(n: number) { if (n !== 0) { this.x /= n; this.y /= n; this.z /= n; } return this; }
  
  mag() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
  
  normalize() {
    const m = this.mag();
    if (m > 0) this.div(m);
    return this;
  }

  limit(max: number) {
    if (this.mag() > max) {
      this.normalize();
      this.mult(max);
    }
    return this;
  }

  distanceTo(v: Vector3) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }
  
  clone() { return new Vec3(this.x, this.y, this.z); }
}

// Helper to generate random range
export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Flocking Logic
export const updateBoid = (boid: Boid, flock: Boid[], params: SimulationParams, bounds: Vector3) => {
  const pos = Vec3.from(boid.position);
  const vel = Vec3.from(boid.velocity);
  const acc = new Vec3(0, 0, 0);

  let separation = new Vec3(0, 0, 0);
  let alignment = new Vec3(0, 0, 0);
  let cohesion = new Vec3(0, 0, 0);
  
  let separationCount = 0;
  let flockingCount = 0;

  for (let other of flock) {
    if (other.id === boid.id) continue;
    
    const otherPos = Vec3.from(other.position);
    const d = pos.distanceTo(otherPos);

    if (d > 0 && d < params.perceptionRadius) {
      // Rule 1: Separation - Avoid ALL birds regardless of group to prevent collisions
      const diff = pos.clone().sub(otherPos).normalize().div(d);
      separation.add(diff);
      separationCount++;

      // Rule 2 & 3: Alignment & Cohesion - Only interact with OWN group
      if (other.groupId === boid.groupId) {
        alignment.add(other.velocity);
        cohesion.add(otherPos);
        flockingCount++;
      }
    }
  }

  if (separationCount > 0) {
    separation.div(separationCount);
    if (separation.mag() > 0) {
      separation.normalize().mult(params.maxSpeed).sub(vel).limit(params.maxForce);
    }
  }

  if (flockingCount > 0) {
    // Average
    alignment.div(flockingCount);
    cohesion.div(flockingCount);

    // Steer Alignment
    alignment.normalize().mult(params.maxSpeed).sub(vel).limit(params.maxForce);

    // Steer Cohesion
    cohesion.sub(pos).normalize().mult(params.maxSpeed).sub(vel).limit(params.maxForce);
  }

  // Apply forces with weights
  separation.mult(params.separation);
  alignment.mult(params.alignment);
  cohesion.mult(params.cohesion);

  acc.add(separation).add(alignment).add(cohesion);

  // Physics update
  vel.add(acc).limit(params.maxSpeed);
  pos.add(vel);

  // Boundary Logic
  if (params.boundaryType === 'wrap') {
    if (pos.x > bounds.x) pos.x = -bounds.x;
    if (pos.x < -bounds.x) pos.x = bounds.x;
    if (pos.y > bounds.y) pos.y = -bounds.y;
    if (pos.y < -bounds.y) pos.y = bounds.y;
  }
  // If 'infinite', boids just keep going
  
  // Lock to 2D
  pos.z = 0;

  return {
    ...boid,
    position: pos,
    velocity: vel,
    acceleration: new Vec3(0,0,0) // Reset acc
  };
};