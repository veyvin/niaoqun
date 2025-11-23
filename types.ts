export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Boid {
  id: number;
  groupId: string;
  position: Vector3;
  velocity: Vector3;
  acceleration: Vector3;
  color: string;
}

export interface BoidGroup {
  id: string;
  name: string;
  color: string;
  count: number;
}

export interface SimulationParams {
  separation: number;
  alignment: number;
  cohesion: number;
  maxSpeed: number;
  maxForce: number;
  perceptionRadius: number;
  groups: BoidGroup[];
  boundaryType: 'wrap' | 'infinite';
}

export interface AIAnalysisResult {
  title: string;
  description: string;
  behaviorTag: string;
}