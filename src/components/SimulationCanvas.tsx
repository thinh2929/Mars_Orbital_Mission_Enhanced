'use client';

import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ASSETS } from '../lib/constants';
import { getPlanetRenderer } from '../lib/planetRenderer';

export const SimulationCanvas: React.FC = () => {
  const { state, build, motionTimes, launchFX, photoCapacity } = useGame();
  const cap = photoCapacity();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spritesRef = useRef<Record<string, HTMLImageElement>>({});
  const starsRef = useRef<Array<{ x: number; y: number; r: number; phase: number }>>([]);

  const stateRef = useRef(state);
  stateRef.current = state;
  const buildRef = useRef(build);
  buildRef.current = build;

  // Preload sprites on mount
  useEffect(() => {
    starsRef.current = Array.from({ length: 170 }, (_, i) => ({
      x: ((i * 9821 + 263) % 991) / 991,
      y: ((i * 3331 + 497) % 977) / 977,
      r: 0.35 + ((i * 17) % 9) / 10,
      phase: i * 0.61,
    }));

    Object.entries(ASSETS).forEach(([key, path]) => {
      const img = new Image();
      img.src = path;
      spritesRef.current[key] = img;
    });
  }, []);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let time = 0;
    let lastFrame = performance.now();

    const cap = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
    const rand = (a: number) => (((Math.sin(a * 34.272 + 7.2) * 43758.5453) % 1) + 1) % 1;

    const line = (x1: number, y1: number, x2: number, y2: number, color = '#7bdad5', width = 1, dash: number[] = []) => {
      ctx.beginPath();
      ctx.setLineDash(dash);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const textAt = (
      t: string,
      x: number,
      y: number,
      color = '#b3c7d6',
      size = 11,
      align: CanvasTextAlign = 'left',
      weight = '500'
    ) => {
      ctx.font = `${weight} ${size}px Segoe UI, Arial, sans-serif`;
      ctx.textAlign = align;
      ctx.fillStyle = color;
      ctx.fillText(t, x, y);
      ctx.textAlign = 'left';
    };

    const dot = (x: number, y: number, r = 3, color = '#7de4d6') => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    };

    const ellipseStroke = (
      x: number,
      y: number,
      rx: number,
      ry: number,
      color: string,
      width = 1,
      dash: number[] = [],
      rot = 0
    ) => {
      ctx.beginPath();
      ctx.ellipse(x, y, Math.max(1, rx), Math.max(1, ry), rot, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawCurved = (
      x1: number,
      y1: number,
      cx: number,
      cy: number,
      x2: number,
      y2: number,
      color: string,
      width = 2,
      dash: number[] = []
    ) => {
      ctx.beginPath();
      ctx.setLineDash(dash);
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cx, cy, x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawSprite = (
      img: HTMLImageElement | undefined,
      x: number,
      y: number,
      w: number,
      h: number,
      angle = 0,
      alpha = 1
    ) => {
      if (!img?.complete || !img.naturalWidth) return false;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
      return true;
    };

    const planet = (x: number, y: number, r: number, type: 'mars' | 'earth' = 'mars') => {
      if (r <= 1) return;
      const renderer = getPlanetRenderer();
      if (renderer?.available && renderer.render(type, time * (type === 'earth' ? 0.1 : 0.074) + 1.1)) {
        ctx.save();
        const rad = r * 1.105;
        ctx.drawImage(renderer.canvas!, x - rad, y - rad, rad * 2, rad * 2);
        ctx.strokeStyle = type === 'mars' ? '#dc815334' : '#9dcef044';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
        return;
      }

      // Procedural 2D fallback
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.clip();
      const gr = ctx.createRadialGradient(
        x - r * 0.34,
        y - r * 0.42,
        r * 0.08,
        x + r * 0.34,
        y + r * 0.28,
        r * 1.18
      );
      if (type === 'mars') {
        gr.addColorStop(0, '#d99065');
        gr.addColorStop(0.28, '#b65a3b');
        gr.addColorStop(0.68, '#752e28');
        gr.addColorStop(1, '#2a1c27');
      } else {
        gr.addColorStop(0, '#9ed6df');
        gr.addColorStop(0.28, '#357baf');
        gr.addColorStop(0.65, '#173a67');
        gr.addColorStop(1, '#081627');
      }
      ctx.fillStyle = gr;
      ctx.fillRect(x - r, y - r, 2 * r, 2 * r);

      if (type === 'mars') {
        const im = spritesRef.current.mars1;
        if (im?.complete && im.naturalWidth) {
          ctx.globalAlpha = 0.31;
          ctx.drawImage(im, x - r, y - r, 2 * r, 2 * r);
          ctx.globalAlpha = 1;
        }
      }
      ctx.restore();

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = type === 'mars' ? '#d27a5150' : '#8bc8e84e';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const drawRocket = (x: number, y: number, size = 95, angle = 0, flame = false) => {
      const cur = stateRef.current;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      const im = cur.launcher === 2 ? spritesRef.current.rocket2 : spritesRef.current.rocket;
      const ratio = im?.naturalWidth && im?.naturalHeight ? im.naturalWidth / im.naturalHeight : 0.25;
      const h = size;
      const w = h * ratio;

      if (flame) {
        const flameLen = (24 + Math.sin(time * 32) * 8) * Math.max(0.5, cur.launch.throttle / 100);
        const gr = ctx.createLinearGradient(0, h / 2 - 4, 0, h / 2 + flameLen);
        gr.addColorStop(0, '#e6faee');
        gr.addColorStop(0.3, '#f9ad61');
        gr.addColorStop(1, '#ff704000');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.moveTo(-w * 0.24, h * 0.38);
        ctx.lineTo(-w * 0.55, h * 0.48 + flameLen);
        ctx.lineTo(0, h * 0.5 + flameLen * 0.5);
        ctx.lineTo(w * 0.55, h * 0.48 + flameLen);
        ctx.lineTo(w * 0.24, h * 0.38);
        ctx.fill();
      }

      if (!drawSprite(im, 0, 0, w, h)) {
        ctx.fillStyle = '#d6e5ee';
        ctx.fillRect(-w / 2, -h / 2, w, h);
      }
      ctx.restore();
    };

    const drawSatellite = (x: number, y: number, size = 124, angle = 0, alpha = 1) => {
      const cur = stateRef.current;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.globalAlpha = alpha;

      const arraySpan = [1, 0.76, 1.18][cur.slot[2]] || 1;
      let deploy = cur.sat.solar ? 1 : 0.12;
      if (cur.phase === 'assembly') deploy = 1;
      if (cur.phase === 'tmi' && !cur.tmi.detached) deploy = 0.1;

      const arrW = size * 0.5 * arraySpan * deploy;
      const arrH = size * 0.25;

      for (const side of [-1, 1]) {
        const start = side * size * 0.16;
        ctx.strokeStyle = '#9ab6b7';
        ctx.lineWidth = Math.max(1, size * 0.012);
        ctx.beginPath();
        ctx.moveTo(start, 0);
        ctx.lineTo(start + side * arrW, 0);
        ctx.stroke();

        const left = side > 0 ? start : start - arrW;
        ctx.fillStyle = '#123a59';
        ctx.fillRect(left, -arrH * 0.5, arrW, arrH);
        ctx.strokeStyle = '#7dbbcb';
        ctx.lineWidth = 1;
        ctx.strokeRect(left, -arrH * 0.5, arrW, arrH);
      }

      const im = spritesRef.current.mroN || spritesRef.current.mro;
      if (im?.naturalWidth) {
        ctx.drawImage(im, 192, 136, 133, 188, -size * 0.2, -size * 0.35, size * 0.4, size * 0.7);
      } else {
        ctx.fillStyle = '#c7b8a1';
        ctx.fillRect(-size * 0.15, -size * 0.2, size * 0.3, size * 0.4);
      }

      if (cur.sat.antenna || cur.phase === 'assembly') {
        const antennaSize = [0.17, 0.125, 0.095][cur.slot[4]] * size;
        ctx.fillStyle = '#d2c6a9';
        ctx.strokeStyle = '#40576b';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, -size * 0.19, antennaSize, antennaSize * 0.57, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawCentaur = (x: number, y: number, size: number, angle = 0) => {
      const cur = stateRef.current;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      const h = size;
      const w = size * 0.26;
      ctx.fillStyle = '#d7e2df';
      ctx.fillRect(-w / 2, -h * 0.39, w, h * 0.66);
      ctx.fillStyle = '#8ca5ba';
      ctx.fillRect(-w * 0.55, h * 0.16, w * 1.1, h * 0.13);
      ctx.fillStyle = '#dfe6df';
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h * 0.39);
      ctx.lineTo(0, -h * 0.63);
      ctx.lineTo(w / 2, -h * 0.39);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3e5166';
      ctx.beginPath();
      ctx.moveTo(-w * 0.28, h * 0.29);
      ctx.lineTo(-w * 0.42, h * 0.48);
      ctx.lineTo(w * 0.42, h * 0.48);
      ctx.lineTo(w * 0.28, h * 0.29);
      ctx.closePath();
      ctx.fill();

      if (cur.sep.centaur && !cur.tmi.complete) {
        ctx.fillStyle = '#faab68aa';
        ctx.beginPath();
        ctx.moveTo(-w * 0.22, h * 0.48);
        ctx.lineTo(0, h * 0.84 + Math.sin(time * 17) * h * 0.03);
        ctx.lineTo(w * 0.22, h * 0.48);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawFairing = (x: number, y: number, size = 56, angle = 0) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      const w = size * 0.44;
      const h = size * 0.95;
      const sp1 = spritesRef.current.fair1;
      const sp2 = spritesRef.current.fair2;
      if (sp1?.complete && sp2?.complete && sp1.naturalWidth && sp2.naturalWidth) {
        ctx.drawImage(sp1, -w * 0.5, -h * 0.5, w * 0.5, h);
        ctx.drawImage(sp2, 0, -h * 0.5, w * 0.5, h);
      } else {
        ctx.fillStyle = '#d4e1e8';
        ctx.strokeStyle = '#385062';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.5);
        ctx.quadraticCurveTo(w * 0.5, -h * 0.15, w * 0.5, h * 0.5);
        ctx.lineTo(-w * 0.5, h * 0.5);
        ctx.quadraticCurveTo(-w * 0.5, -h * 0.15, 0, -h * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#1d2c38';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.5);
        ctx.lineTo(0, h * 0.5);
        ctx.stroke();
      }
      ctx.restore();
    };

    const ageOf = (key: string) => {
      const t = launchFX.current[key];
      return t ? Math.max(0, (performance.now() - t) / 1000) : 5;
    };

    const pyroFlash = (x: number, y: number, age: number) => {
      if (age > 1.1) return;
      ctx.save();
      ctx.globalAlpha = 1 - age / 1.1;
      ctx.strokeStyle = '#f9be76';
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI * 2) / 12;
        const dist = age * 50;
        const xx = x + Math.cos(a) * dist;
        const yy = y + Math.sin(a) * dist;
        line(xx, yy, xx + Math.cos(a) * (5 + age * 15), yy + Math.sin(a) * (5 + age * 15), '#ffc882', 1.5);
      }
      ctx.restore();
    };

    const v3Bezier = (
      a: { x: number; y: number },
      b: { x: number; y: number },
      c: { x: number; y: number },
      d: { x: number; y: number },
      u: number
    ) => {
      const t = 1 - u;
      return {
        x: t * t * t * a.x + 3 * t * t * u * b.x + 3 * t * u * u * c.x + u * u * u * d.x,
        y: t * t * t * a.y + 3 * t * t * u * b.y + 3 * t * u * u * c.y + u * u * u * d.y,
      };
    };

    const v3Trail = (
      a: { x: number; y: number },
      b: { x: number; y: number },
      c: { x: number; y: number },
      d: { x: number; y: number },
      progress: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      for (let i = 1; i <= 65; i++) {
        const t = (progress * i) / 65;
        const p = v3Bezier(a, b, c, d, t);
        ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = '#74ead4';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.stroke();
    };

    const renderFrame = (now: number) => {
      const dt = cap((now - lastFrame) / 1000, 0, 0.065);
      lastFrame = now;
      time += dt;

      // Fit to container
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const needW = Math.round(rect.width * pixelRatio);
      const needH = Math.round(rect.height * pixelRatio);

      if (canvas.width !== needW || canvas.height !== needH) {
        canvas.width = needW;
        canvas.height = needH;
      }

      const W = rect.width;
      const H = rect.height;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      // Background
      const grad = ctx.createRadialGradient(W * 0.48, H * 0.45, 12, W * 0.48, H * 0.45, Math.max(W, H) * 0.72);
      grad.addColorStop(0, '#17283b');
      grad.addColorStop(0.5, '#091321');
      grad.addColorStop(1, '#030912');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Stars
      for (const s of starsRef.current) {
        const a = 0.27 + 0.37 * (0.5 + 0.5 * Math.sin(time * 0.55 + s.phase));
        ctx.fillStyle = `rgba(187,211,227,${a})`;
        ctx.fillRect(s.x * W, s.y * H, s.r, s.r);
      }

      // Subtle grid
      const gSize = Math.max(36, Math.floor(W / 19));
      ctx.strokeStyle = 'rgba(79,129,155,.053)';
      ctx.lineWidth = 0.6;
      for (let x = 0; x < W; x += gSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += gSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      ctx.save();
      const cur = stateRef.current;
      const currentBuild = buildRef.current;

      // Screen shake on launch
      if (cur.phase === 'launch' && cur.launch.ignited) {
        const tIgn = ageOf('ignition');
        const amp = tIgn < 3 ? 8 * (1 - tIgn / 3) + 1.6 : 1.25 + (cur.launch.q > 30 ? 1.7 : 0);
        ctx.translate(
          (Math.sin(time * 64) + Math.cos(time * 91)) * 0.5 * amp,
          (Math.cos(time * 71) - Math.sin(time * 48)) * 0.5 * amp
        );
      }

      // Render Scene by phase
      switch (cur.phase) {
        case 'assembly': {
          const cx = W * 0.48;
          const cy = H * 0.54;
          ctx.strokeStyle = '#6b9fbd30';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 8]);
          ctx.strokeRect(W * 0.22, H * 0.22, W * 0.52, H * 0.56);
          ctx.setLineDash([]);
          drawSatellite(cx, cy, Math.min(W * 0.44, H * 0.73, 345), 0.02);

          const rX = W * 0.86;
          const rY = H * 0.53;
          drawRocket(rX, rY, Math.min(H * 0.6, 255), 0, false);
          ctx.strokeStyle = '#a8b6c955';
          ctx.strokeRect(rX - 38, rY - Math.min(H * 0.34, 133), 76, Math.min(H * 0.68, 266));

          textAt('MRO / CONFIGURABLE SPACECRAFT', cx, H * 0.88, '#b4d5df', 11, 'center', '700');
          textAt('LAUNCH VEHICLE', rX, H * 0.88, '#a4c0ca', 10, 'center', '700');
          textAt(
            'STOWED FAIRING ' + (currentBuild.fairingOK ? 'PASS' : 'FAIL'),
            W * 0.68,
            H * 0.22,
            currentBuild.fairingOK ? '#88e1c8' : '#fa9485',
            10,
            'right',
            '700'
          );
          break;
        }

        case 'launch': {
          const l = cur.launch;
          const p = cap(l.alt / 101, 0, 1);
          const sx = W * 0.23;
          const sy = H * 0.81;
          const tx = W * 0.79;
          const ty = H * 0.2;
          const groundY = H * 0.87;

          // Ground launch complex SLC-41
          const gGround = ctx.createLinearGradient(0, groundY, 0, H);
          gGround.addColorStop(0, '#243443');
          gGround.addColorStop(1, '#0d1b27');
          ctx.fillStyle = gGround;
          ctx.fillRect(0, groundY, W, H - groundY);
          line(0, groundY, W, groundY, '#8a9aaa', 2);

          // Tower and pad
          ctx.fillStyle = '#253746';
          ctx.fillRect(sx - 62, groundY - 13, 125, 13);
          ctx.fillStyle = '#a4b2b8';
          ctx.fillRect(sx - 36, groundY - 18, 73, 7);
          line(sx - 64, groundY - 170, sx - 64, groundY - 13, '#7f94a3', 4);
          for (let z = 0; z < 6; z++) {
            const yy = groundY - 24 - z * 24;
            line(sx - 82, yy, sx - 48, yy, '#627e90', 2);
            line(sx - 82, yy, sx - 48, yy - 24, '#3d6278', 1.5);
          }

          drawCurved(sx, sy, W * 0.37, H * 0.32, tx, ty, '#c5d5e068', 2, [7, 10]);
          const xy = (prog: number, dev: number) => ({
            x: sx + (tx - sx) * prog + (dev * 5.5 + l.guidance * 1.8) * Math.sin(prog * Math.PI),
            y: sy + (ty - sy) * prog - Math.sin(prog * Math.PI) * H * 0.13 - (l.guidance * 0.6) * Math.sin(prog * Math.PI),
          });

          const pos = xy(p, l.deviation);
          const angle = 0.1 + p * 0.79 + (l.guidance * Math.PI) / 110 + (l.roll * Math.PI * 0.2) / 180;
          const size = Math.min(124, H * 0.27);
          const tail = {
            x: pos.x - Math.sin(angle) * size * 0.44,
            y: pos.y + Math.cos(angle) * size * 0.44,
          };

          // Actual flight trail - live path of the rocket responding to steering
          ctx.beginPath();
          ctx.strokeStyle = Math.abs(l.deviation) > 12 ? '#f07975' : '#86dec9';
          ctx.lineWidth = 2.8;
          ctx.moveTo(sx, sy);
          for (const pt of (l.trail || []).filter((_, i) => i % 2 === 0)) {
            const q = xy(cap(pt.alt / 101, 0, 1), pt.dev);
            ctx.lineTo(q.x, q.y);
          }
          ctx.lineTo(tail.x, tail.y);
          ctx.stroke();

          drawRocket(pos.x, pos.y, size, angle, l.ignited && !l.cutoff);
          textAt('GROUND LAUNCH COMPLEX • SLC-41', W * 0.48, H * 0.91, '#a7c5d1', 11, 'left', '700');
          textAt('ALTITUDE ' + l.alt.toFixed(1) + ' KM', W * 0.64, H * 0.25, '#e3f0f5', 15, 'left', '700');
          textAt(
            `ĐƯỜNG BAY THỰC TẾ: ${l.guidance > 0 ? '+' : ''}${l.guidance}° GIMBAL • LỆCH ${l.deviation.toFixed(1)} U`,
            W * 0.64,
            H * 0.31,
            Math.abs(l.deviation) < 6 ? '#7ce4cc' : '#f09675',
            11,
            'left',
            '700'
          );
          textAt('101 KM / MECO', W * 0.8, H * 0.15, '#dfedf4', 11, 'right', '700');
          break;
        }

        case 'separation': {
          planet(W * 0.12, H * 1.15, Math.min(W, H) * 0.3, 'earth');
          drawCurved(W * 0.23, H * 0.82, W * 0.42, H * 0.26, W * 0.83, H * 0.24, '#bad2d075', 2, [7, 9]);

          const x = W * 0.53;
          const y = H * 0.46;
          const v = cur.sep;
          const age = ageOf('stage');
          drawCentaur(x, y, Math.min(H * 0.38, 180), 0.72);

          if (v.stage) {
            const z = Math.min(4, age);
            drawRocket(x - 48 - z * 23, y + 70 + z * z * 11, Math.min(115, H * 0.25), 1.35 + z * 0.24, false);
            pyroFlash(x - 25, y + 50, z);
          }
          if (v.fairing) {
            const q = Math.min(3, ageOf('fairing'));
            drawSprite(spritesRef.current.fair1, x + 32 + q * 24, y - 52 + q * 12, 36, 85, -0.6 - q * 0.18);
            drawSprite(spritesRef.current.fair2, x + 60 + q * 22, y - 55 + q * 18, 36, 85, 0.8 + q * 0.15);
            pyroFlash(x + 40, y - 50, q);
          }
          textAt('CENTAUR RL-10 • ' + (v.centaur ? 'IGNITED' : 'STANDBY'), W * 0.71, H * 0.28, '#e0e9ed', 12, 'center', '700');
          textAt('STAGE 1 ' + (v.stage ? 'RELEASED' : 'ATTACHED'), W * 0.3, H * 0.83, '#9fc9cf', 11);
          break;
        }

        case 'parking': {
          const x = W * 0.54;
          const y = H * 0.54;
          const r = Math.min(W, H) * 0.25;
          planet(x, y, r * 0.74, 'earth');
          ellipseStroke(x, y, r * 1.48, r * 1.11, '#c4d4e078', 2, [7, 9], -0.24);

          const drift = cur.orbit.confirmed ? (cur.orbit.apo - 185) * 0.3 : (cur.orbit.burn - 335) * 0.36;
          ellipseStroke(
            x + drift * 0.4,
            y + drift * 0.2,
            r * 1.48 + drift,
            r * 1.11 + drift * 0.5,
            '#7dded0a0',
            2.5,
            [],
            -0.24
          );

          const a = time * 0.35;
          const px = x + Math.cos(a) * (r * 1.48 + drift);
          const py = y + Math.sin(a) * (r * 1.11 + drift * 0.5);
          drawFairing(px, py, 58, a + Math.PI / 2);
          textAt('PAYLOAD FAIRING', px, py - 35, '#99cad6', 9, 'center', '700');
          textAt('TARGET 148 × 185 KM', W * 0.26, H * 0.19, '#cadfdf', 12, 'left', '700');
          textAt('ACTUAL ORBIT', W * 0.72, H * 0.84, '#7cdecf', 10, 'left', '700');
          break;
        }

        case 'tmi':
        case 'cruise': {
          const isT = cur.phase === 'tmi';
          const ex = { x: W * 0.17, y: H * 0.69 };
          const mars = { x: W * 0.86, y: H * 0.43 };
          planet(ex.x, ex.y, Math.min(W, H) * 0.12, 'earth');
          planet(mars.x, mars.y, Math.min(W, H) * 0.13, 'mars');

          const a = { x: ex.x + Math.min(W, H) * 0.1, y: ex.y - Math.min(W, H) * 0.06 };
          const d = { x: mars.x - Math.min(W, H) * 0.12, y: mars.y - Math.min(W, H) * 0.06 };
          const bNode = { x: W * 0.37, y: H * 0.16 };
          const cNode = { x: W * 0.65, y: H * 0.13 };

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.bezierCurveTo(bNode.x, bNode.y, cNode.x, cNode.y, d.x, d.y);
          ctx.setLineDash([8, 9]);
          ctx.strokeStyle = '#a8b9c870';
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.setLineDash([]);

          const active = isT ? cur.tmi.complete : cur.cruise.corrected;
          const start = motionTimes.current[cur.phase];
          const progress = active ? cap(start ? (performance.now() - start) / 6500 : 0, 0, 1) : 0;

          const targetAlong = Math.round(12 + cur.launch.deviation * 0.23);
          const targetLat = Math.round(-4 + cur.tmi.angle * 0.7 + cur.launch.deviation * 0.13);
          const alongDev = cur.cruise.along - targetAlong;
          const latDev = cur.cruise.lateral - targetLat;
          const missEst = Math.round(
            Math.abs(alongDev) * 11000 + Math.abs(latDev) * 20000 + cur.launch.deviation * 1500
          );

          const b2 = isT
            ? { ...bNode, y: bNode.y + cur.tmi.angle * 2 }
            : { x: bNode.x + alongDev * 2.2, y: bNode.y + latDev * 3.5 };
          const c2 = isT
            ? { ...cNode, y: cNode.y + cur.tmi.angle * 1.2 }
            : { x: cNode.x + alongDev * 1.5, y: cNode.y + latDev * 2.0 };

          if (active) v3Trail(a, b2, c2, d, progress);

          const hovering = !active ? Math.sin(time * 2.8) * 5 : 0;
          const pos = active ? v3Bezier(a, b2, c2, d, progress) : { x: a.x + 18, y: a.y - 14 + hovering };

          if (isT) {
            if (!cur.tmi.detached) {
              drawCentaur(pos.x, pos.y, Math.min(H * 0.25, 125), 1.0);
            } else {
              drawSatellite(pos.x, pos.y, Math.min(H * 0.19, 92), 0.22);
              if (progress < 0.95) {
                drawCentaur(pos.x - 56 - 36 * progress, pos.y + 34 + 55 * progress, Math.min(H * 0.16, 70), 1.15);
              }
            }
          } else {
            drawSatellite(pos.x, pos.y, Math.min(H * 0.19, 94), 0.1 + progress * 0.25);
          }

          if (isT) {
            textAt('CENTAUR → MARS TRANSFER', W * 0.52, H * 0.2, '#dcecf2', 12, 'center', '700');
            textAt(
              active ? `TRANSFER ${Math.round(progress * 100)}%` : 'AWAITING TRAJECTORY CONFIRMATION',
              W * 0.5,
              H * 0.85,
              '#8de2cf',
              11,
              'center',
              '700'
            );
          } else {
            // Stage 6 (MIDCOURSE NAVIGATION): Moved to bottom area so it does not collide with satellite trajectory
            textAt('MIDCOURSE NAVIGATION • HIỆU CHỈNH ĐƯỜNG BAY', W * 0.5, H * 0.76, '#dcecf2', 12, 'center', '700');
            textAt(
              `Δv DỌC: ${alongDev > 0 ? '+' : ''}${alongDev} m/s • Δv NGANG: ${latDev > 0 ? '+' : ''}${latDev} m/s`,
              W * 0.5,
              H * 0.80,
              Math.abs(alongDev) <= 1 && Math.abs(latDev) <= 1 ? '#7ce4cc' : '#f0ab75',
              11,
              'center',
              '700'
            );
            textAt(
              `SAI SỐ TIẾP CẬN DỰ KIẾN: ${missEst.toLocaleString('en-US')} KM (CHUẨN < 45.000 KM)`,
              W * 0.5,
              H * 0.84,
              missEst <= 45000 ? '#7ce4cc' : '#f07975',
              10,
              'center',
              '600'
            );
            textAt(
              active ? `TIẾP CẬN SAO HỎA: ${Math.round(progress * 100)}%` : 'AWAITING TRAJECTORY CONFIRMATION',
              W * 0.5,
              H * 0.88,
              '#8de2cf',
              11,
              'center',
              '700'
            );
          }
          break;
        }

        case 'capture': {
          const x = W * 0.53;
          const y = H * 0.54;
          const r = Math.min(W, H) * 0.22;
          planet(x, y, r, 'mars');

          const c = cur.capture;
          const need = cur.slot[3] === 1 ? 3 : 2;

          let cx = x;
          let cy = y;
          let outerRx = r * 1.38;
          let outerRy = r * 1.38;
          let orbitAngle = 0.04;
          let orbitColor = '#7addcc';

          if (!c.inserted) {
            // Sub-state 1: MOI (Mars Orbit Insertion)
            // Corridor strictly encompasses ALL valid controls: |burn - 940| <= 85 m/s and |angle| <= 6°
            // Outer envelope: rx = 2.58r, ry = 1.95r; Inner envelope: rx = 1.70r, ry = 1.28r
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(x, y, r * 2.58, r * 1.95, 0.04, 0, Math.PI * 2);
            ctx.ellipse(x, y, r * 1.70, r * 1.28, 0.04, Math.PI * 2, 0, true);
            ctx.fillStyle = 'rgba(74, 222, 128, 0.15)';
            ctx.fill();

            ctx.strokeStyle = 'rgba(74, 222, 128, 0.7)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.ellipse(x, y, r * 2.58, r * 1.95, 0.04, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(x, y, r * 1.70, r * 1.28, 0.04, 0, Math.PI * 2);
            ctx.stroke();

            // Nominal centerline (burn = 940 m/s, angle = 0°)
            ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.ellipse(x, y, r * 2.15, r * 1.60, 0.04, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            textAt('HÀNH LANG BẮT QUỸ ĐẠO AN TOÀN (MOI TARGET CORRIDOR)', x, H * 0.12, '#7ce4cc', 11, 'center', '700');
            textAt('DẢI Δv HỢP LỆ: 855 – 1025 M/S • GÓC: ±6°', x, H * 0.15, '#a7e8db', 9.5, 'center');

            const burnDelta = (c.burn - 940) / 190;
            outerRx = r * (2.15 - burnDelta * 0.65);
            outerRy = r * (1.60 - burnDelta * 0.40);
            orbitAngle = 0.04 + (c.angle * Math.PI) / 180;
            cx = x - Math.sin(orbitAngle) * (burnDelta * 18);
            cy = y - Math.cos(orbitAngle) * (c.angle * 2.2);

            const isBurnValid = Math.abs(c.burn - 940) <= 85 && Math.abs(c.angle) <= 6;
            const isBurnOptimal = Math.abs(c.burn - 940) <= 35 && Math.abs(c.angle) <= 2;
            orbitColor = isBurnOptimal ? '#7addcc' : isBurnValid ? '#82ebb3' : '#f07975';

            textAt(
              `MOI Δv: ${c.burn} m/s • GÓC: ${c.angle > 0 ? '+' : ''}${c.angle}° • ${
                isBurnOptimal
                  ? '✓ TỐI ƯU TRUNG TÂM HÀNH LANG'
                  : isBurnValid
                  ? '✓ TRONG HÀNH LANG AN TOÀN'
                  : '⚠ NGOÀI HÀNH LANG AN TOÀN (NGUY CƠ MẤT TÀU)'
              }`,
              x,
              H * 0.88,
              orbitColor,
              11,
              'center',
              '700'
            );
          } else if (c.passes < need) {
            // Sub-state 2: Aerobraking passes (Zone xanh đã được loại bỏ theo yêu cầu)
            textAt(
              `TIẾN TRÌNH HÃM KHÍ QUYỂN (LƯỢT ${c.passes + 1}/${need})`,
              x,
              H * 0.12,
              '#e7c0a4',
              11,
              'center',
              '700'
            );
            textAt('MỤC TIÊU: DÙNG LỰC CẢN KHÍ QUYỂN ĐỂ GIẢM ĐỘ CAO VIỄN ĐIỂM', x, H * 0.15, '#c4d9df', 9.5, 'center');

            const periNorm = (c.peri - 115) / 75;
            const rPeri = r * (1.08 + periNorm * 0.28);
            const rApo = r * (1.35 + Math.min(1, c.apo / 4500) * 0.85);
            outerRx = (rApo + rPeri) / 2;
            outerRy = Math.sqrt(rApo * rPeri);
            cx = x - (rApo - rPeri) * 0.42;
            orbitAngle = 0.05;

            const isOptimal = c.peri >= 140 && c.peri <= 165;
            const isSafe = c.peri >= 130 && c.peri <= 170;
            const isCritical = c.peri < 125;
            orbitColor = isOptimal ? '#7addcc' : isSafe ? '#82ebb3' : isCritical ? '#f07975' : '#f0be75';

            textAt(
              `PERIAPSIS HÃM: ${c.peri} KM • ${
                isOptimal
                  ? '✓ TỐI ƯU HÃM KHÍ QUYỂN'
                  : isSafe
                  ? '✓ HÀNH LANG AN TOÀN'
                  : isCritical
                  ? '⚠ QUÁ NHIỆT NGUY HIỂM (<125 KM)'
                  : '⚠ HÃM YẾU (>170 KM)'
              } • VIỄN ĐIỂM: ${c.apo.toLocaleString('en-US')} KM`,
              x,
              H * 0.88,
              orbitColor,
              11,
              'center',
              '700'
            );
          } else if (!c.finalized) {
            // Sub-state 3: Circularization
            // Target: 300 ± 25 km altitude, 93 ± 2° inclination.
            // Safe bounds: |trim - optTrim| <= 20 m/s. outerRx in [1.321r, 1.439r].
            // Zone covers r * 1.30 to r * 1.46.
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r * 1.46, 0, Math.PI * 2);
            ctx.arc(x, y, r * 1.30, 0, Math.PI * 2, true);
            ctx.fillStyle = 'rgba(74, 222, 128, 0.16)';
            ctx.fill();

            ctx.strokeStyle = 'rgba(74, 222, 128, 0.7)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(x, y, r * 1.46, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, r * 1.30, 0, Math.PI * 2);
            ctx.stroke();

            // Target nominal 300 km circular orbit line
            ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.arc(x, y, r * 1.38, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            textAt('VÙNG QUỸ ĐẠO KHOA HỌC MỤC TIÊU (300 ± 25 KM, 93 ± 2°)', x, H * 0.12, '#7ce4cc', 11, 'center', '700');
            textAt('HÀNH LANG ĐIỀU CHỈNH Δv & ĐỘ NGHIÊNG HỢP LỆ', x, H * 0.15, '#a7e8db', 9.5, 'center');

            const optTrim = Math.round((190 + Math.max(0, c.apo - 300) * 0.09) / 5) * 5;
            const trimDiff = (c.trim - optTrim) / 50;
            const targetR = r * 1.38;
            outerRx = targetR + trimDiff * 22;
            outerRy = targetR - Math.abs(trimDiff) * 12;

            const inclAngle = ((c.incl - 93) * Math.PI) / 180;
            orbitAngle = inclAngle;
            const squash = Math.max(0.65, Math.cos(inclAngle * 0.45));
            outerRy *= squash;

            const isTrimValid = Math.abs(c.trim - optTrim) <= 20;
            const isInclValid = Math.abs(c.incl - 93) <= 2;
            const isTargetGood = isTrimValid && isInclValid;
            const isTargetPerfect = Math.abs(c.trim - optTrim) <= 10 && Math.abs(c.incl - 93) <= 1;
            orbitColor = isTargetPerfect ? '#7addcc' : isTargetGood ? '#82ebb3' : '#f07975';

            textAt(
              `TRIM Δv: ${c.trim} m/s (Chuẩn: ~${optTrim}) • ĐỘ NGHIÊNG: ${c.incl}° (Chuẩn: 93°) • ${
                isTargetPerfect
                  ? '✓ QUỸ ĐẠO HOÀN HẢO'
                  : isTargetGood
                  ? '✓ TRONG HÀNH LANG MỤC TIÊU'
                  : '⚠ LỆCH VÙNG QUỸ ĐẠO MỤC TIÊU'
              }`,
              x,
              H * 0.88,
              orbitColor,
              11,
              'center',
              '700'
            );
          } else {
            // Sub-state 4: Finalized orbit
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r * 1.46, 0, Math.PI * 2);
            ctx.arc(x, y, r * 1.30, 0, Math.PI * 2, true);
            ctx.fillStyle = 'rgba(74, 222, 128, 0.16)';
            ctx.fill();

            ctx.strokeStyle = 'rgba(74, 222, 128, 0.7)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(x, y, r * 1.46, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, r * 1.30, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            textAt('MARS • QUỸ ĐẠO KHOA HỌC ĐÃ XÁC LẬP', x, H * 0.12, '#7ce4cc', 11, 'center', '700');
            textAt('300 KM POLAR SCIENCE ORBIT', x, H * 0.15, '#a7e8db', 9.5, 'center');

            outerRx = r * 1.38 + (c.finalAlt - 300) * 0.003;
            outerRy = r * 1.38 + (c.finalAlt - 300) * 0.003;
            orbitAngle = ((c.incl - 93) * Math.PI) / 180;
            orbitColor = '#7addcc';
            textAt(
              `QUỸ ĐẠO KHOA HỌC: ${Math.round(c.finalAlt)} KM • ${c.incl.toFixed(1)}° POLAR • TRẠNG THÁI TỐT`,
              x,
              H * 0.88,
              '#7addcc',
              11,
              'center',
              '700'
            );
          }

          ellipseStroke(cx, cy, outerRx, outerRy, orbitColor, 2.5, [], orbitAngle);
          const a = time * 0.42;
          const px = cx + outerRx * Math.cos(a) * Math.cos(orbitAngle) - outerRy * Math.sin(a) * Math.sin(orbitAngle);
          const py = cy + outerRx * Math.cos(a) * Math.sin(orbitAngle) + outerRy * Math.sin(a) * Math.cos(orbitAngle);
          drawSatellite(px, py, 77, -a * 0.1);
          break;
        }

        case 'science': {
          const r = Math.min(W, H) * 0.38;
          const x = W * 0.38;
          const y = H * 0.63;
          planet(x, y, r, 'mars');
          ellipseStroke(x, y, r * 1.24, r * 1.06, '#b9d7d975', 1.6, [4, 8], -0.32);
          drawSatellite(W * 0.69, H * 0.45, Math.min(230, W * 0.33), 0.07);
          drawCurved(W * 0.65, H * 0.57, W * 0.58, H * 0.72, W * 0.42, H * 0.88, '#71ebc4', 1.8, [5, 6]);
          textAt('SCIENCE CAPTURE ZONE', W * 0.68, H * 0.23, '#cbe0de', 11, 'center', '700');

          const imgs = cur.sat.images.slice(-6);
          const tx = W * 0.04;
          const thumbW = Math.min(75, Math.max(50, Math.floor((W * 0.45) / Math.max(1, imgs.length) - 6)));
          const thumbH = Math.round(thumbW * 0.77);
          for (let i = 0; i < imgs.length; i++) {
            const im = spritesRef.current['mars' + (imgs[i].region + 1)];
            const xx = tx + i * (thumbW + 10);
            const yy = H * 0.75;
            ctx.fillStyle = '#142f42';
            ctx.fillRect(xx - 1, yy - 1, thumbW + 2, thumbH + 2);
            if (im?.naturalWidth) {
              ctx.save();
              ctx.beginPath();
              ctx.rect(xx, yy, thumbW, thumbH);
              ctx.clip();
              ctx.drawImage(im, xx, yy, thumbW, thumbH);
              ctx.restore();
            }
            ctx.strokeStyle = '#84b2bb';
            ctx.strokeRect(xx, yy, thumbW, thumbH);
            textAt('IMG ' + String(imgs[i].id).padStart(2, '0'), xx, yy + thumbH + 13, '#9dd6cb', 9);
          }
          textAt('DEEP SPACE NETWORK • EARTH LINK', W * 0.61, H * 0.8, '#94b7cb', 9);
          break;
        }

        case 'end': {
          const x = W * 0.53;
          const y = H * 0.54;
          const r = Math.min(W, H) * 0.22;
          planet(x, y, r, 'mars');
          const good = cur.mission.result === 'success';
          ctx.fillStyle = '#071420cc';
          ctx.fillRect(W * 0.19, H * 0.38, W * 0.62, H * 0.23);
          textAt(
            good ? 'MISSION ACCOMPLISHED' : 'MISSION LOST',
            W * 0.5,
            H * 0.47,
            good ? '#aaf0d6' : '#ffb2a7',
            25,
            'center',
            '800'
          );
          textAt(
            good ? 'TRANSMISSION RECEIVED' : 'TRAJECTORY / SYSTEM FAILURE',
            W * 0.5,
            H * 0.53,
            '#c6dbe0',
            11,
            'center',
            '600'
          );
          break;
        }
      }

      // Visual corner guide marks
      const sMarker = 15;
      for (const [mx, my, dx, dy] of [
        [14, 80, 1, 1],
        [W - 14, 80, -1, 1],
        [14, H - 13, 1, -1],
        [W - 14, H - 13, -1, -1],
      ]) {
        line(mx, my, mx + dx * sMarker, my, '#91c7ca4a');
        line(mx, my, mx, my + dy * sMarker, '#91c7ca4a');
      }

      ctx.restore();
      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [build, launchFX, motionTimes]);

  const sceneName = {
    assembly: 'SPACECRAFT INTEGRATION BAY',
    launch: 'ATMOSPHERIC ASCENT',
    separation: 'STAGE SEPARATION / CENTAUR',
    parking: 'EARTH PARKING ORBIT',
    tmi: 'TRANS-MARS INJECTION',
    cruise: 'INTERPLANETARY CRUISE',
    capture: 'MARS ORBIT INSERTION',
    science: 'SURFACE RECONNAISSANCE',
    end: state.mission.result === 'success' ? 'MISSION ACCOMPLISHED' : 'MISSION TERMINATED',
  }[state.phase];

  const sceneSub = {
    assembly: 'MRO / ASSEMBLY MODEL',
    launch: 'REAL-TIME FLIGHT VECTOR',
    separation: 'SAFE DEPLOYMENT SEQUENCE',
    parking: 'PERIGEE 148 KM • APOGEE 185 KM',
    tmi: 'EARTH GRAVITY ESCAPE / MARS TRANSFER',
    cruise: 'EARTH → MARS / TRAJECTORY',
    capture: 'TARGET ALTITUDE 300 KM • POLAR ORBIT 93°',
    science: 'DEEP SPACE NETWORK / IMAGE DOWNLINK',
    end: 'END OF SIMULATION',
  }[state.phase];

  const overlayContent = {
    assembly: (
      <div className="assembly-specs-panel">
        <div className="overlay-head">ENGINEERING / LOADOUT</div>
        <div style={{ fontSize: 10, color: '#97b3c6', marginBottom: 6 }}>
          05 mô-đun cấu hình • Tên lửa: <strong style={{ color: '#dbe7ee' }}>{build.launcher.name}</strong>
        </div>
        <div className="specs-hud-grid">
          <div className="spec-hud-item">
            <span className="spec-hud-label">MASS</span>
            <span className="spec-hud-val">{build.mass.toLocaleString('en-US')} kg</span>
          </div>
          <div className="spec-hud-item">
            <span className="spec-hud-label">FOLDED WIDTH</span>
            <span className="spec-hud-val">{build.stowedWidth.toFixed(2)} m</span>
          </div>
          <div className="spec-hud-item">
            <span className="spec-hud-label">SOLAR CAPACITY</span>
            <span className="spec-hud-val">{build.gen} W</span>
          </div>
          <div className="spec-hud-item">
            <span className="spec-hud-label">BATTERY</span>
            <span className="spec-hud-val">{(build.opts[2].capacity || 0) * 28} Wh</span>
          </div>
        </div>
      </div>
    ),
    launch: (
      <>
        <div className="overlay-head">ASCENT GUIDANCE ACTIVE</div>
        Đường đứt mờ: quỹ đạo chuẩn
        <br />
        Đường liền xanh: đường bay thực tế
        <br />
        Mốc tách tầng: <b>101 km</b>
      </>
    ),
    separation: (
      <>
        <div className="overlay-head">SEPARATION SEQUENCE</div>
        MECO → Tách tầng 1 → Centaur
        <br />→ Tách fairing (≥ 101 km)
      </>
    ),
    parking: (
      <>
        <div className="overlay-head">ORBIT TARGET</div>
        PERIGEE 148 KM
        <br />
        APOGEE 185 KM
        <br />
        CENTAUR STAGE • RL-10
      </>
    ),
    tmi: (
      <>
        <div className="overlay-head">TRANSFER WINDOW • SIMULATED</div>
        Second burn → Earth escape
        <br />
        Separation of MRO from Centaur
      </>
    ),
    cruise: (
      <>
        <div className="overlay-head">MID-COURSE CORRECTION</div>
        Đường chấm: hành trình tối ưu
        <br />
        Điều chỉnh Δv dọc và ngang
        <br />
        Mục tiêu: <b>độ lệch &lt; 70,000 km</b>
      </>
    ),
    capture: (
      <>
        <div className="overlay-head">MARS ORBIT TARGET</div>
        Vùng zone xanh: hành lang điều khiển đúng
        <br />
        Độ cao mục tiêu: <b>300 ± 25 km</b>
        <br />
        Độ nghiêng mục tiêu: <b>93 ± 2°</b>
      </>
    ),
    science: (
      <>
        <div className="overlay-head">SCIENCE OPERATIONS</div>
        Đã mở cánh pin và ăng-ten từ pha cruise.
        <br />
        Quản lý pin, chụp ≥ {cap?.targetPhotos || 3} ảnh và truyền về Trái Đất.
      </>
    ),
    end: (
      <>
        <div className="overlay-head">FLIGHT RECORD SEALED</div>
        {state.mission.result === 'success' ? 'MISSION COMPLETED' : 'MISSION FAILED'}
      </>
    ),
  }[state.phase];

  const trackedObject =
    state.phase === 'launch' ||
    state.phase === 'separation' ||
    state.phase === 'parking' ||
    state.phase === 'tmi'
      ? 'ATLAS / CENTAUR'
      : 'MRO–28';

  const bottomTarget =
    state.phase === 'launch'
      ? 'TARGET APOGEE 101 KM'
      : state.phase === 'capture'
      ? 'TARGET MARS ALTITUDE 300 KM'
      : 'TRAJECTORY ASSIST / 2D SIMULATION';

  return (
    <div className="scene-shell">
      <div className="scene-bar">
        <div>
          <span className="scene-kicker">● VISUAL TELEMETRY</span>
          <strong id="sceneHeading">{sceneName}</strong>
        </div>
        <div id="sceneSub" className="scene-sub">
          {sceneSub}
        </div>
      </div>

      <div className="canvas-wrap">
        <canvas id="simCanvas" ref={canvasRef} aria-label="Mô phỏng chuyến bay từ Trái Đất tới Sao Hỏa" />
        <div id="sceneOverlay" className="scene-overlay">
          {overlayContent}
        </div>
        <div id="sceneBottom" className="scene-bottom">
          <span>
            TRACKED OBJECT <strong>{trackedObject}</strong>
          </span>
          <span>{bottomTarget}</span>
        </div>
      </div>
    </div>
  );
};
