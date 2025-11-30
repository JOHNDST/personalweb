import React, { useState, useEffect, useRef, useMemo } from "react";
import { RetroWindow } from "../../components/retro/RetroWindow";
import { RetroButton } from "../../components/retro/RetroButton";

export function GamePage() {
  const [player, setPlayer] = useState({ x: 0, y: 0 });
  const [tiles, setTiles] = useState(new Map());
  const [selectedAction, setSelectedAction] = useState("move");
  const [score, setScore] = useState({ planted: 0, cut: 0, built: 0, demolished: 0 });
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
    slopeDirection: 135, // degrees (downslope direction)
    infiltrationRate: 0.7, // percentage of water absorbed by green spaces
  });
  const [accessParams, setAccessParams] = useState({
    baseRadius: 5, // base access radius for green spaces
  });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize tiles around starting position
  useEffect(() => {
    const initialTiles = new Map();
    for (let x = -5; x <= 5; x++) {
      for (let y = -5; y <= 5; y++) {
        const key = `${x},${y}`;
        initialTiles.set(key, { x, y, hasTree: false, treeAge: 0, hasBuilding: false });
      }
    }
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
    
    if (added) {
      setTiles(newTiles);
    }
  }, [player]);

  // --- Simulation Logic (Memoized) ---

  const simData = useMemo(() => {
    // Helper: Distance
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

    // Helper: Wind
    const calculateWindMultiplier = (x, y, center, amplitude, windDirectionDeg) => {
      const windDirectionRad = windDirectionDeg * (Math.PI / 180);
      const dx = x - center.x;
      const dy = center.y - y; // Flip y-axis
      if (dx === 0 && dy === 0) return 1.0;
      const thetaGS = Math.atan2(dy, dx);
      const theta = thetaGS - windDirectionRad;
      return 1.0 + amplitude * Math.cos(theta);
    };

    // 1. LST Simulation
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
          totalX += x;
          totalY += y;
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

    // 2. Access Simulation
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
            const moves = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            moves.forEach(([dx, dy]) => {
              const nx = curr.x + dx;
              const ny = curr.y + dy;
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
        if (tile.hasTree) {
          resultMap.set(key, 1.0);
          return;
        }
        
        let maxScore = 0;
        clusters.forEach(cluster => {
          let minDistSq = Infinity;
          cluster.cells.forEach(gc => {
            const d2 = (tile.x - gc.x) ** 2 + (tile.y - gc.y) ** 2;
            if (d2 < minDistSq) minDistSq = d2;
          });
          const dist = Math.sqrt(minDistSq);
          if (dist < cluster.maxRadius) {
            const score = 1.0 - (dist / cluster.maxRadius) ** 2;
            if (score > maxScore) maxScore = score;
          }
        });
        
        resultMap.set(key, maxScore);
        if (tile.hasBuilding) {
          buildingAccessSum += maxScore;
          buildingCount++;
        }
      });
      
      return { map: resultMap, avgAccess: buildingCount > 0 ? buildingAccessSum / buildingCount : 0 };
    };

    // 3. Runoff Simulation
    const runRunoff = () => {
      const R_URBAN = 1.0;
      const R_BUILDING = 1.5;
      const R_GREEN = 0.2;
      const dirDeg = runoffParams.slopeDirection;
      const infiltration = runoffParams.infiltrationRate;
      const rad = dirDeg * (Math.PI / 180);
      const flowVecX = Math.cos(rad);
      const flowVecY = -Math.sin(rad);
      
      const cellsArray = [];
      tiles.forEach((tile, key) => {
        const score = (tile.x * flowVecX) + (tile.y * flowVecY);
        let gen = R_URBAN;
        if (tile.hasTree) gen = R_GREEN;
        if (tile.hasBuilding) gen = R_BUILDING;
        cellsArray.push({ 
          key, x: tile.x, y: tile.y, score, 
          runoffAccum: gen, tempInflow: 0, 
          hasTree: tile.hasTree, hasBuilding: tile.hasBuilding 
        });
      });
      
      cellsArray.sort((a, b) => a.score - b.score);
      
      // Flow Routing
      cellsArray.forEach(item => {
        let totalWater = item.runoffAccum + item.tempInflow;
        if (item.hasTree) totalWater = totalWater * (1.0 - infiltration);
        item.runoffAccum = totalWater;
        
        const neighbors = [];
        let totalWeight = 0;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const neighborX = item.x + dx;
            const neighborY = item.y + dy;
            const neighborScore = (neighborX * flowVecX) + (neighborY * flowVecY);
            if (neighborScore > item.score) {
              const diff = neighborScore - item.score;
              const neighborKey = `${neighborX},${neighborY}`;
              const neighborItem = cellsArray.find(c => c.key === neighborKey);
              if (neighborItem) {
                neighbors.push({ item: neighborItem, weight: diff });
                totalWeight += diff;
              } else {
                totalWeight += diff;
              }
            }
          }
        }
        
        if (neighbors.length > 0 && totalWeight > 0) {
          neighbors.forEach(n => {
            const share = totalWater * (n.weight / totalWeight);
            n.item.tempInflow += share;
          });
        }
      });
      
      const resultMap = new Map();
      cellsArray.forEach(item => resultMap.set(item.key, item.runoffAccum));
      
      // Counterfactual (No Trees) for reduction calc
      const cellsNoTrees = cellsArray.map(item => ({
        ...item,
        runoffAccum: item.hasBuilding ? R_BUILDING : R_URBAN,
        tempInflow: 0
      }));
      
      cellsNoTrees.forEach(item => {
        let totalWater = item.runoffAccum + item.tempInflow;
        item.runoffAccum = totalWater;
        
        const neighbors = [];
        let totalWeight = 0;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const neighborX = item.x + dx;
            const neighborY = item.y + dy;
            const neighborScore = (neighborX * flowVecX) + (neighborY * flowVecY);
            if (neighborScore > item.score) {
              const diff = neighborScore - item.score;
              const neighborKey = `${neighborX},${neighborY}`;
              const neighborItem = cellsNoTrees.find(c => c.key === neighborKey);
              if (neighborItem) {
                neighbors.push({ item: neighborItem, weight: diff });
                totalWeight += diff;
              } else {
                totalWeight += diff;
              }
            }
          }
        }
        
        if (neighbors.length > 0 && totalWeight > 0) {
          neighbors.forEach(n => {
            const share = totalWater * (n.weight / totalWeight);
            n.item.tempInflow += share;
          });
        }
      });
      
      let totalReduction = 0;
      cellsArray.forEach((item, idx) => {
        totalReduction += (cellsNoTrees[idx].runoffAccum - item.runoffAccum);
      });
      
      return { map: resultMap, avgReduction: cellsArray.length > 0 ? totalReduction / cellsArray.length : 0 };
    };

    return {
      lst: runLST(),
      access: runAccess(),
      runoff: runRunoff()
    };
  }, [tiles, lstParams, runoffParams, accessParams]);

  // Create dither patterns
  const createDitherPattern = (density) => {
    const patternCanvas = document.createElement("canvas");
    patternCanvas.width = 4;
    patternCanvas.height = 4;
    const pctx = patternCanvas.getContext("2d");
    if (!pctx) return patternCanvas;
    
    pctx.fillStyle = "#ffffff";
    pctx.fillRect(0, 0, 4, 4);
    pctx.fillStyle = "#000000";
    
    // Different dither densities
    if (density === 1) { // Light dither (25%)
      pctx.fillRect(0, 0, 1, 1);
      pctx.fillRect(2, 2, 1, 1);
    } else if (density === 2) { // Medium dither (50%)
      pctx.fillRect(0, 0, 1, 1);
      pctx.fillRect(2, 1, 1, 1);
      pctx.fillRect(1, 2, 1, 1);
      pctx.fillRect(3, 3, 1, 1);
    } else if (density === 3) { // Heavy dither (75%)
      pctx.fillRect(0, 0, 4, 4);
      pctx.fillStyle = "#ffffff";
      pctx.fillRect(1, 0, 1, 1);
      pctx.fillRect(3, 1, 1, 1);
      pctx.fillRect(0, 2, 1, 1);
      pctx.fillRect(2, 3, 1, 1);
    }
    
    return patternCanvas;
  };

  // Draw pixel art tree
  const drawPixelTree = (ctx, x, y, age, outlineOnly = false) => {
    const scale = age;
    
    if (age === 1) {
      // Sapling - simple vertical line with small leaves
      if (!outlineOnly) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(x - 1, y - 8, 2, 8);
        ctx.fillRect(x - 3, y - 6, 2, 2);
        ctx.fillRect(x + 1, y - 6, 2, 2);
      } else {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 1, y - 8, 2, 8);
        ctx.strokeRect(x - 3, y - 6, 2, 2);
        ctx.strokeRect(x + 1, y - 6, 2, 2);
      }
    } else if (age === 2) {
      // Young tree
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      
      // Trunk
      if (!outlineOnly) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(x - 2, y - 16, 4, 16);
      } else {
        ctx.strokeRect(x - 2, y - 16, 4, 16);
      }
      
      // Crown
      ctx.strokeRect(x - 8, y - 24, 16, 12);
      if (!outlineOnly) {
        const ditherPattern = ctx.createPattern(createDitherPattern(2), "repeat");
        if (ditherPattern) {
          ctx.fillStyle = ditherPattern;
          ctx.fillRect(x - 8, y - 24, 16, 12);
        }
      }
    } else if (age >= 3) {
      // Mature tree - larger with more detail
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      
      // Trunk
      if (!outlineOnly) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(x - 3, y - 24, 6, 24);
      } else {
        ctx.strokeRect(x - 3, y - 24, 6, 24);
      }
      
      // Crown outlines
      ctx.strokeRect(x - 14, y - 36, 28, 16);
      
      if (!outlineOnly) {
        // Large crown with multiple dither layers
        const ditherPattern1 = ctx.createPattern(createDitherPattern(1), "repeat");
        const ditherPattern2 = ctx.createPattern(createDitherPattern(3), "repeat");
        
        // Outer crown (lighter)
        if (ditherPattern1) {
          ctx.fillStyle = ditherPattern1;
          ctx.fillRect(x - 14, y - 36, 28, 16);
        }
        
        // Inner crown (darker)
        if (ditherPattern2) {
          ctx.fillStyle = ditherPattern2;
          ctx.fillRect(x - 10, y - 32, 20, 12);
        }
      }
    }
  };

  // Draw pixel art building
  const drawPixelBuilding = (ctx, x, y, outlineOnly = false) => {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    
    // Building body outline
    ctx.strokeRect(x - 10, y - 28, 20, 28);
    
    if (!outlineOnly) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(x - 10, y - 28, 20, 28);
      
      // Windows (white rectangles)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 7, y - 24, 4, 4);
      ctx.fillRect(x + 3, y - 24, 4, 4);
      ctx.fillRect(x - 7, y - 16, 4, 4);
      ctx.fillRect(x + 3, y - 16, 4, 4);
      ctx.fillRect(x - 7, y - 8, 4, 4);
      ctx.fillRect(x + 3, y - 8, 4, 4);
    } else {
      // Just draw window outlines in LST mode
      ctx.strokeRect(x - 7, y - 24, 4, 4);
      ctx.strokeRect(x + 3, y - 24, 4, 4);
      ctx.strokeRect(x - 7, y - 16, 4, 4);
      ctx.strokeRect(x + 3, y - 16, 4, 4);
      ctx.strokeRect(x - 7, y - 8, 4, 4);
      ctx.strokeRect(x + 3, y - 8, 4, 4);
    }
  };

  // Helper colors
  const getLSTColor = (lst) => {
    const T_BASE = 30.0;
    const minTemp = T_BASE - 5;
    const maxTemp = T_BASE + 5;
    const colorStops = [
      { temp: minTemp, color: [74, 211, 74] },
      { temp: T_BASE - 1, color: [195, 245, 167] },
      { temp: T_BASE, color: [240, 240, 240] },
      { temp: T_BASE + 1, color: [247, 150, 74] },
      { temp: maxTemp, color: [255, 87, 87] }
    ];
    const clampedLST = Math.max(minTemp, Math.min(lst, maxTemp));
    for (let i = 0; i < colorStops.length - 1; i++) {
      const stop1 = colorStops[i];
      const stop2 = colorStops[i + 1];
      if (clampedLST >= stop1.temp && clampedLST <= stop2.temp) {
        const ratio = (clampedLST - stop1.temp) / (stop2.temp - stop1.temp);
        const r = Math.round(stop1.color[0] + (stop2.color[0] - stop1.color[0]) * ratio);
        const g = Math.round(stop1.color[1] + (stop2.color[1] - stop1.color[1]) * ratio);
        const b = Math.round(stop1.color[2] + (stop2.color[2] - stop1.color[2]) * ratio);
        return `rgb(${r}, ${g}, ${b})`;
      }
    }
    return "rgb(240, 240, 240)";
  };
  
  const getRunoffColor = (runoff) => {
    const visualMax = 10.0;
    const ratio = Math.min(runoff / visualMax, 1.0);
    const r = Math.round(255 + (59 - 255) * ratio);
    const g = Math.round(255 + (130 - 255) * ratio);
    const b = Math.round(255 + (246 - 255) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  const getAccessColor = (score, isGreen) => {
    if (isGreen) return "#16a34a";
    const r = Math.round(255 + (126 - 255) * score);
    const g = Math.round(255 + (34 - 255) * score);
    const b = Math.round(255 + (206 - 255) * score);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Draw the isometric world
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tileWidth = 32;
    const tileHeight = 16;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Clear canvas with white
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Convert grid coordinates to isometric screen coordinates
    const toIso = (x, y) => {
      const relX = x - player.x;
      const relY = y - player.y;
      const isoX = (relX - relY) * (tileWidth / 2);
      const isoY = (relX + relY) * (tileHeight / 2);
      return { x: centerX + isoX, y: centerY + isoY };
    };

    // Sort tiles for proper draw order (back to front)
    const sortedTiles = Array.from(tiles.values()).sort((a, b) => {
      return (a.x + a.y) - (b.x + b.y);
    });

    // Create ground dither pattern
    const groundPattern = ctx.createPattern(createDitherPattern(1), "repeat");

    // Draw tiles
    sortedTiles.forEach(tile => {
      const pos = toIso(tile.x, tile.y);
      const key = `${tile.x},${tile.y}`;
      
      // Skip tiles that are off-screen
      if (pos.x < -50 || pos.x > canvas.width + 50 || pos.y < -50 || pos.y > canvas.height + 50) {
        return;
      }
      
      // Draw tile base
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      
      // Determine fill color based on visualization mode
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
      
      if (!fillStyle) {
        if (groundPattern) {
          fillStyle = (tile.hasTree || tile.hasBuilding) ? "#000000" : groundPattern;
        } else {
          fillStyle = (tile.hasTree || tile.hasBuilding) ? "#000000" : "#ffffff";
        }
      }
      
      ctx.fillStyle = fillStyle;
      
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + tileWidth / 2, pos.y + tileHeight / 2);
      ctx.lineTo(pos.x, pos.y + tileHeight);
      ctx.lineTo(pos.x - tileWidth / 2, pos.y + tileHeight / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw tree if present
      if (tile.hasTree && tile.treeAge > 0 && !showLST && !showRunoff && !showAccess) {
        drawPixelTree(ctx, pos.x, pos.y, tile.treeAge);
      }
      
      // Draw building if present
      if (tile.hasBuilding && !showLST && !showRunoff && !showAccess) {
        drawPixelBuilding(ctx, pos.x, pos.y);
      }
      
      // Draw outlines in simulation modes
      if (showLST || showRunoff || showAccess) {
        if (tile.hasTree && tile.treeAge > 0) {
          drawPixelTree(ctx, pos.x, pos.y, tile.treeAge, true);
        }
        if (tile.hasBuilding) {
          drawPixelBuilding(ctx, pos.x, pos.y, true);
        }
      }
    });

    // Draw player at center (fixed position)
    const playerPos = { x: centerX, y: centerY };
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    
    // Player - simple black square with pattern
    const playerDither = ctx.createPattern(createDitherPattern(3), "repeat");
    if (playerDither) {
      ctx.fillStyle = playerDither;
      ctx.fillRect(playerPos.x - 6, playerPos.y - 20, 12, 16);
    }
    
    // Solid black head
    ctx.fillStyle = "#000000";
    ctx.fillRect(playerPos.x - 4, playerPos.y - 24, 8, 8);
    ctx.strokeRect(playerPos.x - 4, playerPos.y - 24, 8, 8);
    
    // Outline body
    ctx.strokeRect(playerPos.x - 6, playerPos.y - 20, 12, 16);

    // Action indicator
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = "#000000";
    let actionText = "";
    if (selectedAction === "plant") actionText = "PLANT";
    if (selectedAction === "cut") actionText = "CUT";
    if (selectedAction === "move") actionText = "MOVE";
    if (selectedAction === "build") actionText = "BUILD";
    if (selectedAction === "demolish") actionText = "DEMOLISH";
    
    const textWidth = ctx.measureText(actionText).width;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(playerPos.x - textWidth / 2 - 2, playerPos.y - 36, textWidth + 4, 10);
    ctx.strokeStyle = "#000000";
    ctx.strokeRect(playerPos.x - textWidth / 2 - 2, playerPos.y - 36, textWidth + 4, 10);
    ctx.fillStyle = "#000000";
    ctx.fillText(actionText, playerPos.x - textWidth / 2, playerPos.y - 28);

  }, [player, tiles, selectedAction, showLST, showRunoff, showAccess, simData]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e) => {
      const key = e.key.toLowerCase();
      
      // Movement keys
      if (key === "w" || key === "arrowup") {
        setPlayer(p => ({ ...p, y: p.y - 1 }));
      } else if (key === "s" || key === "arrowdown") {
        setPlayer(p => ({ ...p, y: p.y + 1 }));
      } else if (key === "a" || key === "arrowleft") {
        setPlayer(p => ({ ...p, x: p.x - 1 }));
      } else if (key === "d" || key === "arrowright") {
        setPlayer(p => ({ ...p, x: p.x + 1 }));
      }
      
      // Action keys
      if (key === "1") setSelectedAction("move");
      if (key === "2") setSelectedAction("plant");
      if (key === "3") setSelectedAction("cut");
      if (key === "4") setSelectedAction("build");
      if (key === "5") setSelectedAction("demolish");
      
      // Execute action with spacebar
      if (key === " " || key === "enter") {
        e.preventDefault();
        executeAction();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [player, selectedAction, tiles]);

  const executeAction = () => {
    const key = `${player.x},${player.y}`;
    const tile = tiles.get(key);
    if (!tile) return;

    const newTiles = new Map(tiles);
    
    if (selectedAction === "plant" && !tile.hasTree && !tile.hasBuilding) {
      newTiles.set(key, { ...tile, hasTree: true, treeAge: 1 });
      setScore(s => ({ ...s, planted: s.planted + 1 }));
    } else if (selectedAction === "cut" && tile.hasTree) {
      newTiles.set(key, { ...tile, hasTree: false, treeAge: 0 });
      setScore(s => ({ ...s, cut: s.cut + 1 }));
    } else if (selectedAction === "build" && !tile.hasBuilding && !tile.hasTree) {
      newTiles.set(key, { ...tile, hasBuilding: true });
      setScore(s => ({ ...s, built: s.built + 1 }));
    } else if (selectedAction === "demolish" && tile.hasBuilding) {
      newTiles.set(key, { ...tile, hasBuilding: false });
      setScore(s => ({ ...s, demolished: s.demolished + 1 }));
    }
    
    setTiles(newTiles);
  };

  const growTrees = () => {
    const newTiles = new Map(tiles);
    let grown = false;
    
    tiles.forEach((tile, key) => {
      if (tile.hasTree && tile.treeAge < 3) {
        newTiles.set(key, { ...tile, treeAge: tile.treeAge + 1 });
        grown = true;
      }
    });
    
    if (grown) {
      setTiles(newTiles);
    }
  };

  return (
    <RetroWindow title="Why our decisions matter? - Example of Tree Decisions" width={700} height={700}>
      <div style={{ padding: "16px" }}>
        {/* Game Canvas */}
        <div
          ref={containerRef}
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
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              imageRendering: "pixelated",
            }}
          />
          
          {/* Performance Metrics Overlay */}
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              background: "white",
              border: "2px solid black",
              padding: "8px",
              fontSize: "12px",
              lineHeight: "1.5",
              maxWidth: "240px",
            }}
          >
            <strong style={{ display: "block", marginBottom: "4px" }}>Performance Metrics</strong>
            <div>
              Avg Cooling: <strong>{simData.lst.avgCooling.toFixed(2)}°C</strong>
            </div>
            <div>
              Avg Building Access: <strong>{simData.access.avgAccess.toFixed(2)}</strong>
            </div>
            <div>
              Avg Runoff Reduction: <strong>{simData.runoff.avgReduction.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          {/* Action Buttons Section */}
          <div>
            <div style={{ 
              fontSize: "12px", 
              fontWeight: "bold", 
              marginBottom: "6px",
              padding: "4px 8px",
              background: "white",
              border: "2px solid black",
              display: "inline-block"
            }}>
              ACTIONS
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: "6px",
              }}
            >
              <RetroButton
                onClick={() => setSelectedAction("move")}
                style={{ 
                  background: selectedAction === "move" ? "#000" : undefined,
                  color: selectedAction === "move" ? "#fff" : undefined
                }}
              >
                Move (1)
              </RetroButton>
              <RetroButton
                onClick={() => setSelectedAction("plant")}
                style={{ 
                  background: selectedAction === "plant" ? "#000" : undefined,
                  color: selectedAction === "plant" ? "#fff" : undefined
                }}
              >
                Plant (2)
              </RetroButton>
              <RetroButton
                onClick={() => setSelectedAction("cut")}
                style={{ 
                  background: selectedAction === "cut" ? "#000" : undefined,
                  color: selectedAction === "cut" ? "#fff" : undefined
                }}
              >
                Cut (3)
              </RetroButton>
              <RetroButton
                onClick={() => setSelectedAction("build")}
                style={{ 
                  background: selectedAction === "build" ? "#000" : undefined,
                  color: selectedAction === "build" ? "#fff" : undefined
                }}
              >
                Build (4)
              </RetroButton>
              <RetroButton
                onClick={() => setSelectedAction("demolish")}
                style={{ 
                  background: selectedAction === "demolish" ? "#000" : undefined,
                  color: selectedAction === "demolish" ? "#fff" : undefined
                }}
              >
                Demolish (5)
              </RetroButton>
              <RetroButton 
                onClick={executeAction}
                style={{ 
                  background: "#4ad34a",
                  fontWeight: "bold"
                }}
              >
                Execute (Space)
              </RetroButton>
            </div>
          </div>

          {/* Simulations Section */}
          <div>
            <div style={{ 
              fontSize: "12px", 
              fontWeight: "bold", 
              marginBottom: "6px",
              padding: "4px 8px",
              background: "white",
              border: "2px solid black",
              display: "inline-block"
            }}>
              SIMULATIONS
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "6px",
              }}
            >
              <RetroButton 
                onClick={() => {
                  if (showLST) {
                    setShowLST(false);
                  } else {
                    setShowRunoff(false);
                    setShowAccess(false);
                    setShowLST(true);
                  }
                }}
                style={{ 
                  background: showLST ? "#f7964a" : undefined,
                  fontWeight: showLST ? "bold" : undefined,
                  color: showLST ? "#fff" : undefined
                }}
              >
                {showLST ? "Hide" : "Show"} Temperature
              </RetroButton>
              <RetroButton 
                onClick={() => {
                  if (showRunoff) {
                    setShowRunoff(false);
                  } else {
                    setShowLST(false);
                    setShowAccess(false);
                    setShowRunoff(true);
                  }
                }}
                style={{ 
                  background: showRunoff ? "#3b82f6" : undefined,
                  fontWeight: showRunoff ? "bold" : undefined,
                  color: showRunoff ? "#fff" : undefined
                }}
              >
                {showRunoff ? "Hide" : "Show"} Runoff
              </RetroButton>
              <RetroButton 
                onClick={() => {
                  if (showAccess) {
                    setShowAccess(false);
                  } else {
                    setShowLST(false);
                    setShowRunoff(false);
                    setShowAccess(true);
                  }
                }}
                style={{ 
                  background: showAccess ? "#7e22ce" : undefined,
                  fontWeight: showAccess ? "bold" : undefined,
                  color: showAccess ? "#fff" : undefined
                }}
              >
                {showAccess ? "Hide" : "Show"} Nature Access
              </RetroButton>
            </div>
          </div>

          {/* Tools Section */}
          <div>
            <div style={{ 
              fontSize: "12px", 
              fontWeight: "bold", 
              marginBottom: "6px",
              padding: "4px 8px",
              background: "white",
              border: "2px solid black",
              display: "inline-block"
            }}>
              TOOLS
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "6px",
              }}
            >
              <RetroButton 
                onClick={growTrees}
                style={{ 
                  background: "#16a34a",
                  fontWeight: "bold",
                  color: "#fff"
                }}
              >
                Grow Trees
              </RetroButton>
            </div>
          </div>
        </div>

        {/* LST Parameters */}
        {showLST && (
          <div
            style={{
              border: "2px solid black",
              padding: "12px",
              background: "white",
              marginBottom: "16px",
              fontSize: "13px",
            }}
          >
            <div 
              style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                cursor: "pointer"
              }}
              onClick={() => setShowLSTParams(!showLSTParams)}
            >
              <strong>LST Simulation Parameters</strong>
              <span style={{ fontSize: "14px", userSelect: "none" }}>
                {showLSTParams ? "▼" : "►"}
              </span>
            </div>
            {showLSTParams && (
              <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>
                    Wind Direction (degrees): {lstParams.windDirection}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={lstParams.windDirection}
                    onChange={(e) => setLstParams({ ...lstParams, windDirection: Number(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>
                    Wind Strength: {lstParams.windAmplitude.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={lstParams.windAmplitude}
                    onChange={(e) => setLstParams({ ...lstParams, windAmplitude: Number(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>
                    Cooling Decay Rate: {lstParams.coolingDecay.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.01"
                    max="0.1"
                    step="0.01"
                    value={lstParams.coolingDecay}
                    onChange={(e) => setLstParams({ ...lstParams, coolingDecay: Number(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>
                    Building Heat Intensity: {lstParams.heatIntensity.toFixed(1)} °C
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={lstParams.heatIntensity}
                    onChange={(e) => setLstParams({ ...lstParams, heatIntensity: Number(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend for LST */}
        {showLST && (
          <div
            style={{
              border: "2px solid black",
              padding: "12px",
              background: "white",
              marginBottom: "16px",
            }}
          >
            <strong>Land Surface Temperature (LST) Legend:</strong>
            <div
              style={{
                height: "20px",
                background: "linear-gradient(to right, #4ad34a, #c3f5a7, #f0f0f0, #f7964a, #ff5757)",
                border: "1px solid black",
                marginTop: "8px",
                marginBottom: "8px",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
              <span>Cool (&lt;25°C)</span>
              <span>Baseline (30°C)</span>
              <span>Hot (&gt;35°C)</span>
            </div>
          </div>
        )}
        
        {/* Runoff Parameters */}
        {showRunoff && (
          <div
            style={{
              border: "2px solid black",
              padding: "12px",
              background: "white",
              marginBottom: "16px",
              fontSize: "13px",
            }}
          >
            <div 
              style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                cursor: "pointer"
              }}
              onClick={() => setShowRunoffParams(!showRunoffParams)}
            >
              <strong>Runoff Simulation Parameters</strong>
              <span style={{ fontSize: "14px", userSelect: "none" }}>
                {showRunoffParams ? "▼" : "►"}
              </span>
            </div>
            {showRunoffParams && (
              <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>
                    Slope Direction (degrees): {runoffParams.slopeDirection}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={runoffParams.slopeDirection}
                    onChange={(e) => setRunoffParams({ ...runoffParams, slopeDirection: Number(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                  <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                    0°: East, 90°: North, 180°: West, 270°: South
                  </p>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>
                    Green Space Infiltration: {(runoffParams.infiltrationRate * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={runoffParams.infiltrationRate}
                    onChange={(e) => setRunoffParams({ ...runoffParams, infiltrationRate: Number(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                  <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                    Percentage of water absorbed by trees
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend for Runoff */}
        {showRunoff && (
          <div
            style={{
              border: "2px solid black",
              padding: "12px",
              background: "white",
              marginBottom: "16px",
            }}
          >
            <strong>Stormwater Runoff Accumulation Legend:</strong>
            <div
              style={{
                height: "20px",
                background: "linear-gradient(to right, #ffffff, #dbeafe, #3b82f6, #1e3a8a)",
                border: "1px solid black",
                marginTop: "8px",
                marginBottom: "8px",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
              <span>Low Runoff</span>
              <span>Medium</span>
              <span>High (Flood Risk)</span>
            </div>
            <p style={{ fontSize: "11px", color: "#666", marginTop: "8px" }}>
              Trees absorb water (green = sponge). Buildings generate more runoff. Water flows downslope.
            </p>
          </div>
        )}
        
        {/* Nature Access Parameters */}
        {showAccess && (
          <div
            style={{
              border: "2px solid black",
              padding: "12px",
              background: "white",
              marginBottom: "16px",
              fontSize: "13px",
            }}
          >
            <div 
              style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                cursor: "pointer"
              }}
              onClick={() => setShowAccessParams(!showAccessParams)}
            >
              <strong>Nature Access Parameters</strong>
              <span style={{ fontSize: "14px", userSelect: "none" }}>
                {showAccessParams ? "▼" : "►"}
              </span>
            </div>
            {showAccessParams && (
              <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>
                    Base Access Radius: {accessParams.baseRadius} tiles
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="15"
                    value={accessParams.baseRadius}
                    onChange={(e) => setAccessParams({ ...accessParams, baseRadius: Number(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                  <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                    Larger connected green spaces get bonus radius (base + √size)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend for Nature Access */}
        {showAccess && (
          <div
            style={{
              border: "2px solid black",
              padding: "12px",
              background: "white",
              marginBottom: "16px",
            }}
          >
            <strong>Nature Access Score Legend:</strong>
            <div
              style={{
                height: "20px",
                background: "linear-gradient(to right, #ffffff, #e9d5ff, #c084fc, #7e22ce)",
                border: "1px solid black",
                marginTop: "8px",
                marginBottom: "8px",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
              <span>No Access (0%)</span>
              <span>Moderate (50%)</span>
              <span>Excellent (100%)</span>
            </div>
            <p style={{ fontSize: "11px", color: "#666", marginTop: "8px" }}>
              Shows proximity to green spaces. Connected tree clusters provide larger access areas. Uses quadratic decay.
            </p>
          </div>
        )}

        {/* Instructions & Stats */}
        <div
          style={{
            border: "2px solid black",
            padding: "12px",
            background: "white",
            fontSize: "13px",
            lineHeight: "1.6",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <strong>Controls:</strong>
            <br />
            • WASD or Arrow Keys - Move
            <br />
            • 1/2/3/4/5 - Select action (Move/Plant/Cut/Build/Demolish)
            <br />
            • Space/Enter - Execute action at current position
            <br />
            • Grow Trees - Make all trees grow older
            <br />
            • Simulations - Visualize temperature, runoff, or nature access
          </div>
          
          <div style={{ 
            display: "flex", 
            gap: "24px",
            paddingTop: "12px",
            borderTop: "2px solid black",
            flexWrap: "wrap"
          }}>
            <div>
              <strong>Trees Planted:</strong> {score.planted}
            </div>
            <div>
              <strong>Trees Cut:</strong> {score.cut}
            </div>
            <div>
              <strong>Buildings:</strong> {score.built}
            </div>
            <div>
              <strong>Demolished:</strong> {score.demolished}
            </div>
            <div>
              <strong>Position:</strong> ({player.x}, {player.y})
            </div>
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}