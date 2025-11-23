import React, { useState, useRef } from 'react';
import Scene2D from './components/Scene2D';
import Controls from './components/Controls';
import { SimulationParams, Boid, AIAnalysisResult } from './types';
import { analyzeSwarmBehavior } from './services/geminiService';

const DEFAULT_PARAMS: SimulationParams = {
  separation: 1.5,
  alignment: 1.0,
  cohesion: 1.0,
  maxSpeed: 4,
  maxForce: 0.1,
  perceptionRadius: 50,
  boundaryType: 'infinite',
  groups: [
      { id: 'g1', name: '红雀', color: '#ef4444', count: 60 },
      { id: 'g2', name: '蓝燕', color: '#3b82f6', count: 60 }
  ]
};

const App: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Ref to hold boid state across re-renders to avoid resetting simulation on UI updates
  const boidsRef = useRef<Boid[]>([]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeSwarmBehavior(params);
    if (result) {
      setAnalysis(result);
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="relative w-screen h-screen bg-slate-900 overflow-hidden">
      
      {/* Main Canvas Area */}
      <div className="absolute inset-0 z-0">
        <Scene2D params={params} boidsRef={boidsRef} />
      </div>

      {/* Interface Layer */}
      <div className="absolute top-0 left-0 p-4 pointer-events-none">
        <div className="text-slate-500 text-sm font-mono opacity-50">
          AeroFlock v1.1
          <br />
          {params.groups.reduce((acc, g) => acc + g.count, 0)} Agents
        </div>
      </div>

      <Controls 
        params={params} 
        setParams={setParams} 
        onAnalyze={handleAnalyze} 
        isAnalyzing={isAnalyzing}
        analysis={analysis}
      />

    </div>
  );
};

export default App;