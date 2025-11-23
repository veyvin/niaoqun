import React from 'react';
import { SimulationParams, AIAnalysisResult, BoidGroup } from '../types';

interface ControlsProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  analysis: AIAnalysisResult | null;
}

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (val: number) => void }> = ({ label, value, min, max, step, onChange }) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <label className="text-xs text-slate-400 font-bold tracking-wider">{label}</label>
      <span className="text-xs text-cyan-400 font-mono">{value.toFixed(2)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
    />
  </div>
);

const Controls: React.FC<ControlsProps> = ({ params, setParams, onAnalyze, isAnalyzing, analysis }) => {
  
  const updateParam = (key: keyof SimulationParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const updateGroup = (id: string, updates: Partial<BoidGroup>) => {
    setParams(prev => ({
        ...prev,
        groups: prev.groups.map(g => g.id === id ? { ...g, ...updates } : g)
    }));
  };

  const addGroup = () => {
    const newId = `g${Date.now()}`;
    const colors = ['#f472b6', '#34d399', '#facc15', '#a78bfa'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    setParams(prev => ({
        ...prev,
        groups: [...prev.groups, { id: newId, name: `族群 ${prev.groups.length + 1}`, color: randomColor, count: 30 }]
    }));
  };

  const removeGroup = (id: string) => {
      setParams(prev => ({
          ...prev,
          groups: prev.groups.filter(g => g.id !== id)
      }));
  };

  return (
    <div className="absolute top-4 right-4 w-80 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-6 rounded-xl shadow-2xl z-10 text-slate-200 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
      <h1 className="text-xl font-bold mb-1 text-white bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
        AeroFlock 鸟群模拟
      </h1>
      <p className="text-xs text-slate-500 mb-6">群体智能与行为模拟</p>

      <div className="space-y-2 mb-6">
        <div className="mb-4">
           <h3 className="text-xs font-semibold text-slate-300 uppercase mb-2">边界模式 (Boundary)</h3>
           <div className="flex bg-slate-800 rounded-lg p-1">
             <button 
                onClick={() => updateParam('boundaryType', 'wrap')}
                className={`flex-1 py-1 text-xs rounded ${params.boundaryType === 'wrap' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
             >
                有界循环 (Wrap)
             </button>
             <button 
                onClick={() => updateParam('boundaryType', 'infinite')}
                className={`flex-1 py-1 text-xs rounded ${params.boundaryType === 'infinite' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
             >
                无限空间 (Infinite)
             </button>
           </div>
        </div>

        <h3 className="text-xs font-semibold text-slate-300 uppercase mb-2">全局物理参数</h3>
        <Slider label="分离力度 (Separation)" value={params.separation} min={0} max={3} step={0.1} onChange={(v) => updateParam('separation', v)} />
        <Slider label="对齐力度 (Alignment)" value={params.alignment} min={0} max={3} step={0.1} onChange={(v) => updateParam('alignment', v)} />
        <Slider label="凝聚力度 (Cohesion)" value={params.cohesion} min={0} max={3} step={0.1} onChange={(v) => updateParam('cohesion', v)} />
        <div className="h-px bg-slate-800 my-4"></div>
        <Slider label="感知范围" value={params.perceptionRadius} min={10} max={100} step={5} onChange={(v) => updateParam('perceptionRadius', v)} />
        <Slider label="最大速度" value={params.maxSpeed} min={1} max={10} step={0.5} onChange={(v) => updateParam('maxSpeed', v)} />
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
             <h3 className="text-xs font-semibold text-slate-300 uppercase">鸟群设定 (Species)</h3>
             <button onClick={addGroup} className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition-colors">+ 添加族群</button>
        </div>
        
        <div className="space-y-3">
            {params.groups.map((group, index) => (
                <div key={group.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                         <input 
                            type="color" 
                            value={group.color} 
                            onChange={(e) => updateGroup(group.id, { color: e.target.value })}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-none"
                         />
                         <input 
                            type="text"
                            value={group.name}
                            onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                            className="bg-transparent text-xs text-white border-b border-slate-600 focus:border-cyan-400 outline-none w-20 text-center"
                         />
                         <button 
                            onClick={() => removeGroup(group.id)} 
                            disabled={params.groups.length <= 1}
                            className="text-slate-500 hover:text-red-400 disabled:opacity-30"
                         >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                    </div>
                    <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>数量</span>
                            <span>{group.count}</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={200}
                            step={10}
                            value={group.count}
                            onChange={(e) => updateGroup(group.id, { count: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="border-t border-slate-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">AI 行为分析</h3>
           {process.env.API_KEY ? (
             <button
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
            >
              {isAnalyzing ? '分析中...' : '开始分析'}
            </button>
           ) : <span className="text-[10px] text-red-400">缺少 API Key</span>}
        </div>

        {analysis && (
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-300">{analysis.title}</span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-700 rounded text-slate-300">{analysis.behaviorTag}</span>
             </div>
             <p className="text-xs text-slate-400 leading-relaxed">
               {analysis.description}
             </p>
          </div>
        )}
        {!analysis && process.env.API_KEY && (
           <p className="text-[10px] text-slate-600 italic">
             点击分析按钮，让 AI 解读当前多族群鸟群的涌现行为。
           </p>
        )}
      </div>
    </div>
  );
};

export default Controls;