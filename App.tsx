
import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import Sidebar from './components/Sidebar';
import ShaderCanvas from './components/ShaderCanvas';
import ExportModal from './components/ExportModal';
import { SHADER_PRESETS } from './shaderLibrary';
import { ShaderPreset, Uniform } from './types';

const App: React.FC = () => {
  const [activePreset, setActivePreset] = useState<ShaderPreset>(SHADER_PRESETS[0]);
  const [uniformValues, setUniformValues] = useState<Record<string, any>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Initialize uniforms when preset changes
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    (Object.entries(activePreset.uniforms) as [string, Uniform][]).forEach(([key, config]) => {
      initialValues[key] = config.value;
    });
    setUniformValues(initialValues);
  }, [activePreset]);

  const handleUniformChange = (key: string, value: any) => {
    setUniformValues(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex w-screen h-screen bg-black text-white selection:bg-cyan-500/30">
      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        preset={activePreset} 
        uniformValues={uniformValues} 
      />

      {/* Control Panel */}
      <div className={`transition-all duration-300 ease-in-out z-[60] ${isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'}`}>
        <Sidebar 
          activePreset={activePreset}
          onSelectPreset={setActivePreset}
          uniformValues={uniformValues}
          onUniformChange={handleUniformChange}
          onExport={() => setIsExportOpen(true)}
        />
      </div>

      {/* Toggle Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-6 left-6 z-[70] p-2 rounded-full bg-neutral-900/50 backdrop-blur border border-white/10 hover:bg-neutral-800 transition-colors shadow-2xl"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isSidebarOpen ? <path d="m15 18-6-6 6-6"/> : <path d="m9 18 6-6-6-6"/>}
        </svg>
      </button>

      {/* Visual Canvas Area */}
      <main className="flex-1 relative cursor-crosshair">
        <Canvas camera={{ position: [0, 0, 1] }} gl={{ antialias: true, alpha: false }}>
          <ShaderCanvas 
            preset={activePreset} 
            uniformValues={uniformValues} 
          />
        </Canvas>

        {/* HUD Info */}
        <div className="absolute bottom-6 right-6 text-right pointer-events-none">
          <h2 className="text-xl font-light tracking-widest text-white/90 uppercase">{activePreset.name}</h2>
          <p className="text-xs text-white/40 max-w-xs ml-auto mt-2 italic font-mono uppercase tracking-tighter">
            {activePreset.description}
          </p>
        </div>

        {/* Categories Badges */}
        <div className="absolute top-6 right-6 flex gap-2 pointer-events-none">
          {['Noise', 'Fractal', 'Geometry', 'Dynamics'].map(cat => (
            <span 
              key={cat}
              className={`text-[10px] px-2 py-0.5 rounded border transition-opacity ${
                activePreset.category === cat 
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 opacity-100' 
                : 'border-white/5 text-white/20 opacity-40'
              }`}
            >
              {cat}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
