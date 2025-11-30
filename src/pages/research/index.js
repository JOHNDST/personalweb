import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { meta, researchdata } from '../../content_option';
import { GamePage } from '../about/Game';
import { RetroWindow } from '../../components/retro/RetroWindow';

// --- Section 1: GSI Planning Demo Component ---
const GSIDemo = () => {
  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 250;
  const ROWS = 4;
  const COLS = 5;
  const RAIN_GARDEN_UNIT_COST = 250; 
  const BASE_RUNOFF_COEFF = 0.90; 
  const GARDEN_RUNOFF_COEFF = 0.15; 
  const RAINFALL_INTENSITY = 2; 

  const [catchments, setCatchments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  
  // Initialize map
  useEffect(() => {
      const cellWidth = CANVAS_WIDTH / COLS;
      const cellHeight = CANVAS_HEIGHT / ROWS;
      const variance = 0.3; 

      const vertices = [];
      for (let r = 0; r <= ROWS; r++) {
        const rowVertices = [];
        for (let c = 0; c <= COLS; c++) {
          let x = c * cellWidth;
          let y = r * cellHeight;
          if (r > 0 && r < ROWS && c > 0 && c < COLS) {
            x += (Math.random() - 0.5) * cellWidth * variance;
            y += (Math.random() - 0.5) * cellHeight * variance;
          }
          rowVertices.push({ x, y });
        }
        vertices.push(rowVertices);
      }

      const newCatchments = [];
      let idCounter = 0;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const p1 = vertices[r][c];         
          const p2 = vertices[r][c + 1];     
          const p3 = vertices[r + 1][c + 1]; 
          const p4 = vertices[r + 1][c];     

          const centerX = (p1.x + p2.x + p3.x + p4.x) / 4;
          const centerY = (p1.y + p2.y + p3.y + p4.y) / 4;
          
          // Shoelace area
          const area = 0.5 * Math.abs(
            (p1.x * p2.y + p2.x * p3.y + p3.x * p4.y + p4.x * p1.y) -
            (p1.y * p2.x + p2.y * p3.x + p3.y * p4.x + p4.y * p1.x)
          );

          newCatchments.push({
            id: idCounter++,
            row: r,
            col: c,
            points: [p1, p2, p3, p4],
            center: { x: centerX, y: centerY },
            area: area,
            percentGarden: Math.floor(Math.random() * 20), 
            downstreamId: null, 
          });
        }
      }
      
      // Flow directions
      newCatchments.forEach(cat => {
        const { row, col, id } = cat;
        const neighbors = [];
        if (col < COLS - 1) neighbors.push(id + 1);
        if (row < ROWS - 1) neighbors.push(id + COLS);

        if (neighbors.length > 0) {
          const pick = (row + col) % 2 === 0 ? 0 : 1; 
          cat.downstreamId = neighbors[pick] !== undefined ? neighbors[pick] : neighbors[0];
        }
      });

      setCatchments(newCatchments);
  }, []);

  const handleUpdatePercentage = (newPercent) => {
    if (selectedId === null) return;
    setCatchments(prev => prev.map(c => 
      c.id === selectedId ? { ...c, percentGarden: parseInt(newPercent) } : c
    ));
  };

  const stats = useMemo(() => {
    let totalCost = 0;
    let baselineRunoffTotal = 0;
    let currentRunoffTotal = 0;

    catchments.forEach(c => {
      const gardenRatio = c.percentGarden / 100;
      totalCost += c.area * gardenRatio * RAIN_GARDEN_UNIT_COST;
      const baseVol = c.area * RAINFALL_INTENSITY * BASE_RUNOFF_COEFF;
      const effectiveCoeff = (BASE_RUNOFF_COEFF * (1 - gardenRatio)) + (GARDEN_RUNOFF_COEFF * gardenRatio);
      const currentVol = c.area * RAINFALL_INTENSITY * effectiveCoeff;
      baselineRunoffTotal += baseVol;
      currentRunoffTotal += currentVol;
    });

    const runoffReductionVol = baselineRunoffTotal - currentRunoffTotal;
    const reductionPercent = baselineRunoffTotal > 0 
      ? (runoffReductionVol / baselineRunoffTotal) * 100 
      : 0;

    return {
      totalCost,
      reductionPercent: reductionPercent.toFixed(1)
    };
  }, [catchments]);

  const getFillColor = (percent) => {
    // Interpolate from Dark Grey (#333) to Green (#4ad34a)
    // #333333 -> (51, 51, 51)
    // #4ad34a -> (74, 211, 74)
    const r = 51 + (74 - 51) * (percent / 100);
    const g = 51 + (211 - 51) * (percent / 100);
    const b = 51 + (74 - 51) * (percent / 100);
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  };

  const selectedCatchment = catchments.find(c => c.id === selectedId);

  return (
    <div style={{ background: '#000', color: '#fff', padding: '16px', fontFamily: 'monospace', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'flex-start' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>GSI PLANNER</h4>
        <div style={{ fontSize: '10px', textAlign: 'right' }}>
          <div>RUNOFF REDUCTION: <span style={{ color: '#60a5fa' }}>{stats.reductionPercent}%</span></div>
          <div style={{ marginTop: '4px' }}>EST. COST: <span style={{ color: '#ffd700' }}>${(stats.totalCost/1000).toFixed(1)}k</span></div>
        </div>
      </div>
      
      <div style={{ border: '1px solid #fff', position: 'relative', height: '250px', overflow: 'hidden' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} style={{ display: 'block', background: '#111' }}>
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#60a5fa" opacity="0.5" />
              </marker>
              <pattern id="hatchPattern" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="4" stroke="#000" strokeWidth="1" opacity="0.3" />
              </pattern>
            </defs>
            
            {catchments.map((cat) => (
              <g key={cat.id} onClick={() => setSelectedId(cat.id)} style={{ cursor: 'pointer' }}>
                <polygon
                  points={cat.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill={getFillColor(cat.percentGarden)}
                  stroke={selectedId === cat.id ? "#fff" : "#444"}
                  strokeWidth={selectedId === cat.id ? 2 : 1}
                />
                <polygon
                  points={cat.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="url(#hatchPattern)"
                  style={{ pointerEvents: 'none' }}
                />
                <rect x={cat.center.x - 2} y={cat.center.y - 2} width="4" height="4" fill="#000" style={{ pointerEvents: 'none' }} />
                <text x={cat.center.x} y={cat.center.y + 10} textAnchor="middle" fill="#fff" fontSize="8px" style={{ pointerEvents: 'none', opacity: 0.8 }}>
                  {cat.percentGarden}%
                </text>
              </g>
            ))}

            {catchments.map((cat) => {
              if (cat.downstreamId === null) return null;
              const downstream = catchments.find(c => c.id === cat.downstreamId);
              if (!downstream) return null;
              return (
                <line
                  key={`flow-${cat.id}`}
                  x1={cat.center.x} y1={cat.center.y}
                  x2={downstream.center.x} y2={downstream.center.y}
                  stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 3" opacity="0.4"
                  markerEnd="url(#arrowhead)"
                  style={{ pointerEvents: 'none' }}
                />
              );
            })}
        </svg>

        {selectedId !== null && selectedCatchment ? (
            <div style={{ 
                position: 'absolute', bottom: 0, left: 0, right: 0, 
                background: 'rgba(0,0,0,0.9)', borderTop: '1px solid #fff', padding: '8px 12px',
                display: 'flex', flexDirection: 'column', gap: '4px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#aaa' }}>
                    <span>SUB-CATCHMENT #{selectedId}</span>
                    <span style={{ cursor: 'pointer', color: '#fff' }} onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}>[CLOSE]</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', width: '60px' }}>RAIN GARDEN %</span>
                    <input 
                        type="range" min="0" max="100" 
                        value={selectedCatchment.percentGarden} 
                        onChange={(e) => handleUpdatePercentage(e.target.value)}
                        style={{ flex: 1, accentColor: '#4ad34a', height: '2px' }}
                    />
                    <span style={{ fontSize: '10px', width: '25px', textAlign: 'right' }}>{selectedCatchment.percentGarden}</span>
                </div>
            </div>
        ) : (
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '10px', color: '#888', pointerEvents: 'none' }}>
                CLICK POLYGONS TO EDIT
            </div>
        )}
      </div>
    </div>
  );
};

// --- Section 2: Pareto Front Demo Component ---
const ParetoFrontDemo = () => {
  const [budget, setBudget] = useState(50);
  
  // Generate static points representing the Pareto front
  const points = useMemo(() => {
    const pts = [];
    // Create a curve of points: Risk = 100 / (Cost + 10) * scale
    // We want points from Cost ~0 to ~100
    for (let i = 0; i < 40; i++) {
      const cost = Math.random() * 100;
      // Inverse relationship: Higher cost -> Lower risk
      // Base curve + noise
      const risk = (2000 / (cost + 20)) + (Math.random() * 10 - 5);
      
      pts.push({
        id: i,
        cost: Math.max(0, Math.min(100, cost)),
        risk: Math.max(0, Math.min(100, risk))
      });
    }
    return pts.sort((a, b) => a.cost - b.cost);
  }, []);

  const feasiblePoints = points.filter(p => p.cost <= budget);
  
  // Find the "best" point (lowest risk) within budget
  const bestPoint = feasiblePoints.reduce((min, p) => p.risk < min.risk ? p : min, { risk: Infinity });

  return (
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Chart Area */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '250px', 
          borderLeft: '2px solid black', 
          borderBottom: '2px solid black', 
          background: '#f9f9f9',
          marginBottom: '10px'
        }}>
          {/* Labels */}
          <div style={{ position: 'absolute', bottom: '-25px', left: '0', fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>COST ($) -&gt;</div>
          <div style={{ position: 'absolute', top: '0', left: '-25px', fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace', transform: 'rotate(-90deg)', transformOrigin: 'top right' }}>&lt;- FLOOD RISK</div>
          
          {/* Points */}
          {points.map(p => {
            const isFeasible = p.cost <= budget;
            const isBest = isFeasible && p === bestPoint;
            
            return (
              <div 
                key={p.id}
                style={{
                  position: 'absolute',
                  left: `${p.cost}%`,
                  bottom: `${p.risk}%`,
                  width: isBest ? '10px' : '6px',
                  height: isBest ? '10px' : '6px',
                  borderRadius: '50%',
                  background: isBest ? '#ff5f57' : (isFeasible ? 'black' : '#e0e0e0'),
                  border: isBest ? '1px solid black' : 'none',
                  transform: 'translate(-50%, 50%)',
                  transition: 'all 0.3s ease',
                  zIndex: isBest ? 10 : (isFeasible ? 5 : 1)
                }}
              />
            );
          })}
          
          {/* Budget Line */}
          <div style={{
            position: 'absolute',
            left: `${budget}%`,
            top: 0,
            bottom: 0,
            width: '1px',
            borderRight: '2px dashed #ccc',
            pointerEvents: 'none',
            transition: 'left 0.1s linear',
            zIndex: 2
          }} />
        </div>

        {/* Controls */}
        <div style={{ fontFamily: 'monospace' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '12px' }}>BUDGET CONSTRAINT</label>
            <span style={{ fontSize: '12px' }}>${budget}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={budget} 
            onChange={(e) => setBudget(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'black', cursor: 'pointer', height: '2px', background: '#ddd' }}
          />
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            border: '1px solid black', 
            background: '#eee', 
            fontSize: '11px',
            lineHeight: '1.4'
          }}>
            {feasiblePoints.length > 0 
              ? <><strong>{feasiblePoints.length}</strong> solutions feasible. Best Risk: <strong>{bestPoint.risk.toFixed(1)}%</strong></>
              : "Budget too low. No feasible solutions."
            }
            <br/>
            <span style={{ color: '#666' }}>Drag slider to filter solutions by cost.</span>
          </div>
        </div>

      </div>
  );
};

// --- Section 3: Road Network Demo Component ---
const RoadNetworkDemo = () => {
  const canvasRef = useRef(null);
  const [edges, setEdges] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [habitatImpact, setHabitatImpact] = useState('LOW');

  // Generate static habitat patches once
  const habitatPatches = useMemo(() => {
    const patches = [];
    for (let i = 0; i < 8; i++) {
      patches.push({
        x: Math.random() * 400,
        y: Math.random() * 250,
        radius: 30 + Math.random() * 50,
        intensity: 0.05 + Math.random() * 0.1
      });
    }
    return patches;
  }, []);

  // Initialize graph (Grid 4x3)
  useEffect(() => {
    const rows = 3;
    const cols = 4;
    const width = 400;
    const height = 250;
    const paddingX = 60;
    const paddingY = 50;
    
    const newNodes = [];
    const newEdges = [];

    // Create Grid Nodes
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const id = r * cols + c;
        newNodes.push({
          id: id,
          x: paddingX + c * ((width - 2 * paddingX) / (cols - 1)),
          y: paddingY + r * ((height - 2 * paddingY) / (rows - 1))
        });
      }
    }
    setNodes(newNodes);

    // Create Grid Edges (Horizontal and Vertical)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const curr = r * cols + c;
        
        // Right neighbor
        if (c < cols - 1) {
          newEdges.push({
            source: curr,
            target: curr + 1,
            active: Math.random() > 0.4
          });
        }
        // Bottom neighbor
        if (r < rows - 1) {
          newEdges.push({
            source: curr,
            target: curr + cols,
            active: Math.random() > 0.4
          });
        }
      }
    }
    setEdges(newEdges);
  }, []);

  // Check connectivity and Habitat Impact
  useEffect(() => {
    if (nodes.length === 0) return;
    
    // 1. Connectivity Logic
    // Build adjacency list from active edges
    const adj = new Map();
    nodes.forEach(n => adj.set(n.id, []));
    edges.forEach(e => {
      if (e.active) {
        adj.get(e.source).push(e.target);
        adj.get(e.target).push(e.source);
      }
    });

    // BFS from node 0
    const visited = new Set();
    const queue = [0];
    visited.add(0);
    
    while (queue.length > 0) {
      const curr = queue.shift();
      const neighbors = adj.get(curr) || [];
      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }
    setIsConnected(visited.size === nodes.length);

    // 2. Habitat Impact Logic
    let totalImpact = 0;
    edges.forEach(e => {
      if (!e.active) return;
      
      const n1 = nodes[e.source];
      const n2 = nodes[e.target];
      const dist = Math.hypot(n2.x - n1.x, n2.y - n1.y);
      const steps = Math.max(1, Math.floor(dist / 5)); // Sample every 5px

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = n1.x + (n2.x - n1.x) * t;
        const py = n1.y + (n2.y - n1.y) * t;

        habitatPatches.forEach(patch => {
          const d = Math.hypot(px - patch.x, py - patch.y);
          if (d < patch.radius) {
             // Add impact: intensity * proximity factor
             // Increased sensitivity (x10) so even a few crossings register
             totalImpact += patch.intensity * (1 - d / patch.radius) * 10;
          }
        });
      }
    });
    
    if (totalImpact < 10) setHabitatImpact('LOW');
    else if (totalImpact < 25) setHabitatImpact('MEDIUM');
    else setHabitatImpact('HIGH');

  }, [nodes, edges, habitatPatches]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear
    ctx.fillStyle = '#111'; // Dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Habitat Patches (Static)
    habitatPatches.forEach(patch => {
        const gradient = ctx.createRadialGradient(patch.x, patch.y, 0, patch.x, patch.y, patch.radius);
        gradient.addColorStop(0, `rgba(100, 255, 100, ${patch.intensity})`); // Greenish center
        gradient.addColorStop(1, 'rgba(100, 255, 100, 0)'); // Fade out
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(patch.x, patch.y, patch.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Edges
    edges.forEach(e => {
      const n1 = nodes[e.source];
      const n2 = nodes[e.target];
      
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      
      if (e.active) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw Nodes
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    });

  }, [nodes, edges, habitatPatches]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked edge
    const clickedEdgeIndex = edges.findIndex(e => {
      const n1 = nodes[e.source];
      const n2 = nodes[e.target];
      
      // Distance from point to line segment
      const A = x - n1.x;
      const B = y - n1.y;
      const C = n2.x - n1.x;
      const D = n2.y - n1.y;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;
      if (lenSq !== 0) param = dot / lenSq;

      let xx, yy;

      if (param < 0) {
        xx = n1.x;
        yy = n1.y;
      } else if (param > 1) {
        xx = n2.x;
        yy = n2.y;
      } else {
        xx = n1.x + param * C;
        yy = n1.y + param * D;
      }

      const dx = x - xx;
      const dy = y - yy;
      return (dx * dx + dy * dy) < 100; // 10px radius tolerance
    });

    if (clickedEdgeIndex !== -1) {
      const newEdges = [...edges];
      newEdges[clickedEdgeIndex].active = !newEdges[clickedEdgeIndex].active;
      setEdges(newEdges);
    }
  };

  return (
    <div style={{ background: '#000', color: '#fff', padding: '16px', fontFamily: 'monospace', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'flex-start' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Road Network GRAPH</h4>
        <div style={{ fontSize: '10px', textAlign: 'right' }}>
          <div>EFFICIENCY: <span style={{ color: isConnected ? '#4ad34a' : '#ff5f57' }}>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span></div>
          <div style={{ marginTop: '4px' }}>
            HABITAT IMPACT: <span style={{ 
              color: habitatImpact === 'LOW' ? '#4ad34a' : (habitatImpact === 'MEDIUM' ? '#ffd700' : '#ff5f57') 
            }}>{habitatImpact}</span>
          </div>
        </div>
      </div>
      
      <div style={{ border: '1px solid #fff', cursor: 'pointer', position: 'relative' }}>
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={250} 
          style={{ width: '100%', display: 'block' }}
          onClick={handleCanvasClick}
        />
        <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '10px', color: '#888', pointerEvents: 'none' }}>
          CLICK LINES TO BUILD ROADS
        </div>
      </div>
    </div>
  );
};

// --- Section 3.5: GI Optimization Demo Component ---
const GIOptimizationDemo = () => {
  const GRID_W = 21;
  const GRID_H = 11;
  const TILE_SIZE_PX = 18; // Slightly smaller to fit

  const TILE_TYPES = {
    EMPTY: 'empty',
    ROAD: 'road',
    BUILDING: 'building',
    VACANT: 'vacant',
  };

  const INFRASTRUCTURE_TYPES = {
    FOREST: { id: 'forest', label: 'Forest', color: '#4ad34a', stats: { cooling: 10, runoff: 6, habitat: 9, radius: 3, cost: 30 } },
    WETLAND: { id: 'wetland', label: 'Wetland', color: '#60a5fa', stats: { cooling: 6, runoff: 10, habitat: 7, radius: 2, cost: 20 } },
    SHRUBLAND: { id: 'shrubland', label: 'Shrub', color: '#facc15', stats: { cooling: 4, runoff: 5, habitat: 5, radius: 1, cost: 10 } },
  };

  const [grid, setGrid] = useState([]);
  const [selectedTool, setSelectedTool] = useState('forest');
  const [metrics, setMetrics] = useState({ cooling: 0, runoff: 0, habitat: 0, cost: 0 });

  // Initialize Map
  useEffect(() => {
    const map = Array(GRID_H).fill(null).map((_, y) => 
      Array(GRID_W).fill(null).map((_, x) => ({
        x, y, type: TILE_TYPES.BUILDING, infrastructure: null
      }))
    );

    const setType = (x, y, t) => {
      if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) {
        map[y][x].type = t;
      }
    };

    // Roads - Create a more interesting layout for 19x11
    // Horizontal roads
    for(let x = 0; x < GRID_W; x++) { 
        setType(x, 3, TILE_TYPES.ROAD); 
        setType(x, 7, TILE_TYPES.ROAD); 
    }
    // Vertical roads
    for(let y = 0; y < GRID_H; y++) { 
        setType(5, y, TILE_TYPES.ROAD); 
        setType(13, y, TILE_TYPES.ROAD); 
    }

    // Vacant Lots - Scattered around roads
    const vacantParcels = [];
    // Block 1 (Top Left)
    vacantParcels.push({x: 1, y: 1}, {x: 2, y: 1}, {x: 1, y: 2}, {x: 3, y: 1});
    // Block 2 (Top Middle)
    vacantParcels.push({x: 7, y: 1}, {x: 8, y: 1}, {x: 9, y: 2}, {x: 10, y: 1});
    // Block 3 (Top Right)
    vacantParcels.push({x: 15, y: 1}, {x: 16, y: 2}, {x: 17, y: 1});
    
    // Block 4 (Middle Left)
    vacantParcels.push({x: 1, y: 5}, {x: 2, y: 5}, {x: 3, y: 5});
    // Block 5 (Middle Middle)
    vacantParcels.push({x: 7, y: 5}, {x: 8, y: 5}, {x: 9, y: 5}, {x: 10, y: 5});
    // Block 6 (Middle Right)
    vacantParcels.push({x: 15, y: 5}, {x: 16, y: 5});

    // Block 7 (Bottom Left)
    vacantParcels.push({x: 1, y: 9}, {x: 2, y: 9}, {x: 3, y: 9});
    // Block 8 (Bottom Middle)
    vacantParcels.push({x: 7, y: 9}, {x: 8, y: 9}, {x: 9, y: 9});
    // Block 9 (Bottom Right)
    vacantParcels.push({x: 15, y: 9}, {x: 16, y: 9}, {x: 17, y: 9});

    vacantParcels.forEach(p => setType(p.x, p.y, TILE_TYPES.VACANT));

    setGrid(map);
  }, []);

  // Calculate Metrics
  useEffect(() => {
    if (grid.length === 0) return;

    let totalCoolingScore = 0;
    let totalRunoffScore = 0;
    let totalHabitatScore = 0;
    let totalCost = 0;

    const greenTiles = [];
    const buildings = [];
    let vacantCount = 0;

    grid.forEach(row => row.forEach(tile => {
      if (tile.infrastructure) greenTiles.push(tile);
      if (tile.type === TILE_TYPES.BUILDING) buildings.push(tile);
      if (tile.type === TILE_TYPES.VACANT) vacantCount++;
    }));

    // Cooling
    buildings.forEach(b => {
      let coolingReceived = 0;
      greenTiles.forEach(g => {
        const dist = Math.sqrt(Math.pow(b.x - g.x, 2) + Math.pow(b.y - g.y, 2));
        const stats = INFRASTRUCTURE_TYPES[g.infrastructure.toUpperCase()].stats;
        if (dist <= stats.radius + 1) {
           coolingReceived += stats.cooling / (dist * 0.8 + 1); 
        }
      });
      totalCoolingScore += Math.min(coolingReceived, 20); 
    });

    // Runoff & Cost
    greenTiles.forEach(g => {
      const stats = INFRASTRUCTURE_TYPES[g.infrastructure.toUpperCase()].stats;
      
      // Cost
      totalCost += stats.cost;

      // Runoff
      let score = stats.runoff;
      const neighbors = [{x: g.x+1, y: g.y}, {x: g.x-1, y: g.y}, {x: g.x, y: g.y+1}, {x: g.x, y: g.y-1}];
      let roadContacts = 0;
      neighbors.forEach(n => {
        if (n.x >= 0 && n.x < GRID_W && n.y >= 0 && n.y < GRID_H) {
          if (grid[n.y][n.x].type === TILE_TYPES.ROAD) roadContacts++;
        }
      });
      score += (roadContacts * 2);
      totalRunoffScore += score;
    });

    // Habitat
    greenTiles.forEach(g => {
      const stats = INFRASTRUCTURE_TYPES[g.infrastructure.toUpperCase()].stats;
      let connectivityBonus = 0;
      const neighbors = [{x: g.x+1, y: g.y}, {x: g.x-1, y: g.y}, {x: g.x, y: g.y+1}, {x: g.x, y: g.y-1}];
      neighbors.forEach(n => {
        if (n.x >= 0 && n.x < GRID_W && n.y >= 0 && n.y < GRID_H) {
          if (grid[n.y][n.x].infrastructure) connectivityBonus += 2; 
        }
      });
      totalHabitatScore += stats.habitat + connectivityBonus;
    });

    // Normalization factors (Harder difficulty)
    // Max Cost: All Forest (30) * vacantCount
    const maxCost = vacantCount * 30 || 1;
    // Max Runoff: ~15 per tile * vacantCount
    const maxRunoff = vacantCount * 15 || 1;
    // Max Habitat: ~15 per tile * vacantCount
    const maxHabitat = vacantCount * 15 || 1;

    setMetrics({
      cooling: Math.min(100, (totalCoolingScore / (buildings.length || 1)) * 10),
      runoff: Math.min(100, (totalRunoffScore / maxRunoff) * 100),
      habitat: Math.min(100, (totalHabitatScore / maxHabitat) * 100),
      cost: Math.min(100, (totalCost / maxCost) * 100),
    });

  }, [grid]);

  const handleTileClick = (x, y) => {
    const newGrid = [...grid.map(row => [...row])];
    const tile = newGrid[y][x];
    if (tile.type !== TILE_TYPES.VACANT) return;
    tile.infrastructure = tile.infrastructure === selectedTool ? null : selectedTool;
    setGrid(newGrid);
  };

  const getMetricColor = (val, isCost = false) => {
      if (isCost) {
          if (val > 75) return '#ff5f57'; // Red (High Cost)
          if (val > 40) return '#ffd700'; // Yellow
          return '#4ad34a'; // Green (Low Cost)
      }
      if (val > 75) return '#4ad34a'; // Green
      if (val > 40) return '#ffd700'; // Yellow
      return '#ff5f57'; // Red
  };

  return (
    <div style={{ background: '#000', color: '#fff', padding: '16px', fontFamily: 'monospace', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'flex-start' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>GI OPTIMIZATION</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '10px', textAlign: 'right' }}>
          <div>COOLING: <span style={{ color: getMetricColor(metrics.cooling) }}>{Math.round(metrics.cooling)}%</span></div>
          <div>COST: <span style={{ color: getMetricColor(metrics.cost, true) }}>{Math.round(metrics.cost)}%</span></div>
          <div>RUNOFF: <span style={{ color: getMetricColor(metrics.runoff) }}>{Math.round(metrics.runoff)}%</span></div>
          <div>HABITAT: <span style={{ color: getMetricColor(metrics.habitat) }}>{Math.round(metrics.habitat)}%</span></div>
        </div>
      </div>

      {/* Main Display Area */}
      <div style={{ 
          border: '1px solid #fff', 
          position: 'relative', 
          height: '250px', 
          width: '100%', 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111'
      }}>
          {/* Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${GRID_W}, ${TILE_SIZE_PX}px)`, 
            gap: '1px', 
            border: '1px solid #333',
            marginBottom: '10px'
          }}>
            {grid.map((row, y) => row.map((tile, x) => {
              let bg = '#222'; // Building (Dark)
              if (tile.type === TILE_TYPES.ROAD) bg = '#333'; // Road
              if (tile.type === TILE_TYPES.VACANT) bg = '#555'; // Vacant (Gray)
              
              if (tile.infrastructure) {
                bg = INFRASTRUCTURE_TYPES[tile.infrastructure.toUpperCase()].color;
              }

              const isVacant = tile.type === TILE_TYPES.VACANT;

              return (
                <div 
                  key={`${x}-${y}`} 
                  onClick={() => handleTileClick(x, y)}
                  style={{ 
                    width: TILE_SIZE_PX, 
                    height: TILE_SIZE_PX, 
                    background: bg,
                    cursor: isVacant ? 'pointer' : 'default',
                    border: isVacant && !tile.infrastructure ? '1px dashed #777' : 'none',
                    boxSizing: 'border-box'
                  }}
                  title={tile.type}
                />
              );
            }))}
          </div>

          {/* Tools */}
          <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '10px' }}>
            {Object.values(INFRASTRUCTURE_TYPES).map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedTool(type.id)}
                style={{
                  padding: '2px 6px',
                  border: `1px solid ${selectedTool === type.id ? '#fff' : '#555'}`,
                  background: selectedTool === type.id ? type.color : '#000',
                  color: selectedTool === type.id ? '#000' : '#888',
                  cursor: 'pointer',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
          
          <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '10px', color: '#888', pointerEvents: 'none' }}>
             CLICK VACANT LOTS
          </div>
      </div>
    </div>
  );
};

// --- Section 4: Chapter Component ---
const ResearchChapter = ({ title, windowTitle, windowContent, children }) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '100px', minHeight: '80vh' }}>
      {/* Left Sticky Window */}
      <div style={{ flex: '1 1 300px', position: 'relative' }}>
        <div style={{ position: 'sticky', top: '100px', paddingRight: '20px', marginBottom: '20px' }}>
          <RetroWindow title={windowTitle || title}>
            <div style={{ padding: '20px', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee' }}>
              {windowContent}
            </div>
          </RetroWindow>
        </div>
      </div>
      
      {/* Right Content */}
      <div style={{ flex: '1 1 400px', paddingLeft: '20px' }}>
        <h2 style={{ marginBottom: '30px', borderBottom: '2px solid black', paddingBottom: '10px' }}>{title}</h2>
        {children}
      </div>
    </div>
  );
};

function ResearchCard({
  title,
  authors,
  date,
  abstract,
  coverImage,
  link,
  ditherThreshold = 128
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [ditheredImage, setDitheredImage] = useState(null);
  const canvasRef = useRef(null);

  // Generate dithered version of the cover image
  useEffect(() => {
    if (!coverImage) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size for cover image
      const width = 120;
      const height = 160;
      canvas.width = width;
      canvas.height = height;

      // Draw image to canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, width, height);
      const { data } = imageData;

      // Simple Atkinson dithering
      const threshold = ditherThreshold;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          
          // Convert to grayscale
          const gray = Math.round(
            0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
          );
          
          // Apply threshold
          const newValue = gray > threshold ? 255 : 0;
          const error = gray - newValue;

          // Set the new pixel value
          data[idx] = newValue;     // R
          data[idx + 1] = newValue; // G
          data[idx + 2] = newValue; // B
          // Alpha remains unchanged

          // Distribute error (Atkinson)
          const errorFraction = error / 8;
          
          const distributeError = (dx, dy) => {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = (ny * width + nx) * 4;
              data[nIdx] = Math.max(0, Math.min(255, data[nIdx] + errorFraction));
              data[nIdx + 1] = Math.max(0, Math.min(255, data[nIdx + 1] + errorFraction));
              data[nIdx + 2] = Math.max(0, Math.min(255, data[nIdx + 2] + errorFraction));
            }
          };

          distributeError(1, 0);
          distributeError(2, 0);
          distributeError(-1, 1);
          distributeError(0, 1);
          distributeError(1, 1);
          distributeError(0, 2);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      try {
        setDitheredImage(canvas.toDataURL());
      } catch (e) {
        console.warn("Canvas taint ignored, using original image", e);
        setDitheredImage(coverImage);
      }
    };
    img.onerror = () => {
        // Fallback to original image if CORS fails or load fails
        setDitheredImage(coverImage);
    };
    
    // Use a CORS proxy to ensure we can read the pixels
    // Only apply proxy if it's an http/https URL
    if (coverImage.startsWith('http')) {
        // Use wsrv.nl with resizing and stripped protocol to improve compatibility
        const cleanUrl = coverImage.replace(/^https?:\/\//, '');
        // Convert to jpg to avoid transparency issues and ensure consistent dithering
        img.src = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&w=120&h=160&fit=cover&output=jpg`;
    } else {
        img.src = coverImage;
    }
  }, [coverImage, ditherThreshold]);

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div
        style={{
          border: "3px solid black",
          background: "white",
          marginBottom: "16px",
          cursor: "pointer",
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "16px",
            padding: "16px",
          }}
          className="research-card-container"
        >
          {/* Journal Cover */}
          <div
            style={{
              width: "120px",
              minWidth: "120px",
              height: "160px",
              border: "2px solid black",
              background: "#f5f5f5",
              overflow: "hidden",
              flexShrink: 0,
            }}
            className="research-card-image"
          >
            {(ditheredImage || coverImage) && (
              <img
                src={ditheredImage || coverImage}
                alt="Journal cover"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  imageRendering: "pixelated", // Changed to pixelated for better dither look
                }}
              />
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }} className="research-card-content">
            <div
              style={{
                fontSize: "18px",
                marginBottom: "8px",
                wordWrap: "break-word",
                overflowWrap: "break-word",
                fontWeight: "bold",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: "13px",
                marginBottom: "6px",
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {authors}
            </div>
            <div
              style={{
                fontSize: "13px",
                opacity: 0.7,
                marginBottom: "12px",
                wordWrap: "break-word",
                overflowWrap: "break-word",
                fontStyle: "italic",
              }}
            >
              {date}
            </div>

            {/* Abstract - shown when expanded */}
            {isExpanded && (
              <div
                style={{
                  fontSize: "13px",
                  lineHeight: "1.5",
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "2px solid black",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  textAlign: "justify",
                }}
                onClick={(e) => e.stopPropagation()} // Allow text selection without collapsing
              >
                <div style={{ marginBottom: "6px", opacity: 0.8, fontWeight: "bold" }}>
                  Abstract:
                </div>
                {abstract}
                {link && (
                    <div style={{ marginTop: "10px" }}>
                        <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>
                            Read Full Paper &rarr;
                        </a>
                    </div>
                )}
              </div>
            )}

            {/* Expand indicator */}
            <div
              style={{
                fontSize: "11px",
                marginTop: "8px",
                opacity: 0.6,
              }}
            >
              {isExpanded ? "▲ Click to collapse" : "▼ Click to read abstract"}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .research-card-container {
            flex-direction: column !important;
            align-items: center;
          }
          .research-card-image {
            width: 100% !important;
            max-width: 200px !important;
            height: auto !important;
            aspect-ratio: 3/4;
          }
          .research-card-content {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

export const Research = () => {
  const getPub = (title) => researchdata.find(p => p.title === title) || { title: title, authors: "Unknown", date: "Unknown", abstract: "Not found", img: "" };

  return (
    <HelmetProvider>
      <Container className="About-header">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Research | {meta.title}</title>
          <meta name="description" content={meta.description} />
        </Helmet>

        {/* --- Section 1: Hero + Toy Sandbox --- */}
        <Row className="mb-5 mt-3 pt-md-3" style={{ minHeight: '80vh' }}>
          <Col lg="6">
            <div style={{ position: 'sticky', top: '100px' }}>
              <h1 className="display-3 mb-4" style={{ fontWeight: 'bold' }}>
                Designing with evidence: <br/>
                <span style={{ fontSize: '0.8em' }}>Decision Support in Landscape and Urban Planning</span>
              </h1>
              <p className="lead">
                We move beyond intuition. By combining data science, optimization algorithms, and landscape architecture, we build tools that help designers and communities make better, more transparent decisions for our shared environment.
              </p>
              <div className="mt-4">
                  <Link to="/publications" style={{ textDecoration: 'underline', fontWeight: 'bold', color: 'black' }}>View Full Publication List &rarr;</Link>
              </div>
            </div>
          </Col>
          <Col lg="6">
            <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
               <GamePage />
            </div>
          </Col>
        </Row>

        {/* --- Section 2: From Guessing to Optimization --- */}
        <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '100px', minHeight: '80vh' }}>
          {/* Left Sticky Window */}
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <div style={{ position: 'sticky', top: '100px', paddingRight: '20px', marginBottom: '20px' }}>
              <RetroWindow title="The Frontier of Efficiency">
                <div style={{ background: '#fff' }}>
                  <ParetoFrontDemo />
                </div>
              </RetroWindow>
            </div>
          </div>
          
          {/* Right Content */}
          <div style={{ flex: '1 1 400px', paddingLeft: '20px' }}>
            <h2 style={{ marginBottom: '30px', borderBottom: '2px solid black', paddingBottom: '10px' }}>From Guessing to Optimization</h2>
            <p style={{ textAlign: 'justify' }}>
              Landscape planning involves complex trade-offs. Where should we place green infrastructure to maximize flood reduction while minimizing cost? How do we ensure equity across neighborhoods?
            </p>
            <p style={{ textAlign: 'justify' }}>
              Traditional methods often rely on "best guesses" or limited scenario comparisons. Our approach uses multi-objective optimization algorithms to explore thousands of possibilities, revealing the "Pareto front"—the set of optimal solutions where no objective can be improved without sacrificing another.
            </p>
            <p style={{ textAlign: 'justify' }}>
              See the pilot study showing how complex trade-offs among ecosystem services are affected by spatial patterns:
            </p>
            <ResearchCard 
                {...getPub("Identifying critical landscape patterns for simultaneous provision of multiple ecosystem services – A case study in the central district of Wuhu City, China")} 
                coverImage={getPub("Identifying critical landscape patterns for simultaneous provision of multiple ecosystem services – A case study in the central district of Wuhu City, China").img}
            />
          </div>
        </div>
        {/* --- Section 3: Research Chapters --- */}
        <div className="mt-5">
            
            {/* Chapter 1 */}
            <ResearchChapter 
                title="Theme 1: Green stormwater infrastructure optimization" 
                windowTitle="How to place GSI to reduce flooding and cost in cities?"
                windowContent={<div style={{ background: '#000' }}><GSIDemo /></div>}
            >
                <p className="mb-4" style={{ textAlign: 'justify' }}>
                    Green Stormwater Infrastructure (GSI) includes nature-based systems such as bioretention cells, rain gardens, permeable pavements, green roofs, and vegetated swales that manage runoff at its source. Related terms like Low Impact Development (LID), Sustainable Urban Drainage Systems (SUDS), and Water Sensitive Urban Design (WSUD) share the goal of mimicking natural hydrology to reduce flood risk. This theme examines how to allocate GSI in cities to minimize flooding and cost by determining optimal locations, scales, and types. Using SWMM for hydrological simulation and optimization algorithms to explore design spaces, the work identifies cost-effective configurations that strengthen urban flood resilience.
                </p>
                <p className="mb-4" style={{ textAlign: 'justify' }}>
                  Publications in this theme include:
                </p>
                <ResearchCard 
                    {...getPub("The Multi-Objective Optimization of Low-Impact Development Facilities in Shallow Mountainous Areas Using Genetic Algorithms")} 
                    coverImage={getPub("The Multi-Objective Optimization of Low-Impact Development Facilities in Shallow Mountainous Areas Using Genetic Algorithms").img}
                />
                <ResearchCard 
                    {...getPub("Research on optimization method for low impact development (LID) controls distribution of greenspace in shallow mountain based on D8 and NSGA-Ⅱ algorithm")} 
                    coverImage={getPub("Research on optimization method for low impact development (LID) controls distribution of greenspace in shallow mountain based on D8 and NSGA-Ⅱ algorithm").img}
                />
                <ResearchCard 
                    {...getPub("Optimal Calculation Method of Size of LID Facilities for Rainwater Harvesting Green Space Based on NSGA-II Algorithm and Application: A Case Study of Nanyang Academician Town")} 
                    coverImage={getPub("Optimal Calculation Method of Size of LID Facilities for Rainwater Harvesting Green Space Based on NSGA-II Algorithm and Application: A Case Study of Nanyang Academician Town").img}
                />
            </ResearchChapter>

            {/* Chapter 2 */}
            <ResearchChapter 
                title="Theme 2: Green infrastructure optimization" 
                windowTitle="How to plan GI towards multifunctionality?"
                windowContent={<div style={{ background: '#000' }}><GIOptimizationDemo /></div>}
            >
                <p className="mb-4" style={{ textAlign: 'justify' }}>
                    This theme focuses on optimizing green infrastructure (GI) as a broader landscape system, defined as the natural and semi-natural network that delivers multiple ecosystem services. Unlike GSI, GI emphasizes spatial ecological functions such as habitat quality, water purification, carbon storage, and recreation. The research aims to resolve tradeoffs among competing ecosystem services and allocate GI to maximize multifunctionality at landscape scales. Process-based models such as InVEST and SWAT quantify service outcomes under different configurations, while multi-objective optimization identifies spatial patterns that balance ecological benefits, land use constraints, and cost. The goal is to support integrated, multifunctional landscape planning.
                </p>
                <ResearchCard 
                    {...getPub("Spatially Explicit Optimization of Urban Green Infrastructure for Multiple Ecosystem Services Using Deep Learning Surrogates")} 
                    coverImage={getPub("Spatially Explicit Optimization of Urban Green Infrastructure for Multiple Ecosystem Services Using Deep Learning Surrogates").img}
                />
                <ResearchCard 
                    {...getPub("Spatially explicit multi-objective optimization tool for green infrastructure planning based on InVEST and NSGA-II towards multifunctionality")} 
                    coverImage={getPub("Spatially explicit multi-objective optimization tool for green infrastructure planning based on InVEST and NSGA-II towards multifunctionality").img}
                />
                <ResearchCard 
                    {...getPub("Optimized green infrastructure planning at the city scale based on an interpretable machine learning model and multi-objective optimization algorithm: A case study of central Beijing, China")} 
                    coverImage={getPub("Optimized green infrastructure planning at the city scale based on an interpretable machine learning model and multi-objective optimization algorithm: A case study of central Beijing, China").img}
                />
            </ResearchChapter>

            {/* Chapter 3 */}
            <ResearchChapter 
                title="Theme 3: Road network optimization with ecology" 
                windowTitle="How to design road systems that balance traffic efficiency and ecological impact?"
                windowContent={<div style={{ background: '#000' }}><RoadNetworkDemo /></div>}
            >
                <p className="mb-4" style={{ textAlign: 'justify' }}>
                    This theme treats the urban system as an integrated whole, recognizing that transportation networks and landscape systems interact closely. Roads improve mobility but also shape land use patterns and fragment habitats. The goal is to design road networks that balance transportation efficiency with ecological protection. By integrating network analysis with spatial ecological models, this research evaluates how alternative road layouts influence travel performance, habitat quality, and landscape connectivity. Optimization methods are then used to identify configurations that reduce fragmentation while maintaining or improving system efficiency, supporting more ecologically sensitive infrastructure planning.
                </p>
                <ResearchCard 
                    {...getPub("Balancing traffic efficiency and ecosystem services in road network planning: A spatial multi-objective optimization approach")} 
                    coverImage={getPub("Balancing traffic efficiency and ecosystem services in road network planning: A spatial multi-objective optimization approach").img}
                />
            </ResearchChapter>

        </div>

      </Container>
    </HelmetProvider>
  );
};