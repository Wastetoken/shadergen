
export const NOISE_GLSL = `
// Basic Math & Constants
#define PI 3.14159265359
#define TWO_PI 6.28318530718

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ; m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// FBM (Fractal Brownian Motion) - Fixed 8 octaves for compiler stability
float fbm(vec2 p, int octaves, float persistence, float lacunarity) {
    float amp = 1.0;
    float freq = 1.0;
    float v = 0.0;
    for (int i = 0; i < 8; i++) {
        if(i >= octaves) break;
        v += amp * snoise(p * freq);
        amp *= persistence;
        freq *= lacunarity;
    }
    return v;
}

// Turbulence
float turbulence(vec2 p, int octaves) {
    float v = 0.0;
    float amp = 1.0;
    float freq = 1.0;
    for (int i = 0; i < 8; i++) {
        if(i >= octaves) break;
        v += amp * abs(snoise(p * freq));
        amp *= 0.5;
        freq *= 2.0;
    }
    return v;
}

// Ridged Multifractal
float ridged(vec2 p, int octaves) {
    float v = 0.0;
    float amp = 1.0;
    float freq = 1.0;
    for (int i = 0; i < 8; i++) {
        if(i >= octaves) break;
        float n = abs(snoise(p * freq));
        n = 1.0 - n;
        n *= n;
        v += n * amp;
        amp *= 0.5;
        freq *= 2.0;
    }
    return v;
}

// Cellular / Voronoi
vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

vec3 voronoi(vec2 x) {
    vec2 n = floor(x);
    vec2 f = fract(x);
    vec2 mg, mr;
    float md = 8.0;
    for(int j=-1; j<=1; j++)
    for(int i=-1; i<=1; i++) {
        vec2 g = vec2(float(i),float(j));
        vec2 o = hash2(n + g);
        vec2 r = g + o - f;
        float d = dot(r,r);
        if(d<md) {
            md = d; mr = r; mg = g;
        }
    }
    md = 8.0;
    for(int j=-2; j<=2; j++)
    for(int i=-2; i<=2; i++) {
        vec2 g = mg + vec2(float(i),float(j));
        vec2 o = hash2(n + g);
        vec2 r = g + o - f;
        if(dot(mr-r,mr-r)>0.00001)
        md = min(md, dot(0.5*(mr+r), normalize(r-mr)));
    }
    return vec3(md, mr);
}

// Curl Noise (Vector Field)
vec2 curl(vec2 p, float time) {
    const float e = .01;
    float n1 = snoise(p + vec2(0, e) + time);
    float n2 = snoise(p - vec2(0, e) + time);
    float n3 = snoise(p + vec2(e, 0) + time);
    float n4 = snoise(p - vec2(e, 0) + time);
    return vec2((n1 - n2) / (2. * e), (n4 - n3) / (2. * e));
}

// SDF Primitives
float sdCircle(vec2 p, float r) { return length(p) - r; }
float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}
float sdHexagon( vec2 p, float r ) {
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
    p = abs(p);
    p -= 2.0*min(dot(k.xy,p),0.0)*k.xy;
    p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
    return length(p)*sign(p.y);
}

// Blending SDF
float opSmoothUnion( float d1, float d2, float k ) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

// Color conversion helpers
vec3 hsb2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

// Domain Warp Tools
vec2 rotate(vec2 p, float a) {
    float s = sin(a); float c = cos(a);
    return p * mat2(c, -s, s, c);
}
`;
