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

const VERT = `
  uniform float uOrderX;
  uniform float uDepth;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vPos;

  void main() {
    vUv = uv;
    float u = uv.x;

    // A constant-product pool gets more expensive the further you walk into it, so the
    // trench deepens toward its right edge rather than being a flat step.
    float walk = clamp(u / max(uOrderX, 0.0001), 0.0, 1.0);
    float profile = walk * walk;
    float edge = smoothstep(uOrderX + 0.015, uOrderX - 0.015, u);
    float trench = uDepth * profile * edge;

    // the standing surface of an untouched pool, barely moving
    float rest = sin(u * 9.0 + uTime * 0.35) * 0.006 + cos(uv.y * 7.0 - uTime * 0.27) * 0.005;

    vec3 p = position;
    p.z += rest - trench;
    vPos = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = `
  precision highp float;
  uniform float uOrderX;
  uniform float uDepth;
  uniform float uOver;
  uniform vec3 uInk;
  uniform vec3 uSignal;
  uniform vec3 uAccept;
  varying vec2 vUv;
  varying vec3 vPos;

  void main() {
    // normals from the rendered surface itself, so the lighting follows the real trench
    vec3 dx = dFdx(vPos);
    vec3 dy = dFdy(vPos);
    vec3 n = normalize(cross(dx, dy));
    vec3 lightDir = normalize(vec3(-0.35, -0.55, 0.78));
    float lambert = clamp(dot(n, lightDir), 0.0, 1.0);

    vec3 carved = mix(uAccept, uSignal, uOver);
    float inTrench = step(vUv.x, uOrderX);
    vec3 base = mix(uInk, carved, inTrench * 0.55);

    // contour rules: the surface is read as a measured thing, not as smoke
    float h = -vPos.z;
    float band = abs(fract(h * 34.0) - 0.5);
    float contour = smoothstep(0.46, 0.5, band) * 0.16;

    // hairline grid, one rule per cell
    vec2 g = abs(fract(vUv * vec2(48.0, 22.0)) - 0.5);
    float grid = (1.0 - smoothstep(0.0, 0.035, min(g.x, g.y))) * 0.085;

    vec3 col = base * (0.30 + lambert * 0.95) + contour + grid;

    // the rim where the order stops
    float rim = 1.0 - smoothstep(0.0, 0.006, abs(vUv.x - uOrderX));
    col = mix(col, carved, rim * 0.85);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function PoolWell({ orderShare, fillPct, limitPct }: PoolWellProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef({ x: 0, d: 0, over: 0 });

  targetRef.current = {
    x: Math.max(0.004, Math.min(1, orderShare)),
    // the trench depth is the router's own impact, scaled against the line you set
    d: Math.max(0, Math.min(1.4, fillPct / Math.max(limitPct, 0.01))) * 0.42,
    over: fillPct >= limitPct ? 1 : 0,
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      if (disposed || !host) return;

      let renderer: any;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      } catch {
        // No WebGL in this browser. The page still works; it simply does not draw the pool.
        host.dataset.webgl = "unavailable";
        return;
      }

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#0B0B10");
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      camera.position.set(0, -2.35, 1.95);
      camera.lookAt(0, 0.05, -0.12);

      const geo = new THREE.PlaneGeometry(3.2, 1.55, 200, 110);
      const uniforms = {
        uOrderX: { value: targetRef.current.x },
        uDepth: { value: targetRef.current.d },
        uTime: { value: 0 },
        uOver: { value: targetRef.current.over },
        uInk: { value: new THREE.Color("#15151C") },
        uSignal: { value: new THREE.Color("#C4261D") },
        uAccept: { value: new THREE.Color("#0B7A3B") },
      };
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
        extensions: { derivatives: true } as any,
      });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      host.appendChild(renderer.domElement);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";

      const resize = () => {
        const w = host.clientWidth || 1;
        const h = host.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const started = performance.now();
      let raf = 0;

      const frame = (now: number) => {
        const t = targetRef.current;
        // the trench travels to its new depth; it never cuts (charter motion: data 320ms)
        uniforms.uOrderX.value += (t.x - uniforms.uOrderX.value) * 0.12;
        uniforms.uDepth.value += (t.d - uniforms.uDepth.value) * 0.12;
        uniforms.uOver.value += (t.over - uniforms.uOver.value) * 0.12;
        uniforms.uTime.value = reduced ? 0 : (now - started) / 1000;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      host.dataset.webgl = "live";

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        geo.dispose();
        mat.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      data-device="mark-pool-well"
      aria-label="the live pool this order routes through, with the order carved into it"
      style={{
        width: "100%",
        aspectRatio: "16 / 7",
        borderRadius: "6px",
        overflow: "hidden",
        background: "#0B0B10",
        border: "1px solid var(--border)",
      }}
    />
  );
}
