import { NASAMeshes } from './planetMesh';

interface ModelBuffers {
  loaded: boolean;
  indexCount: number;
  vertex?: WebGLBuffer | null;
  normal?: WebGLBuffer | null;
  uv?: WebGLBuffer | null;
  faces?: WebGLBuffer | null;
  texture?: WebGLTexture | null;
}

export class PlanetRenderer {
  canvas: HTMLCanvasElement | null = null;
  gl: WebGLRenderingContext | null = null;
  program: WebGLProgram | null = null;
  positionLoc = -1;
  normalLoc = -1;
  uvLoc = -1;
  uSpin: WebGLUniformLocation | null = null;
  uTexture: WebGLUniformLocation | null = null;
  models: Record<string, ModelBuffers> = {};
  available = false;
  ready = false;

  constructor() {
    if (typeof window === 'undefined') return;
    this.init();
  }

  private init() {
    try {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 512;
      this.canvas.height = 512;
      this.gl = this.canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        depth: true,
        preserveDrawingBuffer: true,
        premultipliedAlpha: false,
      });

      if (!this.gl || !NASAMeshes.earth || !NASAMeshes.mars) return;
      const gl = this.gl;

      const vs = `
        attribute vec3 aPosition;
        attribute vec3 aNormal;
        attribute vec2 aUv;
        uniform float uSpin;
        varying vec2 vUv;
        varying float vLight;
        void main() {
          float c = cos(uSpin);
          float s = sin(uSpin);
          mat3 rot = mat3(c, 0.0, -s,  0.0, 1.0, 0.0,  s, 0.0, c);
          vec3 p = rot * aPosition;
          vec3 n = normalize(rot * aNormal);
          vUv = vec2(aUv.x, 1.0 - aUv.y);
          vLight = 0.21 + 0.80 * max(dot(n, normalize(vec3(-0.52, 0.58, 0.92))), 0.0);
          gl_Position = vec4(p.x * 0.91, p.y * 0.91, -p.z * 0.72, 1.0);
        }
      `;

      const fs = `
        precision mediump float;
        uniform sampler2D uTexture;
        varying vec2 vUv;
        varying float vLight;
        void main() {
          vec4 tex = texture2D(uTexture, vUv);
          gl_FragColor = vec4(tex.rgb * vLight, 1.0);
        }
      `;

      const compile = (kind: number, src: string) => {
        const sh = gl.createShader(kind);
        if (!sh) throw new Error('Shader creation failed');
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          const info = gl.getShaderInfoLog(sh);
          throw new Error(info || 'Shader compile error');
        }
        return sh;
      };

      const prg = gl.createProgram();
      if (!prg) throw new Error('Program creation failed');
      gl.attachShader(prg, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(prg, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(prg);
      if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(prg) || 'Program link error');
      }
      this.program = prg;
      gl.useProgram(prg);

      this.positionLoc = gl.getAttribLocation(prg, 'aPosition');
      this.normalLoc = gl.getAttribLocation(prg, 'aNormal');
      this.uvLoc = gl.getAttribLocation(prg, 'aUv');
      this.uSpin = gl.getUniformLocation(prg, 'uSpin');
      this.uTexture = gl.getUniformLocation(prg, 'uTexture');

      const buffer = (target: number, items: number[], ctor: Float32ArrayConstructor | Uint16ArrayConstructor) => {
        const b = gl.createBuffer();
        gl.bindBuffer(target, b);
        gl.bufferData(target, new ctor(items), gl.STATIC_DRAW);
        return b;
      };

      const planetNames: ('earth' | 'mars')[] = ['earth', 'mars'];
      for (const name of planetNames) {
        const data = NASAMeshes[name];
        const model: ModelBuffers = { loaded: false, indexCount: data.indices.length };
        model.vertex = buffer(gl.ARRAY_BUFFER, data.vertices, Float32Array);
        model.normal = buffer(gl.ARRAY_BUFFER, data.normals, Float32Array);
        model.uv = buffer(gl.ARRAY_BUFFER, data.uv, Float32Array);
        model.faces = buffer(gl.ELEMENT_ARRAY_BUFFER, data.indices, Uint16Array);
        model.texture = gl.createTexture();

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          gl.bindTexture(gl.TEXTURE_2D, model.texture!);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          model.loaded = true;
          this.ready = Object.values(this.models).every((m) => m.loaded);
        };
        img.src = `/assets/nasa_planets/${name}_texture.jpg`;
        this.models[name] = model;
      }

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.CULL_FACE);
      this.available = true;
    } catch (e) {
      console.warn('NASA 3D planet renderer unavailable; 2D fallback retained.', e);
      this.available = false;
    }
  }

  render(name: 'earth' | 'mars', spin: number): boolean {
    const gl = this.gl;
    const model = this.models[name];
    if (!gl || !model?.loaded || !this.program) return false;

    gl.viewport(0, 0, 512, 512);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.uniform1f(this.uSpin, spin);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertex!);
    gl.enableVertexAttribArray(this.positionLoc);
    gl.vertexAttribPointer(this.positionLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normal!);
    gl.enableVertexAttribArray(this.normalLoc);
    gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.uv!);
    gl.enableVertexAttribArray(this.uvLoc);
    gl.vertexAttribPointer(this.uvLoc, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, model.texture!);
    gl.uniform1i(this.uTexture, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.faces!);
    gl.drawElements(gl.TRIANGLES, model.indexCount, gl.UNSIGNED_SHORT, 0);

    return true;
  }
}

let singletonRenderer: PlanetRenderer | null = null;
export function getPlanetRenderer(): PlanetRenderer | null {
  if (typeof window === 'undefined') return null;
  if (!singletonRenderer) {
    singletonRenderer = new PlanetRenderer();
  }
  return singletonRenderer;
}
