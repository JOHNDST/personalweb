import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const ThreeDScene = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let frameId;
    const canvas = mountRef.current;
    const width  = canvas.clientWidth  || 800;
    const height = canvas.clientHeight || 600;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080c0a, 0.022);

    // ── Camera: isometric-ish orthographic ──
    const frust = 13;
    let asp = width / height;
    const cam = new THREE.OrthographicCamera(
      -frust * asp, frust * asp, frust, -frust, 0.1, 200
    );
    cam.position.set(20, 24, 20);
    cam.lookAt(0, 0, 0);

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0x0a1f12, 6));
    const sun = new THREE.DirectionalLight(0x22ff66, 1.2);
    sun.position.set(10, 20, 8);
    scene.add(sun);

    // ── Grid layout helpers ──
    // Grid runs from -10 to +10 on x and z
    const isRoad = (x, z) =>
      x === -10 || x === -5 || x === 0 || x === 5 || x === 10 ||
      z === -10 || z === -5 || z === 0 || z === 5 || z === 10;

    const isWater = (x, z) => x >= 6 && x <= 9 && z >= 6 && z <= 9;

    // GI already placed – realistic: near road intersections and courtyards
    const giActiveCoords = new Set([
      '1_1','1_-1','-1_1','-1_-1',
      '3_2','2_3','-3_-2','-2_-3',
      '4_-3','-4_3','3_-4','-3_4',
      '6_-1','-6_1','1_-6','-1_6',
      '7_2','-7_-2','2_-7','-2_7',
      '4_4','-4_-4',
      '8_-4','-8_4',
    ]);

    // GI candidate sites – where optimization may place new GI
    const giCandCoords = new Set([
      '2_1','1_2','-2_-1','-1_-2',
      '3_-1','-1_3','1_-3','-3_1',
      '4_1','1_4','-4_-1','-1_-4',
      '6_2','-6_-2','2_6','-2_-6',
      '7_-1','-7_1','1_-7','-1_7',
      '5_-3','-5_3','3_5','-3_-5',
      '8_1','-8_-1',
    ]);

    // Simple hash for building height variety
    const hash = (x, z) => ((x * 13 + z * 7 + x * z) & 0xff) / 255;

    // ── Shared geometries ──
    const geoFlat  = new THREE.BoxGeometry(0.92, 0.14, 0.92);
    const geoGI    = new THREE.BoxGeometry(0.88, 0.22, 0.88);
    const geoLow   = new THREE.BoxGeometry(0.84, 0.7,  0.84);
    const geoMid   = new THREE.BoxGeometry(0.80, 1.2,  0.80);
    const geoTall  = new THREE.BoxGeometry(0.76, 2.0,  0.76);
    const geoWater = new THREE.BoxGeometry(0.92, 0.06, 0.92);

    // Shared static materials
    const matRoad  = new THREE.MeshLambertMaterial({ color: 0x0c1a0f });
    const matBase  = new THREE.MeshLambertMaterial({ color: 0x0b1710 });
    const matBldgL = new THREE.MeshLambertMaterial({ color: 0x0e2212 });
    const matBldgM = new THREE.MeshLambertMaterial({ color: 0x102614 });
    const matBldgT = new THREE.MeshLambertMaterial({ color: 0x122a15 });
    const matWater = new THREE.MeshLambertMaterial({ color: 0x003b28, transparent: true, opacity: 0.9 });

    // Per-cell animated data for GI cells
    const giActiveCells = [];
    const giCandCells   = [];

    for (let x = -10; x <= 10; x++) {
      for (let z = -10; z <= 10; z++) {
        const key = `${x}_${z}`;

        if (isWater(x, z)) {
          const m = new THREE.Mesh(geoWater, matWater);
          m.position.set(x, 0, z);
          scene.add(m);
          continue;
        }

        if (isRoad(x, z)) {
          const m = new THREE.Mesh(geoFlat, matRoad);
          m.position.set(x, 0, z);
          scene.add(m);
          continue;
        }

        // Base ground tile for all non-road cells
        const base = new THREE.Mesh(geoFlat, matBase);
        base.position.set(x, 0, z);
        scene.add(base);

        if (giActiveCoords.has(key)) {
          const mat = new THREE.MeshLambertMaterial({
            color: 0x0e4520,
            emissive: 0x003a14,
            emissiveIntensity: 0.6,
          });
          const m = new THREE.Mesh(geoGI, mat);
          m.position.set(x, 0.18, z);
          scene.add(m);
          giActiveCells.push({ mesh: m, mat, phase: Math.random() * Math.PI * 2 });
          continue;
        }

        if (giCandCoords.has(key)) {
          const mat = new THREE.MeshLambertMaterial({
            color: 0x0a1e10,
            emissive: 0x001a08,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.75,
          });
          const m = new THREE.Mesh(geoGI, mat);
          m.position.set(x, 0.12, z);
          scene.add(m);
          giCandCells.push({
            mesh: m, mat,
            phase: Math.random() * Math.PI * 2,
            state: 'idle', // 'activating' | 'active'
            stateProgress: 0,
          });
          continue;
        }

        // Building – height based on distance from center & hash
        const h = hash(x, z);
        const distC = Math.max(Math.abs(x), Math.abs(z));
        let geo, mat;
        if (distC <= 4 && h > 0.5) {
          geo = geoTall; mat = matBldgT;
        } else if (distC <= 7 && h > 0.35) {
          geo = geoMid;  mat = matBldgM;
        } else {
          geo = geoLow;  mat = matBldgL;
        }
        const bldg = new THREE.Mesh(geo, mat);
        bldg.position.set(x, geo.parameters.height / 2 + 0.07, z);
        scene.add(bldg);
      }
    }

    // ── Pareto optimization nodes ──
    // These float above the grid representing the multi-objective solution front
    const paretoPos = [
      [-8, 4.5, -7], [-4, 3.8, -8], [0, 5.2, -6],
      [4, 4.0, -7],  [7, 4.8, -4], [-7, 3.5, 1],
      [3, 3.2, 4],
    ];
    const paretoMats = paretoPos.map(() =>
      new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.85 })
    );
    const paretoNodes = paretoPos.map((p, i) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), paretoMats[i]);
      m.position.set(...p);
      scene.add(m);
      return m;
    });

    // Pareto front edge lines
    const paretoEdges = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,3]];
    const edgeMats = paretoEdges.map(() =>
      new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.12 })
    );
    paretoEdges.forEach(([a, b], i) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...paretoPos[a]),
        new THREE.Vector3(...paretoPos[b]),
      ]);
      scene.add(new THREE.Line(geo, edgeMats[i]));
    });

    // ── Stormwater flow particles ──
    // Particles drift across the grid representing runoff
    const PC = 320;
    const pPos  = new Float32Array(PC * 3);
    const pVelX = new Float32Array(PC);
    const pVelZ = new Float32Array(PC);

    for (let i = 0; i < PC; i++) {
      pPos[i*3]   = (Math.random() - 0.5) * 20;
      pPos[i*3+1] = 0.2;
      pPos[i*3+2] = (Math.random() - 0.5) * 20;
      // Bias toward water body in +x +z quadrant
      const angle = Math.PI * 0.25 + (Math.random() - 0.5) * 1.2;
      const spd   = 0.008 + Math.random() * 0.012;
      pVelX[i] =  Math.cos(angle) * spd;
      pVelZ[i] =  Math.sin(angle) * spd;
    }

    const pGeo  = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat  = new THREE.PointsMaterial({
      color: 0x00bbaa, size: 0.09, transparent: true, opacity: 0.3,
    });
    scene.add(new THREE.Points(pGeo, pMat));

    // ── Optimization scheduler ──
    // Every few seconds, one candidate cell activates
    let nextActivation = 3.5;

    // ── Mouse ──
    let mx = 0, my = 0;
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      my = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    };
    // Listen on window so it works even when scene is background
    window.addEventListener('mousemove', onMove);

    // ── Animation loop ──
    let t = 0;
    const OR = 28;

    function tick() {
      frameId = requestAnimationFrame(tick);
      t += 0.01;

      // Camera slow orbit + mouse parallax
      const a = t * 0.014;
      cam.position.x = Math.cos(a) * OR + mx * 1.8;
      cam.position.z = Math.sin(a) * OR + my * 1.8;
      cam.position.y = 24 + my * 2;
      cam.lookAt(0, 0, 0);

      // GI active cells: slow green pulse
      giActiveCells.forEach(({ mesh, mat, phase }) => {
        const s = 0.5 + Math.sin(t * 1.6 + phase) * 0.45;
        mat.emissiveIntensity = 0.35 + s * 0.55;
        mat.color.setHex(s > 0.5 ? 0x135e2a : 0x0e4520);
        mesh.position.y = 0.18 + Math.sin(t * 1.6 + phase) * 0.03;
      });

      // GI candidate cells: dim flicker, or activation transition
      nextActivation -= 0.01;
      if (nextActivation <= 0) {
        // Pick a random idle candidate
        const idle = giCandCells.filter(c => c.state === 'idle');
        if (idle.length > 0) {
          idle[Math.floor(Math.random() * idle.length)].state = 'activating';
        }
        nextActivation = 3 + Math.random() * 3.5;
      }

      giCandCells.forEach((c) => {
        if (c.state === 'idle') {
          const f = 0.1 + Math.sin(t * 0.9 + c.phase) * 0.08;
          c.mat.emissiveIntensity = f;
          c.mat.opacity = 0.5 + f * 1.5;
        } else if (c.state === 'activating') {
          c.stateProgress = Math.min(c.stateProgress + 0.018, 1);
          const p = c.stateProgress;
          // Flash bright then settle
          const intensity = p < 0.5
            ? p * 2          // ramp up quickly
            : 1 - (p - 0.5); // partial fade — stays somewhat bright
          c.mat.emissiveIntensity = intensity * 1.4;
          c.mat.color.setHex(p > 0.4 ? 0x135e2a : 0x0a2e12);
          c.mat.opacity = 0.75 + p * 0.25;
          c.mesh.position.y = 0.12 + p * 0.06;
          if (c.stateProgress >= 1) {
            c.state = 'active';
            c.mat.emissive.setHex(0x003a14);
          }
        }
        // 'active' inherits the same as giActiveCells visually
        if (c.state === 'active') {
          const s = 0.4 + Math.sin(t * 1.6 + c.phase) * 0.4;
          c.mat.emissiveIntensity = 0.3 + s * 0.5;
        }
      });

      // Pareto nodes: pulse and scale
      paretoNodes.forEach((n, i) => {
        const s = 1 + Math.sin(t * 2.1 + i * 0.75) * 0.55;
        n.scale.setScalar(s);
        paretoMats[i].opacity = 0.45 + Math.sin(t * 2.1 + i * 0.75) * 0.4;
      });
      edgeMats.forEach((em, i) => {
        em.opacity = 0.05 + Math.sin(t * 1.4 + i * 0.6) * 0.07;
      });

      // Stormwater particles drift
      const pa = pGeo.attributes.position.array;
      for (let i = 0; i < PC; i++) {
        pa[i*3]   += pVelX[i];
        pa[i*3+2] += pVelZ[i];
        pa[i*3+1]  = 0.18 + Math.sin(t * 3 + i * 0.09) * 0.06;
        // Wrap around
        if (pa[i*3] > 11 || pa[i*3] < -11 || pa[i*3+2] > 11 || pa[i*3+2] < -11) {
          pa[i*3]   = (Math.random() - 0.5) * 20;
          pa[i*3+2] = (Math.random() - 0.5) * 20;
        }
      }
      pGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, cam);
    }
    tick();

    // ── Resize ──
    const onResize = () => {
      const w = canvas.parentElement?.clientWidth  || window.innerWidth;
      const h = canvas.parentElement?.clientHeight || window.innerHeight;
      asp = w / h;
      cam.left = -frust * asp; cam.right = frust * asp;
      cam.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={mountRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};
