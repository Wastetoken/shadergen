
import { ShaderPreset } from './types';
import { NOISE_GLSL } from './glsl/noise';

export const SHADER_PRESETS: ShaderPreset[] = [
  // --- NOISE & TEXTURE TECHNIQUES ---
  {
    id: 'worley-caustics',
    name: 'Oceanic Caustics',
    description: 'Worley noise with distance-to-edge calculation for organic water patterns.',
    category: 'Noise',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uScale;
      uniform float uSpeed;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/min(uResolution.y,uResolution.x);
          vec3 v = voronoi(uv * uScale + uTime * uSpeed);
          float d = v.x;
          vec3 col = mix(uColorA, uColorB, d);
          col += (1.0 - smoothstep(0.0, 0.08, d)) * 0.4;
          gl_FragColor = vec4(col, 1.0);
      }
    `,
    uniforms: {
      uScale: { value: 6.0, min: 1.0, max: 20.0, step: 0.1, label: 'Cell Density', type: 'float' },
      uSpeed: { value: 0.3, min: 0.0, max: 2.0, step: 0.01, label: 'Flow Speed', type: 'float' },
      uColorA: { value: '#002b5b', label: 'Deep Blue', type: 'color' },
      uColorB: { value: '#00d2ff', label: 'Surface Glow', type: 'color' }
    }
  },
  {
    id: 'perlin-marble',
    name: 'Liquid Marble',
    description: 'Domain-warped FBM simulating complex mineral veins and flows.',
    category: 'Noise',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uWarp;
      uniform float uDetail;
      uniform vec3 uTint;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = gl_FragCoord.xy/uResolution.y;
          vec2 q = vec2(fbm(uv * 3.0, 5, 0.5, 2.0), fbm(uv * 3.0 + vec2(1.2), 5, 0.5, 2.0));
          vec2 r = vec2(fbm(uv * 3.0 + 4.0*q*uWarp + vec2(1.7, 9.2), 5, 0.5, 2.0), fbm(uv * 3.0 + 4.0*q*uWarp + vec2(8.3, 2.8), 5, 0.5, 2.0));
          float f = fbm(uv * 3.0 + 4.0*r, 5, 0.5, 2.0);
          vec3 col = mix(vec3(0.05, 0.1, 0.15), uTint, clamp((f*f)*uDetail, 0.0, 1.0));
          gl_FragColor = vec4(col * (f*f + 0.5*f), 1.0);
      }
    `,
    uniforms: {
      uWarp: { value: 1.0, min: 0.1, max: 3.0, step: 0.1, label: 'Warp Intensity', type: 'float' },
      uDetail: { value: 4.0, min: 1.0, max: 10.0, step: 0.1, label: 'Vein Contrast', type: 'float' },
      uTint: { value: '#ff6600', label: 'Mineral Color', type: 'color' }
    }
  },
  {
    id: 'ridged-multifractal-peaks',
    name: 'Obsidian Ridges',
    description: 'Sharpened noise valleys creating volcanic rock or mountain peaks.',
    category: 'Noise',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uSharpness;
      uniform float uHeight;
      uniform vec3 uStoneColor;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = gl_FragCoord.xy/uResolution.y;
          float r = ridged(uv * 2.5 + uTime * 0.05, 8);
          r = pow(r, uSharpness) * uHeight;
          vec3 col = mix(vec3(0.02), uStoneColor, r);
          col += vec3(0.8, 0.9, 1.0) * pow(r, 12.0);
          gl_FragColor = vec4(col, 1.0);
      }
    `,
    uniforms: {
      uSharpness: { value: 3.0, min: 1.0, max: 10.0, step: 0.1, label: 'Ridge Sharpening', type: 'float' },
      uHeight: { value: 1.0, min: 0.1, max: 5.0, step: 0.1, label: 'Altitude Gain', type: 'float' },
      uStoneColor: { value: '#4a3f5a', label: 'Rock Base', type: 'color' }
    }
  },
  {
    id: 'anisotropic-silk',
    name: 'Woven Silk',
    description: 'Extremely stretched noise simulating fabric or organic hair textures.',
    category: 'Noise',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uStretch;
      uniform float uLustre;
      uniform vec3 uBaseColor;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = gl_FragCoord.xy/uResolution.xy;
          float n = fbm(uv * vec2(uStretch, 1.0) + uTime * 0.1, 6, 0.5, 2.0);
          vec3 col = mix(vec3(0.05), uBaseColor, n);
          col += pow(max(0.0, n), 10.0) * uLustre;
          gl_FragColor = vec4(col, 1.0);
      }
    `,
    uniforms: {
      uStretch: { value: 120.0, min: 10.0, max: 500.0, step: 1.0, label: 'Fiber Density', type: 'float' },
      uLustre: { value: 0.6, min: 0.0, max: 2.0, step: 0.1, label: 'Material Lustre', type: 'float' },
      uBaseColor: { value: '#9c27b0', label: 'Fabric Tint', type: 'color' }
    }
  },
  {
    id: 'curl-noise-fluid',
    name: 'Curl Streamlines',
    description: 'Divergence-free vector field creating fluid-like swirling motion.',
    category: 'Noise',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uSwirl;
      uniform float uScale;
      uniform vec3 uInkColor;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/min(uResolution.y,uResolution.x);
          vec2 c = curl(uv * uScale, uTime * 0.2) * uSwirl;
          float n = fbm(uv * 5.0 + c, 6, 0.5, 2.0);
          vec3 col = mix(vec3(0.01), uInkColor, smoothstep(0.3, 0.7, n));
          col += pow(max(0.0, n), 8.0) * 0.5;
          gl_FragColor = vec4(col, 1.0);
      }
    `,
    uniforms: {
      uSwirl: { value: 1.5, min: 0.1, max: 5.0, step: 0.1, label: 'Fluid Chaos', type: 'float' },
      uScale: { value: 2.0, min: 0.5, max: 10.0, step: 0.1, label: 'Field Scale', type: 'float' },
      uInkColor: { value: '#00ffcc', label: 'Ink Hue', type: 'color' }
    }
  },

  // --- FRACTALS ---
  {
    id: 'mandelbrot-explorer',
    name: 'Fractal Horizon',
    description: 'Deep-zoom Mandelbrot set with smooth escape-time coloring.',
    category: 'Fractal',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uZoom;
      uniform vec2 uCenter;
      uniform float uCycleSpeed;
      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/min(uResolution.y,uResolution.x);
          vec2 c = uCenter + uv * exp(-uZoom);
          vec2 z = vec2(0.0);
          float i = 0.0;
          for(int iter=0; iter<150; iter++) {
              z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
              if(dot(z,z) > 4.0) break;
              i++;
          }
          vec3 col = 0.5 + 0.5*cos(uTime * uCycleSpeed + i*0.15 + vec3(0,2,4));
          if(i == 150.0) col = vec3(0.0);
          gl_FragColor = vec4(col, 1.0);
      }
    `,
    uniforms: {
      uZoom: { value: 1.0, min: 0.0, max: 20.0, step: 0.1, label: 'Zoom Depth', type: 'float' },
      uCenter: { value: [-0.745, 0.1], label: 'Coordinates', type: 'vec2' as any },
      uCycleSpeed: { value: 1.0, min: 0.0, max: 5.0, step: 0.1, label: 'Cycle Velocity', type: 'float' }
    }
  },
  {
    id: 'julia-vortex-morph',
    name: 'Julia Morph',
    description: 'Dynamic Julia set with a rotating complex constant.',
    category: 'Fractal',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uRadius;
      uniform float uSpeed;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/min(uResolution.y,uResolution.x);
          vec2 c = vec2(sin(uTime*uSpeed), cos(uTime*uSpeed*0.7)) * uRadius;
          vec2 z = uv * 2.5;
          float i = 0.0;
          for(int iter=0; iter<100; iter++) {
              z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
              if(dot(z,z) > 4.0) break;
              i++;
          }
          gl_FragColor = vec4(hsb2rgb(vec3(i/100.0 + uTime*0.1, 0.8, 1.0)), 1.0);
      }
    `,
    uniforms: {
      uRadius: { value: 0.6, min: 0.1, max: 1.2, step: 0.01, label: 'Complexity', type: 'float' },
      uSpeed: { value: 0.4, min: 0.0, max: 2.0, step: 0.01, label: 'Morph Speed', type: 'float' }
    }
  },
  {
    id: 'newton-complex-roots',
    name: 'Newton Basin',
    description: 'Fractal created by Newton-Raphson iterations for roots of z^P - 1.',
    category: 'Fractal',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uPower;
      uniform float uIterations;
      uniform float uHueShift;
      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/min(uResolution.y,uResolution.x);
          vec2 z = uv * 3.0;
          float iter = 0.0;
          float maxI = uIterations;
          for(int i=0; i<80; i++) {
              if(float(i) >= maxI) break;
              vec2 z2 = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y);
              vec2 z3 = vec2(z2.x*z.x - z2.y*z.y, z2.x*z.y + z2.y*z.x);
              vec2 f = z3 - vec2(1.0, 0.0);
              vec2 df = 3.0 * z2;
              float den = dot(df, df) + 0.00001;
              z -= vec2(f.x*df.x + f.y*df.y, f.y*df.x - f.x*df.y) / den;
              iter++;
              if(dot(f,f) < 0.0001) break;
          }
          float angle = atan(z.y, z.x);
          vec3 col = 0.5 + 0.5*cos(angle + uHueShift + uTime*0.1 + vec3(0,2,4));
          gl_FragColor = vec4(col * (1.0 - iter/maxI), 1.0);
      }
    `,
    uniforms: {
      uPower: { value: 3.0, min: 2.0, max: 12.0, step: 1.0, label: 'Root Power', type: 'float' },
      uIterations: { value: 35.0, min: 5.0, max: 80.0, step: 1.0, label: 'Accuracy', type: 'float' },
      uHueShift: { value: 0.0, min: 0.0, max: 6.28, step: 0.1, label: 'Color Rotation', type: 'float' }
    }
  },
  {
    id: 'menger-carpet-fractal',
    name: 'Menger Matrix',
    description: 'Recursive square subdivision creating a 2D Menger Sponge cross-section.',
    category: 'Fractal',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uRecursion;
      uniform vec3 uMainColor;
      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/uResolution.y;
          uv = abs(uv);
          float res = 1.0;
          int d = int(uRecursion);
          for(int i=0; i<8; i++) {
              if(i >= d) break;
              vec2 f = fract(uv * 3.0);
              if(f.x > 0.333 && f.x < 0.666 && f.y > 0.333 && f.y < 0.666) {
                  res = 0.0;
                  break;
              }
              uv *= 3.0;
          }
          gl_FragColor = vec4(uMainColor * res, 1.0);
      }
    `,
    uniforms: {
      uRecursion: { value: 5.0, min: 1.0, max: 8.0, step: 1.0, label: 'Depth', type: 'float' },
      uMainColor: { value: '#00ffaa', label: 'Matrix Hue', type: 'color' }
    }
  },

  // --- GEOMETRY & SPACE ---
  {
    id: 'truchet-flow-pipes',
    name: 'Truchet Pipes',
    description: 'Interconnected tiling logic creating a pseudo-3D pipe system.',
    category: 'Geometry',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uDensity;
      uniform float uGirth;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = gl_FragCoord.xy/uResolution.y * uDensity;
          vec2 i = floor(uv); vec2 f = fract(uv);
          float r = hash2(i).x;
          if(r > 0.5) f.x = 1.0 - f.x;
          float d = abs(length(f) - 0.5);
          float d2 = abs(length(f-vec2(1.0)) - 0.5);
          float dist = min(d, d2);
          vec3 col = vec3(smoothstep(uGirth, uGirth-0.02, dist));
          col *= hsb2rgb(vec3(r + uTime*0.1, 0.6, 1.0));
          gl_FragColor = vec4(col, 1.0);
      }
    `,
    uniforms: { 
      uDensity: { value: 8.0, min: 2.0, max: 30.0, step: 1.0, label: 'Grid Scale', type: 'float' },
      uGirth: { value: 0.12, min: 0.01, max: 0.45, step: 0.01, label: 'Pipe Width', type: 'float' }
    }
  },
  {
    id: 'metaballs-organic',
    name: 'Viscous Blobs',
    description: 'Smooth-union blending of distance fields for biological metaball effects.',
    category: 'Geometry',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uViscosity;
      uniform float uCount;
      uniform vec3 uBaseColor;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/uResolution.y;
          float d = 100.0;
          int n = int(uCount);
          for(int i=0; i<12; i++) {
              if(i >= n) break;
              float fi = float(i);
              float t = uTime * 0.8 + fi * 2.3;
              vec2 p = vec2(sin(t*0.7 + fi), cos(t*0.5 + fi*1.1)) * 0.45;
              d = opSmoothUnion(d, sdCircle(uv - p, 0.1), uViscosity);
          }
          vec3 col = mix(vec3(0.01), uBaseColor, 1.0 - smoothstep(0.0, 0.02, d));
          col += uBaseColor * 0.2 * exp(-15.0 * abs(d));
          gl_FragColor = vec4(col, 1.0);
      }
    `,
    uniforms: { 
      uViscosity: { value: 0.25, min: 0.05, max: 0.6, step: 0.01, label: 'Fluidity', type: 'float' },
      uCount: { value: 6.0, min: 1.0, max: 12.0, step: 1.0, label: 'Entity Count', type: 'float' },
      uBaseColor: { value: '#0088ff', label: 'Liquid Tint', type: 'color' }
    }
  },
  {
    id: 'hexagonal-lattice-pulse',
    name: 'Neural Hex',
    description: 'SDF hexagon grid with distance-based pulse dynamics and scanlines.',
    category: 'Geometry',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uScale;
      uniform vec3 uLineColor;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/uResolution.y;
          float d = sdHexagon(fract(uv * uScale) - 0.5, 0.42);
          float pulse = sin(length(uv)*6.0 - uTime*3.5)*0.5+0.5;
          float mask = smoothstep(0.0, -0.04, d);
          vec3 col = mix(vec3(0.02), uLineColor, mask * pulse);
          col += uLineColor * 0.1 * sin(uv.y * 200.0 + uTime*10.0);
          gl_FragColor = vec4(col, 1.0);
      }
    `,
    uniforms: {
      uScale: { value: 12.0, min: 5.0, max: 40.0, step: 1.0, label: 'Lattice Density', type: 'float' },
      uLineColor: { value: '#ff0088', label: 'Circuit Color', type: 'color' }
    }
  },

  // --- DYNAMICS & EFFECTS ---
  {
    id: 'digital-rain-optimized',
    name: 'Matrix Echo',
    description: 'Cascading digital rain with varying speeds and glow trails.',
    category: 'Dynamics',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uVelocity;
      uniform float uGrid;
      uniform vec3 uCodeColor;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = gl_FragCoord.xy/uResolution.xy;
          float col_idx = floor(uv.x * uGrid);
          float speed = 2.5 + hash2(vec2(col_idx)).x * 4.0;
          float y_off = fract(uv.y + uTime * speed * 0.1 * uVelocity + hash2(vec2(col_idx)).y);
          float glyph = step(0.65, snoise(vec2(col_idx, floor(uv.y * 35.0))));
          vec3 color = uCodeColor * (1.0 - y_off) * glyph;
          gl_FragColor = vec4(color, 1.0);
      }
    `,
    uniforms: {
      uVelocity: { value: 1.2, min: 0.1, max: 4.0, step: 0.1, label: 'Fall Velocity', type: 'float' },
      uGrid: { value: 50.0, min: 10.0, max: 120.0, step: 1.0, label: 'Character Width', type: 'float' },
      uCodeColor: { value: '#00ff44', label: 'Code Glow', type: 'color' }
    }
  },
  {
    id: 'vhs-distorted-drift',
    name: 'Analog Decay',
    description: 'Post-process VHS emulation with tracking jitter and chroma noise.',
    category: 'Dynamics',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uGlitch;
      uniform float uNoise;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = gl_FragCoord.xy/uResolution.xy;
          float drift = snoise(vec2(uTime*12.0, uv.y*8.0)) * uGlitch;
          float r = snoise(uv + vec2(drift, 0));
          float g = snoise(uv);
          float b = snoise(uv - vec2(drift, 0));
          float staticN = hash2(uv + uTime).x * uNoise;
          vec3 col = vec3(r, g, b) * 0.5 + 0.5 + staticN;
          col *= 0.85 + 0.15 * sin(uv.y * 450.0 + uTime * 25.0);
          gl_FragColor = vec4(col, 1.0);
      }
    `,
    uniforms: {
      uGlitch: { value: 0.04, min: 0.0, max: 0.25, step: 0.001, label: 'Tracking Error', type: 'float' },
      uNoise: { value: 0.1, min: 0.0, max: 0.4, step: 0.01, label: 'White Noise', type: 'float' }
    }
  },
  {
    id: 'boreal-aurora-spectral',
    name: 'Ghost Aurora',
    description: 'Ethereal vertical light ribbons with spectral color cycling.',
    category: 'Dynamics',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uAmplitude;
      uniform float uSpeed;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = gl_FragCoord.xy/uResolution.xy;
          float n = fbm(vec2(uv.x * 2.2, uTime * 0.2 * uSpeed), 5, 0.5, 2.0);
          float ribbon = exp(-35.0 * abs(uv.y - 0.5 - n * uAmplitude));
          vec3 col = hsb2rgb(vec3(n + uTime * 0.08, 0.7, 1.0)) * ribbon * 3.0;
          gl_FragColor = vec4(col, 1.0);
      }
    `,
    uniforms: {
      uAmplitude: { value: 0.3, min: 0.05, max: 0.9, step: 0.01, label: 'Wave Stretch', type: 'float' },
      uSpeed: { value: 1.0, min: 0.1, max: 5.0, step: 0.1, label: 'Drift Speed', type: 'float' }
    }
  },
  {
    id: 'plasma-neon-interfere',
    name: 'Cyber Plasma',
    description: 'Classic trigonometric plasma interference with HSB mapping.',
    category: 'Dynamics',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uEnergy;
      uniform float uScale;
      ${NOISE_GLSL}
      void main() {
          vec2 p = gl_FragCoord.xy / uResolution.xy;
          float v = sin(p.x*10.0*uScale + uTime) + sin(p.y*14.0*uScale + uTime*0.9) + sin((p.x+p.y)*12.0*uScale + uTime*1.1);
          v += sin(sqrt(p.x*p.x + p.y*p.y)*9.0*uScale + uTime);
          gl_FragColor = vec4(hsb2rgb(vec3(v*0.2*uEnergy + uTime*0.12, 0.85, 1.0)), 1.0);
      }
    `,
    uniforms: {
      uEnergy: { value: 1.2, min: 0.2, max: 5.0, step: 0.1, label: 'Interference Energy', type: 'float' },
      uScale: { value: 1.0, min: 0.2, max: 4.0, step: 0.1, label: 'Pattern Scale', type: 'float' }
    }
  },
  {
    id: 'volumetric-fog-raymarch',
    name: 'Nebula Mist',
    description: 'Pseudo-3D raymarching through a noise field for depth and density.',
    category: 'Dynamics',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uThickness;
      uniform vec3 uMistColor;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/uResolution.y;
          vec3 ro = vec3(0, 0, 4);
          vec3 rd = normalize(vec3(uv, -1.0));
          float acc = 0.0;
          for(int i=0; i<40; i++) {
              vec3 p = ro + rd * float(i) * 0.12;
              float n = fbm(p.xy * 1.8 + vec2(0, p.z + uTime*0.25), 4, 0.5, 2.0);
              acc += max(0.0, n - 0.4) * uThickness;
          }
          gl_FragColor = vec4(uMistColor * acc, 1.0);
      }
    `,
    uniforms: {
      uThickness: { value: 0.22, min: 0.02, max: 0.6, step: 0.01, label: 'Gas Density', type: 'float' },
      uMistColor: { value: '#a033ff', label: 'Ethereal Tint', type: 'color' }
    }
  },
  {
    id: 'cyber-ripple-warp-field',
    name: 'Warp Ripples',
    description: 'Intersecting waves distorted by high-frequency Simplex noise.',
    category: 'Dynamics',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uFrequency;
      uniform float uDistortion;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = gl_FragCoord.xy/uResolution.xy;
          float noise = snoise(uv * 6.0 + uTime * 0.15) * uDistortion;
          float v = sin((uv.x + noise)*uFrequency + uTime*2.5) * sin((uv.y + noise)*uFrequency - uTime*2.5);
          gl_FragColor = vec4(hsb2rgb(vec3(v*0.5+0.5, 0.95, 1.0)), 1.0);
      }
    `,
    uniforms: {
      uFrequency: { value: 25.0, min: 5.0, max: 75.0, step: 1.0, label: 'Wave Count', type: 'float' },
      uDistortion: { value: 0.12, min: 0.0, max: 0.6, step: 0.01, label: 'Spatial Warp', type: 'float' }
    }
  },
  {
    id: 'dragon-fractal-curve',
    name: 'Dragon Curve',
    description: 'Iterative fold geometry approximating the self-similar Dragon Curve.',
    category: 'Fractal',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uDepth;
      uniform float uAngle;
      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/uResolution.y;
          int it = int(uDepth);
          for(int i=0; i<16; i++) {
              if(i >= it) break;
              uv = abs(uv) - 0.5;
              float a = uAngle + 0.06*sin(uTime*0.5);
              float s = sin(a); float c = cos(a);
              uv = mat2(c, -s, s, c) * uv;
          }
          gl_FragColor = vec4(vec3(smoothstep(0.02, 0.0, length(uv))), 1.0);
      }
    `,
    uniforms: {
      uDepth: { value: 11.0, min: 1.0, max: 16.0, step: 1.0, label: 'Folding Order', type: 'float' },
      uAngle: { value: 0.8, min: 0.0, max: 3.14, step: 0.01, label: 'Fold Bias', type: 'float' }
    }
  },
  {
    id: 'mercury-chrome-liquid',
    name: 'Mercury Chrome',
    description: 'High-specular domain warped noise for metallic liquid effects.',
    category: 'Noise',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uFlow;
      uniform float uGloss;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = gl_FragCoord.xy/uResolution.y;
          float n = fbm(uv*2.2 + fbm(uv*2.0 + uTime*uFlow, 5, 0.5, 2.0), 6, 0.5, 2.0);
          float spec = pow(max(0.0, n), 12.0) * uGloss;
          gl_FragColor = vec4(vec3(n*0.35 + spec), 1.0);
      }
    `,
    uniforms: {
      uFlow: { value: 0.15, min: 0.01, max: 0.6, step: 0.01, label: 'Viscosity', type: 'float' },
      uGloss: { value: 5.0, min: 1.0, max: 15.0, step: 0.1, label: 'Specular Shine', type: 'float' }
    }
  },
  {
    id: 'techno-iris-mechanical',
    name: 'Mech Iris',
    description: 'Nested geometric rotation simulating a bionic aperture.',
    category: 'Geometry',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uLayers;
      uniform float uTorque;
      uniform vec3 uCircuitGlow;
      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/uResolution.y;
          float r = length(uv); float a = atan(uv.y, uv.x);
          float res = 0.0;
          int n = int(uLayers);
          for(int i=1; i<12; i++) {
              if(i >= n) break;
              float fi = float(i);
              float d = step(fi*0.045, r) * step(r, fi*0.045 + 0.006);
              res += d * step(0.5, sin(a*fi*3.5 + uTime*fi*uTorque));
          }
          gl_FragColor = vec4(uCircuitGlow * res, 1.0);
      }
    `,
    uniforms: {
      uLayers: { value: 8.0, min: 2.0, max: 12.0, step: 1.0, label: 'Aperture Layers', type: 'float' },
      uTorque: { value: 1.2, min: 0.1, max: 5.0, step: 0.1, label: 'Spin Velocity', type: 'float' },
      uCircuitGlow: { value: '#00ccff', label: 'Signal Hue', type: 'color' }
    }
  },
  {
    id: 'fresnel-prism-diffraction',
    name: 'Prism Aura',
    description: 'Edge-based refraction logic using pseudo-fresnel calculations.',
    category: 'Dynamics',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uPower;
      uniform float uReflect;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/uResolution.y;
          float n = snoise(uv*4.0 + uTime*0.4);
          float fresnel = pow(1.0 - dot(normalize(vec3(uv, 1.2)), vec3(0,0,1)), uPower);
          gl_FragColor = vec4(hsb2rgb(vec3(n + uTime*0.15, 0.65, 1.0)) * fresnel * uReflect, 1.0);
      }
    `,
    uniforms: {
      uPower: { value: 5.0, min: 1.0, max: 12.0, step: 0.1, label: 'Edge Falloff', type: 'float' },
      uReflect: { value: 2.5, min: 0.5, max: 8.0, step: 0.1, label: 'Luminance', type: 'float' }
    }
  },
  {
    id: 'newton-julia-vortex-set',
    name: 'Fractal Storm',
    description: 'A hybrid Newton-Julia set with period-mapped coloring.',
    category: 'Fractal',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uConstant;
      uniform float uScaleFactor;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/uResolution.y;
          vec2 z = uv * uScaleFactor;
          float iter = 0.0;
          for(int i=0; i<70; i++) {
              z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + uConstant;
              if(length(z) > 4.0) break;
              iter++;
          }
          gl_FragColor = vec4(hsb2rgb(vec3(iter/70.0 + uTime*0.1, 0.75, 1.0)), 1.0);
      }
    `,
    uniforms: {
      uConstant: { value: [-0.38, 0.62], label: 'Complex Constant', type: 'vec2' as any },
      uScaleFactor: { value: 2.2, min: 0.5, max: 10.0, step: 0.1, label: 'Viewport Zoom', type: 'float' }
    }
  },
  {
    id: 'sand-dunes-wind',
    name: 'Windy Dunes',
    description: 'Highly anisotropic noise layers simulating wind-swept desert sand.',
    category: 'Noise',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uGrain;
      uniform float uWind;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = gl_FragCoord.xy/uResolution.xy;
          float n = fbm(uv * vec2(1.2, 35.0) + uTime*uWind, 6, 0.5, 2.0);
          vec3 col = mix(vec3(0.85, 0.6, 0.25), vec3(1.0, 0.85, 0.5), n);
          col += hash2(uv + uTime).x * uGrain;
          gl_FragColor = vec4(col, 1.0);
      }
    `,
    uniforms: {
      uGrain: { value: 0.05, min: 0.0, max: 0.2, step: 0.01, label: 'Sand Texture', type: 'float' },
      uWind: { value: 0.06, min: 0.01, max: 0.4, step: 0.01, label: 'Wind Power', type: 'float' }
    }
  },
  {
    id: 'stained-glass-mosaic',
    name: 'Prism Mosaic',
    description: 'Voronoi tiling with quantized color pools and lead-line borders.',
    category: 'Geometry',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uTileScale;
      uniform float uBorder;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = gl_FragCoord.xy/uResolution.y * uTileScale;
          vec3 v = voronoi(uv + uTime*0.08);
          vec3 col = palette(v.y*3.5, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          col *= smoothstep(0.0, uBorder, v.x);
          gl_FragColor = vec4(col, 1.0);
      }
    `,
    uniforms: {
      uTileScale: { value: 6.5, min: 2.0, max: 20.0, step: 0.1, label: 'Mosaic Detail', type: 'float' },
      uBorder: { value: 0.08, min: 0.01, max: 0.25, step: 0.01, label: 'Lead Width', type: 'float' }
    }
  },
  {
    id: 'koch-snowflake-fractal',
    name: 'Koch Edge',
    description: 'Recursive line folding simulating the Koch Snowflake boundary.',
    category: 'Fractal',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uSubdivision;
      uniform float uRotation;
      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/uResolution.y;
          float a = uRotation + uTime*0.2;
          float s = sin(a); float c = cos(a);
          uv = mat2(c, -s, s, c) * uv;
          uv.x = abs(uv.x) - 0.5;
          int depth = int(uSubdivision);
          for(int i=0; i<10; i++) {
              if(i >= depth) break;
              uv = vec2(abs(uv.x), uv.y);
              float angle = 1.04719; // 60 degrees
              float sa = sin(angle); float ca = cos(angle);
              uv -= vec2(0.5, 0.0);
              uv = mat2(ca, -sa, sa, ca) * uv;
              uv.x = abs(uv.x);
          }
          gl_FragColor = vec4(vec3(smoothstep(0.01, 0.0, length(uv))), 1.0);
      }
    `,
    uniforms: {
      uSubdivision: { value: 5.0, min: 1.0, max: 10.0, step: 1.0, label: 'Snowflake Order', type: 'float' },
      uRotation: { value: 0.0, min: 0.0, max: 6.28, step: 0.1, label: 'Spin Offset', type: 'float' }
    }
  },
  {
    id: 'reaction-diff-approx-fluid',
    name: 'Turing Patterns',
    description: 'Noise-based thresholding approximating biological reaction-diffusion patterns.',
    category: 'Dynamics',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uGrowth;
      uniform float uShrink;
      uniform vec3 uCellColor;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = gl_FragCoord.xy/uResolution.y;
          float n1 = fbm(uv * 12.0 + uTime*0.05, 5, 0.5, 2.0);
          float n2 = fbm(uv * 18.0 + n1 * uGrowth, 5, 0.5, 2.0);
          float res = smoothstep(0.44, 0.46, n2) - smoothstep(uShrink, uShrink+0.03, n2);
          gl_FragColor = vec4(mix(vec3(0.03), uCellColor, res), 1.0);
      }
    `,
    uniforms: {
      uGrowth: { value: 5.0, min: 1.0, max: 15.0, step: 0.1, label: 'Reaction Power', type: 'float' },
      uShrink: { value: 0.55, min: 0.4, max: 0.8, step: 0.01, label: 'Diffusion Limit', type: 'float' },
      uCellColor: { value: '#aaff00', label: 'Cell Tint', type: 'color' }
    }
  },
  {
    id: 'star-nebula-clouds',
    name: 'Star Nebula',
    description: 'Multi-layered gaseous FBM simulating cosmic star-birth regions.',
    category: 'Dynamics',
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uGlow;
      uniform vec3 uCoreColor;
      ${NOISE_GLSL}
      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5*uResolution.xy)/uResolution.y;
          float n = fbm(uv*2.5 + uTime*0.04, 7, 0.5, 2.0);
          vec3 col = hsb2rgb(vec3(n*0.5 + uTime*0.02, 0.6, 1.0)) * n;
          col += vec3(pow(max(0.0, n-0.35), 6.0)*uGlow) * uCoreColor;
          gl_FragColor = vec4(col, 1.0);
      }
    `,
    uniforms: {
      uGlow: { value: 15.0, min: 1.0, max: 40.0, step: 0.5, label: 'Stellar Burn', type: 'float' },
      uCoreColor: { value: '#ffaaee', label: 'Gas Core', type: 'color' }
    }
  }
];
