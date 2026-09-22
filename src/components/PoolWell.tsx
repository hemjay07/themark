"use client";

import { useEffect, useRef } from "react";

interface PoolWellProps {
  // your order as a fraction of the pool's live depth (0..1)
  orderShare: number;
  // the fill cost the router returned for this exact order, in percent
  fillPct: number;
  // the line the founder set, in percent
  limitPct: number;
}

const VERT = `#version 300 es
  in vec2 aXY;
  uniform mat4 uMVP;
  uniform float uOrderX;
  uniform float uDepth;
  uniform float uTime;
  out vec2 vUv;
  out vec3 vPos;

  void main() {
    vec2 uv = aXY * 0.5 + 0.5;
    vUv = uv;

    // A constant-product pool gets more expensive the further you walk into it, so the trench
    // deepens toward its right edge rather than being a flat step. The carve is given a floor
    // width so a small order still reads as a shape rather than as a vertical cliff.
    float w = max(uOrderX, 0.14);
    float walk = clamp(uv.x / w, 0.0, 1.0);
    float profile = smoothstep(0.0, 1.0, walk);
    float edge = 1.0 - smoothstep(w * 0.82, w, uv.x);
    float trench = uDepth * profile * edge;

    // the standing surface of an untouched pool, barely moving
    float rest = sin(uv.x * 9.0 + uTime * 0.35) * 0.006 + cos(uv.y * 7.0 - uTime * 0.27) * 0.005;

    vec3 p = vec3(aXY.x * 1.6, aXY.y * 0.78, rest - trench);
    vPos = p;
    gl_Position = uMVP * vec4(p, 1.0);
  }
`;

const FRAG = `#version 300 es
  precision highp float;
  in vec2 vUv;
  in vec3 vPos;
  uniform float uOrderX;
  uniform float uOver;
  out vec4 outColor;

  const vec3 INK    = vec3(0.082, 0.082, 0.110);
  const vec3 SIGNAL = vec3(0.769, 0.149, 0.114);
  const vec3 ACCEPT = vec3(0.043, 0.478, 0.231);

  void main() {
    // normals from the rendered surface itself, so the lighting follows the real trench
    vec3 n = normalize(cross(dFdx(vPos), dFdy(vPos)));
    vec3 lightDir = normalize(vec3(-0.35, -0.55, 0.78));
    float lambert = clamp(abs(dot(n, lightDir)), 0.0, 1.0);

    vec3 carved = mix(ACCEPT, SIGNAL, uOver);
    float inTrench = 1.0 - smoothstep(max(uOrderX, 0.14) * 0.82, max(uOrderX, 0.14), vUv.x);
    vec3 base = mix(INK, carved, inTrench * 0.55);

    // contour rules: the surface reads as a measured thing, not as smoke
    float h = -vPos.z;
    float band = abs(fract(h * 34.0) - 0.5);
    float contour = smoothstep(0.46, 0.5, band) * 0.14;

    // hairline grid, one rule per cell
    vec2 g = abs(fract(vUv * vec2(48.0, 22.0)) - 0.5);
    float grid = (1.0 - smoothstep(0.0, 0.04, min(g.x, g.y))) * 0.08;

    vec3 col = base * (0.30 + lambert * 0.95) + contour + grid;

    // the rim where the order stops
    float rim = 1.0 - smoothstep(0.0, 0.008, abs(vUv.x - max(uOrderX, 0.14)));
    col = mix(col, carved, rim * 0.85);

    outColor = vec4(col, 1.0);
  }
`;

// A fixed camera, so the matrix is built once by hand rather than pulling in a 3D library
// for one plane. Perspective * lookAt, column-major, the order WebGL expects.
function buildMVP(aspect: number): Float32Array {
  const fov = (30 * Math.PI) / 180;
  const near = 0.1;
  const far = 100;
  const f = 1 / Math.tan(fov / 2);
  const eye = [0, -2.35, 1.95];
  const target = [0, 0.05, -0.12];
  const up = [0, 0, 1];

  const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const norm = (a: number[]) => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const cross = (a: number[], b: number[]) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  const z = norm(sub(eye, target));
  const x = norm(cross(up, z));
  const y = cross(z, x);

  // view matrix, column-major
  const v = [
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
  ];
  const p = [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0,
  ];

  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += p[k * 4 + r] * v[c * 4 + k];
      out[c * 4 + r] = s;
    }
  }
  return out;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("shader:", gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}

export default function PoolWell({ orderShare, fillPct, limitPct }: PoolWellProps) {
  const hostRef = useRef<HTMLCanvasElement | null>(null);
  const targetRef = useRef({ x: 0, d: 0, over: 0 });

  targetRef.current = {
    x: Math.max(0.004, Math.min(1, orderShare)),
    // the trench depth is the router's own impact, measured against the line you set
    d: Math.max(0, Math.min(1.25, fillPct / Math.max(limitPct, 0.01))) * 0.17,
    over: fillPct >= limitPct ? 1 : 0,
  };

  useEffect(() => {
    const canvas = hostRef.current;
    if (!canvas) return;
    canvas.dataset.webgl = "init";

    const gl = canvas.getContext("webgl2", { antialias: true });
    if (!gl) {
      // No WebGL2 here. Say so rather than leaving a silent black rectangle under a caption
      // that narrates a trench nobody can see.
      canvas.dataset.webgl = "unavailable";
      const ctx2d = canvas.getContext("2d");
      if (ctx2d) {
        const dpr = Math.min(1.5, window.devicePixelRatio || 1);
        canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
        ctx2d.fillStyle = "#0B0B10";
        ctx2d.fillRect(0, 0, canvas.width, canvas.height);
        ctx2d.fillStyle = "#71717A";
        ctx2d.font = `${12 * dpr}px "JetBrains Mono", monospace`;
        ctx2d.textAlign = "center";
        ctx2d.fillText(
          "this browser has no WebGL2, so the pool is not drawn here",
          canvas.width / 2,
          canvas.height / 2
        );
        ctx2d.fillText(
          "every number below is still read live",
          canvas.width / 2,
          canvas.height / 2 + 20 * dpr
        );
      }
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("link:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // a grid of triangles: the pool surface
    // enough resolution for a smooth trench without making a software renderer crawl
    const NX = 120;
    const NY = 66;
    const verts: number[] = [];
    const idx: number[] = [];
    for (let j = 0; j <= NY; j++) {
      for (let i = 0; i <= NX; i++) {
        verts.push((i / NX) * 2 - 1, (j / NY) * 2 - 1);
      }
    }
    for (let j = 0; j < NY; j++) {
      for (let i = 0; i < NX; i++) {
        const a = j * (NX + 1) + i;
        const b = a + 1;
        const c = a + (NX + 1);
        const d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    }

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aXY");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.STATIC_DRAW);

    const uMVP = gl.getUniformLocation(prog, "uMVP");
    const uOrderX = gl.getUniformLocation(prog, "uOrderX");
    const uDepth = gl.getUniformLocation(prog, "uDepth");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uOver = gl.getUniformLocation(prog, "uOver");

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.043, 0.043, 0.063, 1);

    let mvp = buildMVP(1);
    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      mvp = buildMVP(w / h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const started = performance.now();
    const cur = { x: 0.004, d: 0, over: 0 };
    let raf = 0;

    const frame = (now: number) => {
      const t = targetRef.current;
      // the trench travels to its new depth; it never cuts (charter motion: data 320ms)
      cur.x += (t.x - cur.x) * 0.12;
      cur.d += (t.d - cur.d) * 0.12;
      cur.over += (t.over - cur.over) * 0.12;

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(uMVP, false, mvp);
      gl.uniform1f(uOrderX, cur.x);
      gl.uniform1f(uDepth, cur.d);
      gl.uniform1f(uOver, cur.over);
      gl.uniform1f(uTime, reduced ? 0 : (now - started) / 1000);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    canvas.dataset.webgl = "live";

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteBuffer(vbo);
      gl.deleteBuffer(ibo);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <canvas
      ref={hostRef}
      data-device="mark-pool-well"
      aria-label="the live pool this order routes through, with the order carved into it"
      style={{
        width: "100%",
        aspectRatio: "16 / 7",
        display: "block",
        borderRadius: "6px",
        background: "#0B0B10",
        border: "1px solid var(--border)",
      }}
    />
  );
}
