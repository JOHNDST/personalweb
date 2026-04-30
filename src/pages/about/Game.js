import React, { useState, useEffect, useRef, useMemo } from "react";
import { RetroWindow } from "../../components/retro/RetroWindow";
import { RetroButton } from "../../components/retro/RetroButton";
import iconTemperature from "../../assets/images/game-icons/icon_temperature.png";
import iconRunoff from "../../assets/images/game-icons/icon_runoff.png";
import iconAccess from "../../assets/images/game-icons/icon_access.png";
import iconGrow from "../../assets/images/game-icons/icon_grow.png";
import iconCoin from "../../assets/images/game-icons/icon_coin.png";

const TREE_COST = 20;
const INITIAL_BUDGET = 200;

export function GamePage() {
  const [player, setPlayer] = useState({ x: 0, y: 0 });
  const [tiles, setTiles] = useState(new Map());
  const [selectedMode, setSelectedMode] = useState("plant"); // "plant" | "build"
  const [score, setScore] = useState({ planted: 0, cut: 0, built: 0, demolished: 0 });
  const [budget, setBudget] = useState(INITIAL_BUDGET);
  const [showLST, setShowLST] = useState(false);
  const [showRunoff, setShowRunoff] = useState(false);
  const [showAccess, setShowAccess] = useState(false);
  const [showLSTParams, setShowLSTParams] = useState(false);
  const [showRunoffParams, setShowRunoffParams] = useState(false);
  const [showAccessParams, setShowAccessParams] = useState(false);

  const [lstParams, setLstParams] = useState({
    windDirection: 45,
    windAmplitude: 0.5,
    coolingDecay: 0.05,
    heatIntensity: 4.0,
  });
  const [runoffParams, setRunoffParams] = useState({
    slopeDirection: 135,
    infiltrationRate: 0.7,
  });
  const [accessParams, setAccessParams] = useState({
    baseRadius: 5,
  });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize tiles around starting position with 5 random buildings
  useEffect(() => {
    const initialTiles = new Map();
    for (let x = -5; x <= 5; x++) {
      for (let y = -5; y <= 5; y++) {
        const key = `${x},${y}`;
        initialTiles.set(key, { x, y, hasTree: false, treeAge: 0, hasBuilding: false });
      }
    }
    // Place 5 random buildings, avoiding the player start tile (0,0)
    const candidates = Array.from(initialTiles.keys()).filter(k => k !== "0,0");
    candidates.sort(() => Math.random() - 0.5);
    candidates.slice(0, 5).forEach(key => {
      const t = initialTiles.get(key);
      initialTiles.set(key, { ...t, hasBuilding: true });
    });
    setTiles(initialTiles);
  }, []);

  // Handle canvas resize
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // Ensure tiles exist around player
  useEffect(() => {
    const newTiles = new Map(tiles);
    let added = false;
    for (let x = player.x - 5; x <= player.x + 5; x++) {
      for (let y = player.y - 5; y <= player.y + 5; y++) {
        const key = `${x},${y}`;
        if (!newTiles.has(key)) {
          newTiles.set(key, { x, y, hasTree: false, treeAge: 0, hasBuilding: false });
          added = true;
        }
      }
    }
    if (added) setTiles(newTiles);
  }, [player]);

  // --- Simulation Logic (Memoized) ---

  const simData = useMemo(() => {
    const calculateDistanceToNearest = (x, y, targetSet) => {
      if (targetSet.size === 0) return Infinity;
      let minDist = Infinity;
      targetSet.forEach(key => {
        const [targetX, targetY] = key.split(',').map(Number);
        const dist = Math.sqrt((x - targetX) ** 2 + (y - targetY) ** 2);
        minDist = Math.min(minDist, dist);
      });
      return minDist;
    };

    const calculateWindMultiplier = (x, y, center, amplitude, windDirectionDeg) => {
      const windDirectionRad = windDirectionDeg * (Math.PI / 180);
      const dx = x - center.x;
      const dy = center.y - y;
      if (dx === 0 && dy === 0) return 1.0;
      const thetaGS = Math.atan2(dy, dx);
      const theta = thetaGS - windDirectionRad;
      return 1.0 + amplitude * Math.cos(theta);
    };

    const runLST = () => {
      const T_BASE = 30.0;
      const C_BASE = 1.0;
      const C_SIZE_SAPLING = 0.3;
      const C_SIZE_MATURE = 0.7;
      const K_HEAT_DECAY = 0.1;

      const saplingTiles = new Set();
      const matureTiles = new Set();
      const buildingTiles = new Set();

      tiles.forEach((tile, key) => {
        if (tile.hasTree) {
          if (tile.treeAge === 1) saplingTiles.add(key);
          else matureTiles.add(key);
        }
        if (tile.hasBuilding) buildingTiles.add(key);
      });

      const calculateCoolingData = (treeSet, sizeCoeff) => {
        if (treeSet.size === 0) return { center: null, iMax: 0 };
        let totalX = 0, totalY = 0;
        treeSet.forEach(key => {
          const [x, y] = key.split(',').map(Number);
          totalX += x; totalY += y;
        });
        const center = { x: totalX / treeSet.size, y: totalY / treeSet.size };
        const iMax = C_BASE + sizeCoeff * Math.sqrt(treeSet.size);
        return { center, iMax };
      };

      const saplingData = calculateCoolingData(saplingTiles, C_SIZE_SAPLING);
      const matureData = calculateCoolingData(matureTiles, C_SIZE_MATURE);

      const resultMap = new Map();
      let totalCooling = 0;
      let cellCount = 0;

      tiles.forEach((tile, key) => {
        let deltaTCool = 0;
        let deltaTHeat = 0;

        if (saplingTiles.size > 0) {
          const dist = calculateDistanceToNearest(tile.x, tile.y, saplingTiles);
          if (tile.hasTree && tile.treeAge === 1) deltaTCool += saplingData.iMax;
          else if (dist !== Infinity && saplingData.center) {
            const dAtt = Math.exp(-lstParams.coolingDecay * dist);
            const wMult = calculateWindMultiplier(tile.x, tile.y, saplingData.center, lstParams.windAmplitude, lstParams.windDirection);
            deltaTCool += saplingData.iMax * dAtt * wMult;
          }
        }

        if (matureTiles.size > 0) {
          const dist = calculateDistanceToNearest(tile.x, tile.y, matureTiles);
          if (tile.hasTree && tile.treeAge > 1) deltaTCool += matureData.iMax;
          else if (dist !== Infinity && matureData.center) {
            const dAtt = Math.exp(-lstParams.coolingDecay * dist);
            const wMult = calculateWindMultiplier(tile.x, tile.y, matureData.center, lstParams.windAmplitude, lstParams.windDirection);
            deltaTCool += matureData.iMax * dAtt * wMult;
          }
        }

        if (buildingTiles.size > 0) {
          const dist = calculateDistanceToNearest(tile.x, tile.y, buildingTiles);
          if (tile.hasBuilding) deltaTHeat = lstParams.heatIntensity;
          else if (dist !== Infinity) {
            deltaTHeat = lstParams.heatIntensity * Math.exp(-K_HEAT_DECAY * dist);
          }
        }

        const finalLST = T_BASE + deltaTHeat - deltaTCool;
        resultMap.set(key, finalLST);
        totalCooling += deltaTCool;
        cellCount++;
      });

      return { map: resultMap, avgCooling: cellCount > 0 ? totalCooling / cellCount : 0 };
    };

    const runAccess = () => {
      const baseRadius = accessParams.baseRadius;
      const visited = new Set();
      const clusters = [];

      tiles.forEach((tile, key) => {
        if (tile.hasTree && !visited.has(key)) {
          const cluster = { cells: [], size: 0, maxRadius: 0 };
          const queue = [{ x: tile.x, y: tile.y }];
          visited.add(key);
          cluster.cells.push({ x: tile.x, y: tile.y });

          while (queue.length > 0) {
            const curr = queue.pop();
            [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dx, dy]) => {
              const nx = curr.x + dx, ny = curr.y + dy;
              const nKey = `${nx},${ny}`;
              const neighborTile = tiles.get(nKey);
              if (neighborTile && neighborTile.hasTree && !visited.has(nKey)) {
                visited.add(nKey);
                queue.push({ x: nx, y: ny });
                cluster.cells.push({ x: nx, y: ny });
              }
            });
          }
          cluster.size = cluster.cells.length;
          cluster.maxRadius = baseRadius + Math.floor(Math.sqrt(cluster.size));
          clusters.push(cluster);
        }
      });

      const resultMap = new Map();
      let buildingAccessSum = 0;
      let buildingCount = 0;

      tiles.forEach((tile, key) => {
        if (tile.hasTree) { resultMap.set(key, 1.0); return; }

        let maxScore = 0;
        clusters.forEach(cluster => {
          let minDistSq = Infinity;
          cluster.cells.forEach(gc => {
            const d2 = (tile.x - gc.x) ** 2 + (tile.y - gc.y) ** 2;
            if (d2 < minDistSq) minDistSq = d2;
          });
          const dist = Math.sqrt(minDistSq);
          if (dist < cluster.maxRadius) {
            const s = 1.0 - (dist / cluster.maxRadius) ** 2;
            if (s > maxScore) maxScore = s;
          }
        });

        resultMap.set(key, maxScore);
        if (tile.hasBuilding) { buildingAccessSum += maxScore; buildingCount++; }
      });

      return { map: resultMap, avgAccess: buildingCount > 0 ? buildingAccessSum / buildingCount : 0 };
    };

    const runRunoff = () => {
      const R_URBAN = 1.0, R_BUILDING = 1.5, R_GREEN = 0.2;
      const rad = runoffParams.slopeDirection * (Math.PI / 180);
      const flowVecX = Math.cos(rad), flowVecY = -Math.sin(rad);
      const infiltration = runoffParams.infiltrationRate;

      const cellsArray = [];
      tiles.forEach((tile, key) => {
        const score = tile.x * flowVecX + tile.y * flowVecY;
        let gen = R_URBAN;
        if (tile.hasTree) gen = R_GREEN;
        if (tile.hasBuilding) gen = R_BUILDING;
        cellsArray.push({ key, x: tile.x, y: tile.y, score, runoffAccum: gen, tempInflow: 0, hasTree: tile.hasTree, hasBuilding: tile.hasBuilding });
      });
      cellsArray.sort((a, b) => a.score - b.score);

      const routeFlow = (cells) => {
        cells.forEach(item => {
          let totalWater = item.runoffAccum + item.tempInflow;
          if (item.hasTree) totalWater *= (1.0 - infiltration);
          item.runoffAccum = totalWater;

          const neighbors = [];
          let totalWeight = 0;
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              if (dx === 0 && dy === 0) continue;
              const nx = item.x + dx, ny = item.y + dy;
              const neighborScore = nx * flowVecX + ny * flowVecY;
              if (neighborScore > item.score) {
                const diff = neighborScore - item.score;
                const neighborItem = cells.find(c => c.key === `${nx},${ny}`);
                if (neighborItem) neighbors.push({ item: neighborItem, weight: diff });
                totalWeight += diff;
              }
            }
          }
          if (neighbors.length > 0 && totalWeight > 0) {
            neighbors.forEach(n => { n.item.tempInflow += totalWater * (n.weight / totalWeight); });
          }
        });
      };

      routeFlow(cellsArray);

      const cellsNoTrees = cellsArray.map(item => ({
        ...item,
        runoffAccum: item.hasBuilding ? R_BUILDING : R_URBAN,
        tempInflow: 0,
      }));
      routeFlow(cellsNoTrees);

      let totalReduction = 0;
      cellsArray.forEach((item, idx) => { totalReduction += cellsNoTrees[idx].runoffAccum - item.runoffAccum; });

      const resultMap = new Map();
      cellsArray.forEach(item => resultMap.set(item.key, item.runoffAccum));
      return { map: resultMap, avgReduction: cellsArray.length > 0 ? totalReduction / cellsArray.length : 0 };
    };

    return { lst: runLST(), access: runAccess(), runoff: runRunoff() };
  }, [tiles, lstParams, runoffParams, accessParams]);

  // --- Drawing helpers ---

  const createDitherPattern = (density) => {
    const pc = document.createElement("canvas");
    pc.width = 4; pc.height = 4;
    const pctx = pc.getContext("2d");
    if (!pctx) return pc;
    pctx.fillStyle = "#ffffff"; pctx.fillRect(0, 0, 4, 4);
    pctx.fillStyle = "#000000";
    if (density === 1) {
      pctx.fillRect(0, 0, 1, 1); pctx.fillRect(2, 2, 1, 1);
    } else if (density === 2) {
      pctx.fillRect(0, 0, 1, 1); pctx.fillRect(2, 1, 1, 1);
      pctx.fillRect(1, 2, 1, 1); pctx.fillRect(3, 3, 1, 1);
    } else if (density === 3) {
      pctx.fillRect(0, 0, 4, 4);
      pctx.fillStyle = "#ffffff";
      pctx.fillRect(1, 0, 1, 1); pctx.fillRect(3, 1, 1, 1);
      pctx.fillRect(0, 2, 1, 1); pctx.fillRect(2, 3, 1, 1);
    }
    return pc;
  };

  const drawPixelTree = (ctx, x, y, age, outlineOnly = false) => {
    if (age === 1) {
      if (!outlineOnly) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(x - 1, y - 8, 2, 8);
        ctx.fillRect(x - 3, y - 6, 2, 2);
        ctx.fillRect(x + 1, y - 6, 2, 2);
      } else {
        ctx.strokeStyle = "#000000"; ctx.lineWidth = 1;
        ctx.strokeRect(x - 1, y - 8, 2, 8);
        ctx.strokeRect(x - 3, y - 6, 2, 2);
        ctx.strokeRect(x + 1, y - 6, 2, 2);
      }
    } else if (age === 2) {
      ctx.strokeStyle = "#000000"; ctx.lineWidth = 1;
      if (!outlineOnly) { ctx.fillStyle = "#000000"; ctx.fillRect(x - 2, y - 16, 4, 16); }
      else ctx.strokeRect(x - 2, y - 16, 4, 16);
      ctx.strokeRect(x - 8, y - 24, 16, 12);
      if (!outlineOnly) {
        const dp = ctx.createPattern(createDitherPattern(2), "repeat");
        if (dp) { ctx.fillStyle = dp; ctx.fillRect(x - 8, y - 24, 16, 12); }
      }
    } else if (age >= 3) {
      ctx.strokeStyle = "#000000"; ctx.lineWidth = 1;
      if (!outlineOnly) { ctx.fillStyle = "#000000"; ctx.fillRect(x - 3, y - 24, 6, 24); }
      else ctx.strokeRect(x - 3, y - 24, 6, 24);
      ctx.strokeRect(x - 14, y - 36, 28, 16);
      if (!outlineOnly) {
        const dp1 = ctx.createPattern(createDitherPattern(1), "repeat");
        const dp2 = ctx.createPattern(createDitherPattern(3), "repeat");
        if (dp1) { ctx.fillStyle = dp1; ctx.fillRect(x - 14, y - 36, 28, 16); }
        if (dp2) { ctx.fillStyle = dp2; ctx.fillRect(x - 10, y - 32, 20, 12); }
      }
    }
  };

  const drawPixelBuilding = (ctx, x, y, outlineOnly = false) => {
    ctx.strokeStyle = "#000000"; ctx.lineWidth = 1;
    ctx.strokeRect(x - 10, y - 28, 20, 28);
    if (!outlineOnly) {
      ctx.fillStyle = "#000000"; ctx.fillRect(x - 10, y - 28, 20, 28);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 7, y - 24, 4, 4); ctx.fillRect(x + 3, y - 24, 4, 4);
      ctx.fillRect(x - 7, y - 16, 4, 4); ctx.fillRect(x + 3, y - 16, 4, 4);
      ctx.fillRect(x - 7, y - 8,  4, 4); ctx.fillRect(x + 3, y - 8,  4, 4);
    } else {
      ctx.strokeRect(x - 7, y - 24, 4, 4); ctx.strokeRect(x + 3, y - 24, 4, 4);
      ctx.strokeRect(x - 7, y - 16, 4, 4); ctx.strokeRect(x + 3, y - 16, 4, 4);
      ctx.strokeRect(x - 7, y - 8,  4, 4); ctx.strokeRect(x + 3, y - 8,  4, 4);
    }
  };

  const getLSTColor = (lst) => {
    const T_BASE = 30.0, minTemp = T_BASE - 5, maxTemp = T_BASE + 5;
    const colorStops = [
      { temp: minTemp,     color: [74,  211, 74]  },
      { temp: T_BASE - 1, color: [195, 245, 167] },
      { temp: T_BASE,     color: [240, 240, 240] },
      { temp: T_BASE + 1, color: [247, 150, 74]  },
      { temp: maxTemp,    color: [255, 87,  87]  },
    ];
    const clamped = Math.max(minTemp, Math.min(lst, maxTemp));
    for (let i = 0; i < colorStops.length - 1; i++) {
      const s1 = colorStops[i], s2 = colorStops[i + 1];
      if (clamped >= s1.temp && clamped <= s2.temp) {
        const r = (clamped - s1.temp) / (s2.temp - s1.temp);
        const mix = (a, b) => Math.round(a + (b - a) * r);
        return `rgb(${mix(s1.color[0], s2.color[0])},${mix(s1.color[1], s2.color[1])},${mix(s1.color[2], s2.color[2])})`;
      }
    }
    return "rgb(240,240,240)";
  };

  const getRunoffColor = (runoff) => {
    const ratio = Math.min(runoff / 10.0, 1.0);
    const r = Math.round(255 + (59  - 255) * ratio);
    const g = Math.round(255 + (130 - 255) * ratio);
    const b = Math.round(255 + (246 - 255) * ratio);
    return `rgb(${r},${g},${b})`;
  };

  const getAccessColor = (score, isGreen) => {
    if (isGreen) return "#16a34a";
    const r = Math.round(255 + (126 - 255) * score);
    const g = Math.round(255 + (34  - 255) * score);
    const b = Math.round(255 + (206 - 255) * score);
    return `rgb(${r},${g},${b})`;
  };

  // Draw isometric world
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tileWidth = 32, tileHeight = 16;
    const centerX = canvas.width / 2, centerY = canvas.height / 2;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const toIso = (x, y) => {
      const relX = x - player.x, relY = y - player.y;
      return {
        x: centerX + (relX - relY) * (tileWidth / 2),
        y: centerY + (relX + relY) * (tileHeight / 2),
      };
    };

    const sortedTiles = Array.from(tiles.values()).sort((a, b) => (a.x + a.y) - (b.x + b.y));
    const groundPattern = ctx.createPattern(createDitherPattern(1), "repeat");

    sortedTiles.forEach(tile => {
      const pos = toIso(tile.x, tile.y);
      const key = `${tile.x},${tile.y}`;
      if (pos.x < -50 || pos.x > canvas.width + 50 || pos.y < -50 || pos.y > canvas.height + 50) return;

      ctx.strokeStyle = "#000000"; ctx.lineWidth = 1;

      let fillStyle;
      if (showLST) {
        const val = simData.lst.map.get(key);
        if (val !== undefined) fillStyle = getLSTColor(val);
      } else if (showRunoff) {
        const val = simData.runoff.map.get(key);
        if (val !== undefined) fillStyle = getRunoffColor(val);
      } else if (showAccess) {
        const val = simData.access.map.get(key);
        if (val !== undefined) fillStyle = getAccessColor(val, tile.hasTree);
      }
      if (!fillStyle) fillStyle = (tile.hasTree || tile.hasBuilding) ? "#000000" : (groundPattern || "#ffffff");

      ctx.fillStyle = fillStyle;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + tileWidth / 2, pos.y + tileHeight / 2);
      ctx.lineTo(pos.x, pos.y + tileHeight);
      ctx.lineTo(pos.x - tileWidth / 2, pos.y + tileHeight / 2);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      if (tile.hasTree && tile.treeAge > 0 && !showLST && !showRunoff && !showAccess)
        drawPixelTree(ctx, pos.x, pos.y, tile.treeAge);
      if (tile.hasBuilding && !showLST && !showRunoff && !showAccess)
        drawPixelBuilding(ctx, pos.x, pos.y);
      if (showLST || showRunoff || showAccess) {
        if (tile.hasTree && tile.treeAge > 0) drawPixelTree(ctx, pos.x, pos.y, tile.treeAge, true);
        if (tile.hasBuilding) drawPixelBuilding(ctx, pos.x, pos.y, true);
      }
    });

    // Player
    const pp = { x: centerX, y: centerY };
    const playerDither = ctx.createPattern(createDitherPattern(3), "repeat");
    if (playerDither) { ctx.fillStyle = playerDither; ctx.fillRect(pp.x - 6, pp.y - 20, 12, 16); }
    ctx.fillStyle = "#000000"; ctx.fillRect(pp.x - 4, pp.y - 24, 8, 8);
    ctx.strokeStyle = "#000000"; ctx.lineWidth = 1;
    ctx.strokeRect(pp.x - 4, pp.y - 24, 8, 8);
    ctx.strokeRect(pp.x - 6, pp.y - 20, 12, 16);

    // Mode label above player
    const modeText = selectedMode === "plant" ? "PLANT" : "BUILD";
    ctx.font = "bold 10px monospace";
    const tw = ctx.measureText(modeText).width;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(pp.x - tw / 2 - 2, pp.y - 36, tw + 4, 10);
    ctx.strokeStyle = "#000000"; ctx.strokeRect(pp.x - tw / 2 - 2, pp.y - 36, tw + 4, 10);
    ctx.fillStyle = "#000000"; ctx.fillText(modeText, pp.x - tw / 2, pp.y - 28);

  }, [player, tiles, selectedMode, showLST, showRunoff, showAccess, simData]);

  // --- Mouse interaction ---

  const getGridFromEvent = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const sx = (e.clientX - rect.left) * scaleX;
    const sy = (e.clientY - rect.top)  * scaleY;
    const tileWidth = 32, tileHeight = 16;
    const isoX = sx - canvas.width  / 2;
    const isoY = sy - canvas.height / 2;
    const relX = isoX / tileWidth + isoY / tileHeight;
    const relY = isoY / tileHeight - isoX / tileWidth;
    return {
      x: Math.round(relX) + player.x,
      y: Math.round(relY) + player.y,
    };
  };

  const handleCanvasDoubleClick = (e) => {
    const grid = getGridFromEvent(e);
    if (!grid) return;
    const key = `${grid.x},${grid.y}`;
    const tile = tiles.get(key);
    if (!tile) return;
    const newTiles = new Map(tiles);
    if (selectedMode === "plant" && !tile.hasTree && !tile.hasBuilding && budget >= TREE_COST) {
      newTiles.set(key, { ...tile, hasTree: true, treeAge: 1 });
      setScore(s => ({ ...s, planted: s.planted + 1 }));
      setBudget(b => b - TREE_COST);
      setTiles(newTiles);
    } else if (selectedMode === "build" && !tile.hasBuilding && !tile.hasTree) {
      newTiles.set(key, { ...tile, hasBuilding: true });
      setScore(s => ({ ...s, built: s.built + 1 }));
      setTiles(newTiles);
    }
  };

  const handleCanvasContextMenu = (e) => {
    e.preventDefault();
    const grid = getGridFromEvent(e);
    if (!grid) return;
    const key = `${grid.x},${grid.y}`;
    const tile = tiles.get(key);
    if (!tile) return;
    const newTiles = new Map(tiles);
    if (tile.hasTree) {
      newTiles.set(key, { ...tile, hasTree: false, treeAge: 0 });
      setScore(s => ({ ...s, cut: s.cut + 1 }));
      setTiles(newTiles);
    } else if (tile.hasBuilding) {
      newTiles.set(key, { ...tile, hasBuilding: false });
      setScore(s => ({ ...s, demolished: s.demolished + 1 }));
      setTiles(newTiles);
    }
  };

  const gameHoveredRef = useRef(false);

  // Keyboard movement — only active while mouse is over the game canvas
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameHoveredRef.current) return;
      const key = e.key.toLowerCase();
      const isMovementKey = ["w","s","a","d","arrowup","arrowdown","arrowleft","arrowright"].includes(key);
      if (isMovementKey) e.preventDefault(); // block page scroll
      if (key === "w" || key === "arrowup")         setPlayer(p => ({ ...p, y: p.y - 1 }));
      else if (key === "s" || key === "arrowdown")  setPlayer(p => ({ ...p, y: p.y + 1 }));
      else if (key === "a" || key === "arrowleft")  setPlayer(p => ({ ...p, x: p.x - 1 }));
      else if (key === "d" || key === "arrowright") setPlayer(p => ({ ...p, x: p.x + 1 }));
      if (key === "1") setSelectedMode("plant");
      if (key === "2") setSelectedMode("build");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const growTrees = () => {
    const newTiles = new Map(tiles);
    let grown = false;
    tiles.forEach((tile, key) => {
      if (tile.hasTree && tile.treeAge < 3) {
        newTiles.set(key, { ...tile, treeAge: tile.treeAge + 1 });
        grown = true;
      }
    });
    if (grown) setTiles(newTiles);
  };

  // Shared icon button style
  const iconBtnStyle = (active, activeColor = "#f7964a") => ({
    width: "32px",
    height: "32px",
    border: `2px solid ${active ? activeColor : "#000"}`,
    background: active ? activeColor : "#fff",
    padding: "0",
    cursor: "pointer",
    boxShadow: "2px 2px 0 #000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  });

  return (
    <RetroWindow title="Why our decisions matter? - Example of Tree Decisions" width={700} height={700}>
      <div style={{ padding: "16px" }}>

        {/* Game Canvas */}
        <div
          ref={containerRef}
          onMouseEnter={() => { gameHoveredRef.current = true; }}
          onMouseLeave={() => { gameHoveredRef.current = false; }}
          style={{
            border: "3px solid black",
            background: "#ffffff",
            marginBottom: "16px",
            position: "relative",
            width: "100%",
            height: "400px",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ display: "block", width: "100%", height: "100%", imageRendering: "pixelated", cursor: "crosshair" }}
            onDoubleClick={handleCanvasDoubleClick}
            onContextMenu={handleCanvasContextMenu}
          />

          {/* Performance Metrics Overlay */}
          <div style={{
            position: "absolute", top: "8px", left: "8px",
            background: "white", border: "2px solid black",
            padding: "8px", fontSize: "12px", lineHeight: "1.5", maxWidth: "240px",
          }}>
            <strong style={{ display: "block", marginBottom: "4px" }}>Performance Metrics</strong>
            <div>Avg Cooling: <strong>{simData.lst.avgCooling.toFixed(2)}°C</strong></div>
            <div>Avg Building Access: <strong>{simData.access.avgAccess.toFixed(2)}</strong></div>
            <div>Avg Runoff Reduction: <strong>{simData.runoff.avgReduction.toFixed(2)}</strong></div>
            <div style={{ borderTop: "1px solid #000", marginTop: "4px", paddingTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              <img src={iconCoin} alt="budget" style={{ width: "12px", height: "12px", imageRendering: "pixelated" }} />
              <span>Budget: <strong style={{ color: budget === 0 ? "#cc0000" : "inherit" }}>${budget}</strong>
                <span style={{ fontWeight: "normal", color: "#666" }}> (${TREE_COST}/tree)</span>
              </span>
            </div>
          </div>

          {/* Grow Trees icon — bottom-left */}
          <button
            onClick={growTrees}
            title="Grow Trees"
            style={{ ...iconBtnStyle(false, "#16a34a"), position: "absolute", bottom: "8px", left: "8px" }}
          >
            <img src={iconGrow} alt="Grow Trees" style={{ width: "16px", height: "16px", imageRendering: "pixelated" }} />
          </button>

          {/* Simulation toggle icons — bottom-right */}
          <div style={{ position: "absolute", bottom: "8px", right: "8px", display: "flex", gap: "4px" }}>
            <button
              onClick={() => { setShowRunoff(false); setShowAccess(false); setShowLST(v => !v); }}
              title="Temperature"
              style={iconBtnStyle(showLST, "#f7964a")}
            >
              <img src={iconTemperature} alt="Temperature" style={{ width: "16px", height: "16px", imageRendering: "pixelated" }} />
            </button>
            <button
              onClick={() => { setShowLST(false); setShowAccess(false); setShowRunoff(v => !v); }}
              title="Stormwater Runoff"
              style={iconBtnStyle(showRunoff, "#3b82f6")}
            >
              <img src={iconRunoff} alt="Runoff" style={{ width: "16px", height: "16px", imageRendering: "pixelated" }} />
            </button>
            <button
              onClick={() => { setShowLST(false); setShowRunoff(false); setShowAccess(v => !v); }}
              title="Nature Access"
              style={iconBtnStyle(showAccess, "#7e22ce")}
            >
              <img src={iconAccess} alt="Nature Access" style={{ width: "16px", height: "16px", imageRendering: "pixelated" }} />
            </button>
          </div>

          {/* Compact controls — top-right */}
          <div style={{
            position: "absolute", top: "8px", right: "8px",
            background: "white", border: "2px solid black",
            padding: "5px 7px", fontSize: "10px", lineHeight: "1.7", fontFamily: "monospace",
          }}>
            <strong style={{ display: "block", marginBottom: "2px" }}>CONTROLS</strong>
            <div>WASD — Move</div>
            <div>1 / 2 — Plant / Build mode</div>
            <div>Dbl-click — Plant / Build</div>
            <div>R-click — Cut / Demolish</div>
          </div>

          {/* Simulation legend bar — bottom-centre, above icon row */}
          {(showLST || showRunoff || showAccess) && (
            <div style={{
              position: "absolute", bottom: "48px", left: "50%", transform: "translateX(-50%)",
              background: "white", border: "2px solid black",
              padding: "4px 8px", fontSize: "10px", fontFamily: "monospace",
              width: "55%", boxSizing: "border-box", whiteSpace: "nowrap",
            }}>
              {showLST && <>
                <div style={{ height: "8px", background: "linear-gradient(to right, #4ad34a, #c3f5a7, #f0f0f0, #f7964a, #ff5757)", border: "1px solid black", marginBottom: "3px" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Cool &lt;25°C</span><span>30°C</span><span>Hot &gt;35°C</span>
                </div>
              </>}
              {showRunoff && <>
                <div style={{ height: "8px", background: "linear-gradient(to right, #ffffff, #dbeafe, #3b82f6, #1e3a8a)", border: "1px solid black", marginBottom: "3px" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Low runoff</span><span>Medium</span><span>High</span>
                </div>
              </>}
              {showAccess && <>
                <div style={{ height: "8px", background: "linear-gradient(to right, #ffffff, #e9d5ff, #c084fc, #7e22ce)", border: "1px solid black", marginBottom: "3px" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>No access</span><span>Moderate</span><span>Excellent</span>
                </div>
              </>}
            </div>
          )}
        </div>

        {/* Mode selector */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <RetroButton
            onClick={() => setSelectedMode("plant")}
            style={{ background: selectedMode === "plant" ? "#000" : undefined, color: selectedMode === "plant" ? "#fff" : undefined }}
          >
            Plant Tree
          </RetroButton>
          <RetroButton
            onClick={() => setSelectedMode("build")}
            style={{ background: selectedMode === "build" ? "#000" : undefined, color: selectedMode === "build" ? "#fff" : undefined }}
          >
            Build
          </RetroButton>
        </div>

        {/* LST Parameters */}
        {showLST && (
          <div style={{ border: "2px solid black", padding: "12px", background: "white", marginBottom: "16px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => setShowLSTParams(!showLSTParams)}>
              <strong>LST Simulation Parameters</strong>
              <span style={{ fontSize: "14px", userSelect: "none" }}>{showLSTParams ? "▼" : "►"}</span>
            </div>
            {showLSTParams && (
              <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>Wind Direction (degrees): {lstParams.windDirection}</label>
                  <input type="range" min="0" max="360" value={lstParams.windDirection}
                    onChange={e => setLstParams({ ...lstParams, windDirection: Number(e.target.value) })} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>Wind Strength: {lstParams.windAmplitude.toFixed(1)}</label>
                  <input type="range" min="0" max="1" step="0.1" value={lstParams.windAmplitude}
                    onChange={e => setLstParams({ ...lstParams, windAmplitude: Number(e.target.value) })} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>Cooling Decay Rate: {lstParams.coolingDecay.toFixed(2)}</label>
                  <input type="range" min="0.01" max="0.1" step="0.01" value={lstParams.coolingDecay}
                    onChange={e => setLstParams({ ...lstParams, coolingDecay: Number(e.target.value) })} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>Building Heat Intensity: {lstParams.heatIntensity.toFixed(1)} °C</label>
                  <input type="range" min="0" max="8" step="0.5" value={lstParams.heatIntensity}
                    onChange={e => setLstParams({ ...lstParams, heatIntensity: Number(e.target.value) })} style={{ width: "100%" }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Runoff Parameters */}
        {showRunoff && (
          <div style={{ border: "2px solid black", padding: "12px", background: "white", marginBottom: "16px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => setShowRunoffParams(!showRunoffParams)}>
              <strong>Runoff Simulation Parameters</strong>
              <span style={{ fontSize: "14px", userSelect: "none" }}>{showRunoffParams ? "▼" : "►"}</span>
            </div>
            {showRunoffParams && (
              <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>Slope Direction (degrees): {runoffParams.slopeDirection}</label>
                  <input type="range" min="0" max="360" value={runoffParams.slopeDirection}
                    onChange={e => setRunoffParams({ ...runoffParams, slopeDirection: Number(e.target.value) })} style={{ width: "100%" }} />
                  <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>0°: East, 90°: North, 180°: West, 270°: South</p>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>Green Space Infiltration: {(runoffParams.infiltrationRate * 100).toFixed(0)}%</label>
                  <input type="range" min="0.1" max="1" step="0.1" value={runoffParams.infiltrationRate}
                    onChange={e => setRunoffParams({ ...runoffParams, infiltrationRate: Number(e.target.value) })} style={{ width: "100%" }} />
                  <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>Percentage of water absorbed by trees</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nature Access Parameters */}
        {showAccess && (
          <div style={{ border: "2px solid black", padding: "12px", background: "white", marginBottom: "16px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => setShowAccessParams(!showAccessParams)}>
              <strong>Nature Access Parameters</strong>
              <span style={{ fontSize: "14px", userSelect: "none" }}>{showAccessParams ? "▼" : "►"}</span>
            </div>
            {showAccessParams && (
              <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>Base Access Radius: {accessParams.baseRadius} tiles</label>
                  <input type="range" min="2" max="15" value={accessParams.baseRadius}
                    onChange={e => setAccessParams({ ...accessParams, baseRadius: Number(e.target.value) })} style={{ width: "100%" }} />
                  <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>Larger connected green spaces get bonus radius (base + √size)</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div style={{ border: "2px solid black", padding: "12px", background: "white", fontSize: "13px" }}>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <div><strong>Trees Planted:</strong> {score.planted}</div>
            <div><strong>Trees Cut:</strong> {score.cut}</div>
            <div><strong>Buildings:</strong> {score.built}</div>
            <div><strong>Demolished:</strong> {score.demolished}</div>
            <div><strong>Position:</strong> ({player.x}, {player.y})</div>
          </div>
        </div>

      </div>
    </RetroWindow>
  );
}
