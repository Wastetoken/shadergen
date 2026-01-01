
import React from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: any;
  uniformValues: any;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, preset, uniformValues }) => {
  if (!isOpen) return null;

  const generateCode = () => {
    const uniformDefs = Object.entries(preset.uniforms)
      .map(([key, config]: [string, any]) => {
        let val = uniformValues[key] ?? config.value;
        if (config.type === 'color') val = `new THREE.Color('${val}')`;
        else if (config.type === 'vec2') val = `new THREE.Vector2(${val[0]}, ${val[1]})`;
        return `      ${key}: { value: ${val} },`;
      })
      .join('\n');

    return `
import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const ShaderComponent = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = state.clock.getElapsedTime();
      mat.uniforms.uResolution.value.set(size.width, size.height);
    }
  });

  const vertexShader = \`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  \`;

  const fragmentShader = \`${preset.fragmentShader.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(size.width, size.height) },
${uniformDefs}
        }}
      />
    </mesh>
  );
};

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas camera={{ position: [0, 0, 1] }}>
        <ShaderComponent />
      </Canvas>
    </div>
  );
}
    `.trim();
  };

  const code = generateCode();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/90">Export Shader Component</h3>
            <p className="text-[10px] text-white/40 uppercase mt-0.5 font-mono">React + @react-three/fiber + THREE.js</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-black/40 font-mono text-[11px] leading-relaxed text-cyan-50/80 selection:bg-cyan-500/40">
          <pre className="whitespace-pre-wrap">{code}</pre>
        </div>

        <div className="p-4 border-t border-white/5 flex justify-end gap-3 bg-white/5">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(code);
              alert('Code copied to clipboard!');
            }}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full text-xs font-bold uppercase transition-all shadow-lg shadow-cyan-600/20 active:scale-95"
          >
            Copy Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
