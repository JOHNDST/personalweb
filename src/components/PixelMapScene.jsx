import React, { useRef, useEffect } from 'react';

// Pixel-art "site plan" background.
// Visualizes the three themes through imagery and interaction:
//   - Landscape architecture: the site grid (roads, buildings, water, open land)
//   - Green infrastructure: pulsing GI cells + candidate sites the DSS activates
//   - Decision support:     live Pareto front of habitat quality vs. runoff
//
// Mouse: hover cells for tooltip + crosshairs; click open land to plant GI;
// click a candidate site to immediately activate it. Both nudge the Pareto front.

const C = {
  bg:            '#ffffff',
  gridDot:       '#d4cfb6',
  road:          '#c8c1a8',
  roadLine:      '#8c8468',
  building:      '#2d2e28',
  buildingShade: '#5a5c52',
  buildingWin:   '#b8b4a0',
  water:         '#91bfc3',
  waterDeep:     '#699ba3',
  waterRipple:   '#cfe4e6',
  giActive:      '#4a8f3a',
  giActiveHi:    '#79c156',
  giCand:        '#c8dda2',
  giCandBorder:  '#7aa058',
  giNew:         '#235d19',
  particle:      '#4f93a0',
  ink:           '#1f2018',
  subink:        '#4c4d44',
  accent:        '#c45a3c',
  paperShadow:   'rgba(31,32,24,0.22)',
};

const CELL = 20;

export const PixelMapScene = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0, cols = 0, rows = 0;
    let grid = [];
    let particles = [];
    let ripples = [];
    let pareto = [];
    const mouse = { x: -999, y: -999, gx: -1, gy: -1, inside: false };
    let t = 0;
    let nextOpt = 200;
    let animId = 0;

    const hash = (x, y, salt = 0) => {
      let h = (x * 374761393 + y * 668265263 + salt * 1013904223) | 0;
      h = (h ^ (h >>> 13)) * 1274126177;
      return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
    };

    const build = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(320, Math.floor(r.width));
      H = Math.max(320, Math.floor(r.height));
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      cols = Math.ceil(W / CELL) + 1;
      rows = Math.ceil(H / CELL) + 1;

      grid = new Array(cols);

      for (let x = 0; x < cols; x++) {
        grid[x] = new Array(rows);
        for (let y = 0; y < rows; y++) {
          const isRoad = ((x + 3) % 7 === 0) || ((y + 2) % 6 === 0);

          let type;
          if (isRoad)   type = 'road';
          else {
            const r1 = hash(x, y, 1);
            if      (r1 < 0.34) type = 'building';
            else if (r1 < 0.44) type = 'gi-active';
            else if (r1 < 0.58) type = 'gi-cand';
            else                type = 'empty';
          }

          grid[x][y] = {
            type,
            phase: hash(x, y, 3) * Math.PI * 2,
            h:     0.4 + hash(x, y, 5) * 0.6,
            state: type === 'gi-cand' ? 'idle' : undefined,
            prog:  0,
          };
        }
      }

      particles = new Array(120);
      for (let i = 0; i < particles.length; i++) {
        particles[i] = spawnParticle();
      }

      // Pareto front: 7 solutions on a habitat-vs-runoff trade-off curve
      pareto = [];
      for (let i = 0; i < 7; i++) {
        pareto.push({
          hab: 0.22 + (i / 6) * 0.70 + (hash(i, 0, 11) - 0.5) * 0.06,
          run: 0.88 - (i / 6) * 0.72 + (hash(i, 0, 13) - 0.5) * 0.06,
          phase: hash(i, 0, 17) * Math.PI * 2,
        });
      }
      ripples = [];
    };

    const spawnParticle = () => ({
      x: -4 - Math.random() * 20,
      y: Math.random() * H * 0.75,
      vx: 0.25 + Math.random() * 0.35,
      vy: 0.15 + Math.random() * 0.25,
      life: 1,
    });

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.gx = Math.floor(mouse.x / CELL);
      mouse.gy = Math.floor(mouse.y / CELL);
      mouse.inside =
        mouse.x >= 0 && mouse.y >= 0 && mouse.x <= W && mouse.y <= H;
    };

    const onClick = (e) => {
      const r = canvas.getBoundingClientRect();
      const lx = e.clientX - r.left;
      const ly = e.clientY - r.top;
      if (lx < 0 || ly < 0 || lx > W || ly > H) return;
      const gx = Math.floor(lx / CELL);
      const gy = Math.floor(ly / CELL);
      const c = grid[gx]?.[gy];
      if (!c) return;
      if (c.type === 'building' || c.type === 'water' || c.type === 'road') return;
      if (c.type === 'gi-cand') {
        c.state = 'activating';
        c.prog = 0;
      } else if (c.type === 'empty') {
        c.type = 'gi-new';
      }
      ripples.push({ x: gx * CELL + CELL / 2, y: gy * CELL + CELL / 2, r: 2, life: 1 });
      pareto.forEach((p) => {
        p.hab = Math.min(1, p.hab + 0.012);
        p.run = Math.min(1, p.run + 0.012);
      });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', build);
    canvas.addEventListener('click', onClick);
    build();

    const drawBuilding = (x, y) => {
      const px = x * CELL;
      const py = y * CELL;
      ctx.fillStyle = C.buildingShade;
      ctx.fillRect(px + 3, py + 3, CELL - 4, CELL - 4);
      ctx.fillStyle = C.building;
      ctx.fillRect(px + 2, py + 2, CELL - 4, CELL - 4);
      ctx.fillStyle = C.buildingWin;
      for (let wy = 0; wy < 2; wy++) {
        for (let wx = 0; wx < 2; wx++) {
          const on = ((x * 3 + y * 5 + wx + wy + ((t / 40) | 0)) & 7) > 4;
          if (on) ctx.fillRect(px + 5 + wx * 6, py + 5 + wy * 6, 2, 2);
        }
      }
    };

    const drawRoad = (x, y) => {
      const px = x * CELL;
      const py = y * CELL;
      ctx.fillStyle = C.road;
      ctx.fillRect(px, py, CELL, CELL);
      ctx.fillStyle = C.roadLine;
      const hasH = grid[x - 1]?.[y]?.type === 'road' && grid[x + 1]?.[y]?.type === 'road';
      const hasV = grid[x]?.[y - 1]?.type === 'road' && grid[x]?.[y + 1]?.type === 'road';
      const ph = ((t / 4) | 0) % 6;
      if (hasH && ph < 3) ctx.fillRect(px + CELL / 2 - 1, py + CELL / 2, 2, 1);
      if (hasV && ph < 3) ctx.fillRect(px + CELL / 2, py + CELL / 2 - 1, 1, 2);
    };

    const drawWater = (x, y) => {
      const px = x * CELL;
      const py = y * CELL;
      ctx.fillStyle = C.waterDeep;
      ctx.fillRect(px, py, CELL, CELL);
      const s = Math.sin(t * 0.04 + (x + y) * 0.45);
      ctx.fillStyle = C.water;
      ctx.fillRect(px, py + (CELL / 2 + Math.round(s)) | 0, CELL, 1);
      if (s > 0.55) {
        ctx.fillStyle = C.waterRipple;
        ctx.fillRect(px + 4, py + 4, 2, 1);
        ctx.fillRect(px + CELL - 7, py + CELL - 6, 2, 1);
      }
    };

    const drawTree = (px, py, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(px + CELL / 2 - 1, py + 4, 2, 2);
      ctx.fillRect(px + 5, py + CELL - 8, 2, 2);
      ctx.fillRect(px + CELL - 7, py + CELL - 8, 2, 2);
    };

    const drawGIActive = (x, y, c) => {
      const px = x * CELL;
      const py = y * CELL;
      const s = 0.5 + Math.sin(t * 0.05 + c.phase) * 0.5;
      ctx.fillStyle = s > 0.6 ? C.giActiveHi : C.giActive;
      ctx.fillRect(px + 2, py + 2, CELL - 4, CELL - 4);
      drawTree(px, py, C.giNew);
    };

    const drawGICand = (x, y, c) => {
      const px = x * CELL;
      const py = y * CELL;
      if (c.state === 'activating') {
        c.prog = Math.min(1, c.prog + 0.012);
        const p = c.prog;
        ctx.globalAlpha = p;
        ctx.fillStyle = C.giActive;
        ctx.fillRect(px + 2, py + 2, CELL - 4, CELL - 4);
        ctx.globalAlpha = 1 - p;
        ctx.fillStyle = C.giCand;
        ctx.fillRect(px + 3, py + 3, CELL - 6, CELL - 6);
        ctx.globalAlpha = 1;
        if (c.prog >= 1) {
          c.type = 'gi-active';
          ripples.push({ x: px + CELL / 2, y: py + CELL / 2, r: 2, life: 0.7 });
        }
      } else {
        const s = 0.4 + Math.sin(t * 0.035 + c.phase) * 0.25;
        ctx.globalAlpha = s + 0.35;
        ctx.fillStyle = C.giCand;
        ctx.fillRect(px + 3, py + 3, CELL - 6, CELL - 6);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.giCandBorder;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.lineDashOffset = -(t / 4) | 0;
        ctx.strokeRect(px + 2.5, py + 2.5, CELL - 5, CELL - 5);
        ctx.setLineDash([]);
      }
    };

    const drawGINew = (x, y) => {
      const px = x * CELL;
      const py = y * CELL;
      ctx.fillStyle = C.giActiveHi;
      ctx.fillRect(px + 2, py + 2, CELL - 4, CELL - 4);
      ctx.fillStyle = C.giNew;
      ctx.fillRect(px + CELL / 2 - 1, py + 4, 2, 3);
      ctx.fillRect(px + 4, py + 7, 3, 3);
      ctx.fillRect(px + CELL - 7, py + 7, 3, 3);
    };

    const drawPanel = (ox, oy, w, h) => {
      ctx.fillStyle = C.paperShadow;
      ctx.fillRect(ox + 3, oy + 3, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.fillRect(ox, oy, w, h);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1;
      ctx.strokeRect(ox + 0.5, oy + 0.5, w - 1, h - 1);
    };

    const drawPareto = (ox, oy, w, h) => {
      drawPanel(ox, oy, w, h);

      ctx.fillStyle = C.ink;
      ctx.font = '10px "PixelHead", monospace';
      ctx.textBaseline = 'top';
      ctx.fillText('DECISION SUPPORT SYSTEM', ox + 8, oy + 7);
      ctx.fillStyle = C.subink;
      ctx.font = '8px "PixelNormal", monospace';
      ctx.fillText('pareto front · multi-objective', ox + 8, oy + 19);

      const ax = ox + 34, ay = oy + 36;
      const aw = w - 46, ah = h - 54;

      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax, ay + ah);
      ctx.lineTo(ax + aw, ay + ah);
      ctx.stroke();

      ctx.strokeStyle = C.subink;
      for (let i = 1; i <= 3; i++) {
        const tx = ax + (i / 4) * aw;
        const ty = ay + (i / 4) * ah;
        ctx.beginPath();
        ctx.moveTo(tx, ay + ah);
        ctx.lineTo(tx, ay + ah + 2);
        ctx.moveTo(ax - 2, ty);
        ctx.lineTo(ax, ty);
        ctx.stroke();
      }

      ctx.font = '7px "PixelNormal", monospace';
      ctx.fillStyle = C.subink;
      ctx.save();
      ctx.translate(ox + 14, ay + ah / 2 + 36);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('HABITAT QUALITY', 0, 0);
      ctx.restore();
      ctx.fillText('RUNOFF REDUCTION →', ax + aw - 74, ay + ah + 6);

      ctx.strokeStyle = C.giActive;
      ctx.lineWidth = 1;
      ctx.beginPath();
      pareto.forEach((p, i) => {
        const jx = Math.sin(t * 0.04 + p.phase) * 0.015;
        const jy = Math.cos(t * 0.04 + p.phase) * 0.015;
        const x = ax + (p.run + jx) * aw;
        const y = ay + (1 - (p.hab + jy)) * ah;
        if (i === 0) ctx.moveTo(x, y);
        else         ctx.lineTo(x, y);
      });
      ctx.stroke();

      pareto.forEach((p) => {
        const jx = Math.sin(t * 0.04 + p.phase) * 0.015;
        const jy = Math.cos(t * 0.04 + p.phase) * 0.015;
        const x = ax + (p.run + jx) * aw;
        const y = ay + (1 - (p.hab + jy)) * ah;
        const pulse = 0.5 + Math.sin(t * 0.08 + p.phase) * 0.5;
        ctx.fillStyle = pulse > 0.55 ? C.accent : C.giActive;
        ctx.fillRect(x - 2, y - 2, 4, 4);
      });
    };

    const drawLegend = (ox, oy) => {
      const items = [
        { col: C.giActive,   txt: 'GREEN INFRASTRUCTURE' },
        { col: C.giCand,     txt: 'CANDIDATE SITE' },
        { col: C.building,   txt: 'BUILDING' },
        { col: C.waterDeep,  txt: 'WATER BODY' },
        { col: C.particle,   txt: 'STORMWATER FLOW' },
      ];
      const w = 180;
      const h = items.length * 14 + 28;
      drawPanel(ox, oy, w, h);

      ctx.fillStyle = C.ink;
      ctx.font = '9px "PixelHead", monospace';
      ctx.textBaseline = 'top';
      ctx.fillText('LEGEND · SITE PLAN', ox + 8, oy + 7);

      ctx.font = '8px "PixelNormal", monospace';
      items.forEach((it, i) => {
        const sy = oy + 22 + i * 14;
        ctx.fillStyle = it.col;
        ctx.fillRect(ox + 8, sy, 10, 10);
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 1;
        ctx.strokeRect(ox + 7.5, sy - 0.5, 11, 11);
        ctx.fillStyle = C.ink;
        ctx.fillText(it.txt, ox + 24, sy + 2);
      });
    };

    const drawHint = (ox, oy) => {
      const lines = [
        'CLICK OPEN LAND → PLANT GI',
        'CLICK CANDIDATE → ACTIVATE',
      ];
      ctx.font = '9px "PixelNormal", monospace';
      ctx.textBaseline = 'top';
      ctx.fillStyle = C.subink;
      lines.forEach((ln, i) => ctx.fillText(ln, ox, oy + i * 12));
    };

    const drawTooltip = (gx, gy) => {
      const c = grid[gx]?.[gy];
      if (!c) return;
      const labels = {
        empty:       'OPEN LAND · click to plant GI',
        road:        'ROAD NETWORK',
        water:       'WATER BODY',
        building:    'BUILDING',
        'gi-active': 'GREEN INFRASTRUCTURE',
        'gi-cand':   'GI CANDIDATE · click to activate',
        'gi-new':    'GI PLANTED',
      };
      const label = labels[c.type] || c.type.toUpperCase();
      ctx.font = '10px "PixelNormal", monospace';
      const tw = ctx.measureText(label).width;
      let lx = mouse.x + 14;
      let ly = mouse.y + 8;
      if (lx + tw + 10 > W) lx = mouse.x - tw - 18;
      if (ly + 18 > H) ly = mouse.y - 22;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillRect(lx, ly, tw + 10, 16);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1;
      ctx.strokeRect(lx + 0.5, ly + 0.5, tw + 9, 15);
      ctx.fillStyle = C.ink;
      ctx.textBaseline = 'top';
      ctx.fillText(label, lx + 5, ly + 3);
    };

    const tick = () => {
      animId = requestAnimationFrame(tick);
      t += 1;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // Paper dot pattern
      ctx.fillStyle = C.gridDot;
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          if ((x + y) & 1) continue;
          ctx.fillRect(x * CELL + CELL / 2, y * CELL + CELL / 2, 1, 1);
        }
      }

      // Base cells
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          const c = grid[x][y];
          switch (c.type) {
            case 'road':      drawRoad(x, y); break;
            case 'water':     drawWater(x, y); break;
            case 'building':  drawBuilding(x, y); break;
            case 'gi-active': drawGIActive(x, y, c); break;
            case 'gi-cand':   drawGICand(x, y, c); break;
            case 'gi-new':    drawGINew(x, y); break;
            default: break;
          }
        }
      }

      // Stormwater particles — absorbed by GI cells
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.004;
        const cg = grid[(p.x / CELL) | 0]?.[(p.y / CELL) | 0];
        if (cg && (cg.type === 'gi-active' || cg.type === 'gi-new')) {
          p.life -= 0.08;
        }
        if (p.x > W || p.y > H || p.life <= 0) {
          Object.assign(p, spawnParticle());
          continue;
        }
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life)) * 0.7;
        ctx.fillStyle = C.particle;
        ctx.fillRect(p.x | 0, p.y | 0, 2, 2);
      }
      ctx.globalAlpha = 1;

      // DSS scheduler: periodically activate a random candidate
      nextOpt -= 1;
      if (nextOpt <= 0) {
        const idle = [];
        for (let x = 0; x < cols; x++) {
          for (let y = 0; y < rows; y++) {
            const c = grid[x][y];
            if (c.type === 'gi-cand' && c.state === 'idle') idle.push(c);
          }
        }
        if (idle.length) {
          const pick = idle[(Math.random() * idle.length) | 0];
          pick.state = 'activating';
          pick.prog = 0;
        }
        nextOpt = 220 + Math.random() * 280;
      }

      // Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.r += 1.5;
        r.life -= 0.018;
        if (r.life <= 0) { ripples.splice(i, 1); continue; }
        ctx.globalAlpha = r.life * 0.7;
        ctx.strokeStyle = C.giNew;
        ctx.lineWidth = 1;
        ctx.strokeRect(r.x - r.r, r.y - r.r, r.r * 2, r.r * 2);
      }
      ctx.globalAlpha = 1;

      // Cursor highlight + crosshairs
      if (mouse.inside && grid[mouse.gx]?.[mouse.gy]) {
        const px = mouse.gx * CELL;
        const py = mouse.gy * CELL;
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = C.giNew;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + CELL / 2, 0);
        ctx.lineTo(px + CELL / 2, H);
        ctx.moveTo(0, py + CELL / 2);
        ctx.lineTo(W, py + CELL / 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.giNew;
        ctx.setLineDash([3, 2]);
        ctx.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);
        ctx.setLineDash([]);
      }


      if (mouse.inside) drawTooltip(mouse.gx, mouse.gy);
    };
    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', build);
      canvas.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
    />
  );
};
