
import React, { useState, useMemo } from 'react';
import { ShaderPreset, Uniform } from '../types';
import { SHADER_PRESETS } from '../shaderLibrary';

interface SidebarProps {
  activePreset: ShaderPreset;
  onSelectPreset: (preset: ShaderPreset) => void;
  uniformValues: Record<string, any>;
  onUniformChange: (key: string, value: any) => void;
}

const CATEGORIES = ['All', 'Noise', 'Fractal', 'Geometry', 'Dynamics'];

const Sidebar: React.FC<SidebarProps> = ({ 
  activePreset, 
  onSelectPreset, 
  uniformValues, 
  onUniformChange 
}) => {
  const [filter, setFilter] = useState('All');

  const filteredPresets = useMemo(() => {
    return filter === 'All' 
      ? SHADER_PRESETS 
      : SHADER_PRESETS.filter(p => p.category === filter);
  }, [filter]);

  return (
    <div className="w-80 h-screen bg-neutral-900/98 backdrop-blur-3xl border-r border-white/5 flex flex-col shadow-2xl overflow-hidden">
      <div className="p-6 flex flex-col gap-1 shrink-0 bg-neutral-950/20">
        <h1 className="text-2xl font-black bg-gradient-to-br from-white via-cyan-400 to-purple-600 bg-clip-text text-transparent tracking-tighter">
          LUMINA
        </h1>
        <p className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-bold">Advanced Shader Lab</p>
      </div>

      {/* Category Tabs */}
      <div className="px-6 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5 pb-4 shrink-0 mt-2">
        {CATEGORIES.map(cat => {
          const count = cat === 'All' 
            ? SHADER_PRESETS.length 
            : SHADER_PRESETS.filter(p => p.category === cat).length;
            
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full transition-all border whitespace-nowrap flex items-center gap-1.5 ${
                filter === cat 
                ? 'bg-white text-black border-white' 
                : 'border-white/5 text-neutral-500 hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
              <span className={`text-[8px] px-1 rounded ${filter === cat ? 'bg-black/10' : 'bg-white/5'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 scroll-smooth">
        <section>
          <h2 className="text-[11px] font-bold text-neutral-600 mb-4 uppercase tracking-widest flex justify-between">
            Gallery <span>{filteredPresets.length} items</span>
          </h2>
          <div className="flex flex-col gap-1.5">
            {filteredPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`text-left px-3 py-3 rounded-xl transition-all duration-300 border group ${
                  activePreset.id === preset.id 
                  ? 'bg-white/5 border-cyan-500/50 text-white shadow-xl shadow-cyan-500/5' 
                  : 'border-transparent text-neutral-500 hover:bg-white/5 hover:text-neutral-300'
                }`}
              >
                <div className="font-bold text-xs uppercase tracking-tight group-hover:translate-x-0.5 transition-transform">
                  {preset.name}
                </div>
                <div className="text-[9px] opacity-40 mt-1 font-medium line-clamp-2 italic leading-relaxed">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </section>

        {Object.keys(activePreset.uniforms).length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold text-neutral-600 mb-6 uppercase tracking-widest border-b border-white/5 pb-2">
              Parameters
            </h2>
            <div className="space-y-8">
              {(Object.entries(activePreset.uniforms) as [string, Uniform][]).map(([key, config]) => {
                const currentVal = uniformValues[key] ?? config.value;

                return (
                  <div key={key} className="group flex flex-col gap-3">
                    <div className="flex justify-between items-baseline">
                      <label className="text-[11px] font-bold text-neutral-400 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                        {config.label}
                      </label>
                      {config.type === 'float' && (
                        <span className="text-[10px] font-mono font-bold text-cyan-500/80 bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10">
                          {typeof currentVal === 'number' ? currentVal.toFixed(2) : currentVal}
                        </span>
                      )}
                    </div>

                    {config.type === 'float' && (
                      <div className="relative flex items-center h-4">
                        <input
                          type="range"
                          min={config.min}
                          max={config.max}
                          step={config.step}
                          value={currentVal}
                          onChange={(e) => onUniformChange(key, parseFloat(e.target.value))}
                          className="w-full accent-cyan-500 bg-neutral-800 rounded-full appearance-none h-1 cursor-pointer hover:accent-cyan-400 transition-all"
                        />
                      </div>
                    )}

                    {config.type === 'color' && (
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-7 rounded-lg overflow-hidden border border-white/10 shadow-inner group-hover:border-white/20 transition-colors">
                            <input
                            type="color"
                            value={currentVal}
                            onChange={(e) => onUniformChange(key, e.target.value)}
                            className="absolute -inset-2 w-[200%] h-[200%] cursor-pointer"
                            />
                        </div>
                        <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-tighter group-hover:text-neutral-400 transition-colors">
                          {currentVal}
                        </span>
                      </div>
                    )}

                    {config.type === 'boolean' && (
                      <button
                        onClick={() => onUniformChange(key, !currentVal)}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-300 focus:outline-none ring-1 ${
                          currentVal ? 'bg-cyan-600 ring-cyan-500/50' : 'bg-neutral-800 ring-white/10'
                        }`}
                      >
                        <span
                          className={`${
                            currentVal ? 'translate-x-5' : 'translate-x-1'
                          } inline-block h-3 w-3 transform rounded-full bg-white transition-all shadow-md`}
                        />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="p-6 border-t border-white/5 flex flex-col gap-2 opacity-40 hover:opacity-100 transition-all shrink-0 bg-neutral-950/20">
        <p className="text-[9px] text-neutral-400 font-mono text-center leading-tight uppercase tracking-[0.2em]">
          GPU ACCELERATED // v2.5.1
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
