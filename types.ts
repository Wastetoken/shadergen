
export interface Uniform {
  value: any;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  type: 'float' | 'vec2' | 'vec3' | 'color' | 'boolean';
}

export interface ShaderPreset {
  id: string;
  name: string;
  description: string;
  category: 'Noise' | 'Fractal' | 'Geometry' | 'Dynamics';
  fragmentShader: string;
  uniforms: Record<string, Uniform>;
}
