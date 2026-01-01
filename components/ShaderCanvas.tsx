
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ShaderPreset, Uniform } from '../types';

interface ShaderCanvasProps {
  preset: ShaderPreset;
  uniformValues: Record<string, any>;
}

const ShaderCanvas: React.FC<ShaderCanvasProps> = ({ preset, uniformValues }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  // Initialize uniforms only when the PRESET changes.
  // We do NOT include uniformValues in the dependency array to prevent material recreation.
  const uniforms = useMemo(() => {
    const baseUniforms: Record<string, any> = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    };

    (Object.entries(preset.uniforms) as [string, Uniform][]).forEach(([key, config]) => {
      let val = config.value;
      if (config.type === 'color') {
        val = new THREE.Color(val);
      } else if (config.type === 'vec2' && Array.isArray(val)) {
        val = new THREE.Vector2(val[0], val[1]);
      }
      baseUniforms[key] = { value: val };
    });

    return baseUniforms;
  }, [preset.id, size.width, size.height]);

  // Handle immediate updates to the existing uniform references.
  useEffect(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    
    Object.entries(uniformValues).forEach(([key, val]) => {
      if (mat.uniforms[key]) {
        const type = preset.uniforms[key]?.type;
        if (type === 'color') {
          mat.uniforms[key].value.set(val);
        } else if (type === 'vec2' && Array.isArray(val)) {
          mat.uniforms[key].value.set(val[0], val[1]);
        } else {
          mat.uniforms[key].value = val;
        }
      }
    });
  }, [uniformValues, preset.id]);

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = state.clock.getElapsedTime();
      // Ensure resolution is always correct even if window resizes
      mat.uniforms.uResolution.value.set(size.width, size.height);
    }
  });

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        key={preset.id}
        fragmentShader={preset.fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
        transparent={true}
      />
    </mesh>
  );
};

export default ShaderCanvas;
