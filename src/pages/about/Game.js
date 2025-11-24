import React, { useState, useEffect, useRef } from "react";
import { RetroWindow } from "../../components/retro/RetroWindow";
import { RetroButton } from "../../components/retro/RetroButton";

export function GamePage() {
  const [player, setPlayer] = useState({ x: 0, y: 0 });
  const [tiles, setTiles] = useState(new Map());
  const [selectedAction, setSelectedAction] = useState("move");
  const [score, setScore] = useState({ planted: 0, cut: 0 });
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize tiles around starting position
  useEffect(() => {
    const initialTiles = new Map();
    for (let x = -5; x <= 5; x++) {
      for (let y = -5; y <= 5; y++) {
        const key = `${x},${y}`;
        initialTiles.set(key, { x, y, hasTree: false, treeAge: 0 });
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
          newTiles.set(key, { x, y, hasTree: false, treeAge: 0 });
          added = true;
        }
      }
    }
    
    if (added) {
      setTiles(newTiles);
    }
  }, [player]);

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
  const drawPixelTree = (ctx, x, y, age) => {
    const scale = age;
    
    if (age === 1) {
      // Sapling - simple vertical line with small leaves
      ctx.fillStyle = "#000000";
      ctx.fillRect(x - 1, y - 8, 2, 8);
      ctx.fillRect(x - 3, y - 6, 2, 2);
      ctx.fillRect(x + 1, y - 6, 2, 2);
    } else if (age === 2) {
      // Young tree
      ctx.fillStyle = "#000000";
      // Trunk
      ctx.fillRect(x - 2, y - 16, 4, 16);
      
      // Crown with dithering
      const ditherPattern = ctx.createPattern(createDitherPattern(2), "repeat");
      if (ditherPattern) {
        ctx.fillStyle = ditherPattern;
        ctx.fillRect(x - 8, y - 24, 16, 12);
      }
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 8, y - 24, 16, 12);
    } else if (age >= 3) {
      // Mature tree - larger with more detail
      ctx.fillStyle = "#000000";
      // Trunk
      ctx.fillRect(x - 3, y - 24, 6, 24);
      
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
      
      // Outline
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 14, y - 36, 28, 16);
    }
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
    // Camera is offset by player position (player stays centered, world moves)
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
      
      // Skip tiles that are off-screen
      if (pos.x < -50 || pos.x > canvas.width + 50 || pos.y < -50 || pos.y > canvas.height + 50) {
        return;
      }
      
      // Draw tile base
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      
      // Ground fill with dither
      if (groundPattern) {
        ctx.fillStyle = tile.hasTree ? "#000000" : groundPattern;
      } else {
        ctx.fillStyle = tile.hasTree ? "#000000" : "#ffffff";
      }
      
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + tileWidth / 2, pos.y + tileHeight / 2);
      ctx.lineTo(pos.x, pos.y + tileHeight);
      ctx.lineTo(pos.x - tileWidth / 2, pos.y + tileHeight / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw tree if present
      if (tile.hasTree && tile.treeAge > 0) {
        drawPixelTree(ctx, pos.x, pos.y, tile.treeAge);
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
    
    const textWidth = ctx.measureText(actionText).width;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(playerPos.x - textWidth / 2 - 2, playerPos.y - 36, textWidth + 4, 10);
    ctx.strokeStyle = "#000000";
    ctx.strokeRect(playerPos.x - textWidth / 2 - 2, playerPos.y - 36, textWidth + 4, 10);
    ctx.fillStyle = "#000000";
    ctx.fillText(actionText, playerPos.x - textWidth / 2, playerPos.y - 28);

  }, [player, tiles, selectedAction]);

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
    
    if (selectedAction === "plant" && !tile.hasTree) {
      newTiles.set(key, { ...tile, hasTree: true, treeAge: 1 });
      setScore(s => ({ ...s, planted: s.planted + 1 }));
    } else if (selectedAction === "cut" && tile.hasTree) {
      newTiles.set(key, { ...tile, hasTree: false, treeAge: 0 });
      setScore(s => ({ ...s, cut: s.cut + 1 }));
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
    <RetroWindow title="Plant Some Trees!">
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
        </div>

        {/* Controls */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <RetroButton
            onClick={() => setSelectedAction("move")}
            className={selectedAction === "move" ? "btn-default" : ""}
          >
            Move (1)
          </RetroButton>
          <RetroButton
            onClick={() => setSelectedAction("plant")}
            className={selectedAction === "plant" ? "btn-default" : ""}
          >
            Plant Tree (2)
          </RetroButton>
          <RetroButton
            onClick={() => setSelectedAction("cut")}
            className={selectedAction === "cut" ? "btn-default" : ""}
          >
            Cut Tree (3)
          </RetroButton>
          <RetroButton onClick={executeAction}>
            Action (Space)
          </RetroButton>
          <RetroButton onClick={growTrees}>
            Grow Trees
          </RetroButton>
        </div>

        {/* Instructions & Stats */}
        <div
          style={{
            border: "2px solid black",
            padding: "12px",
            background: "white",
            fontSize: "13px",
            lineHeight: "1.6",
            fontFamily: "monospace"
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <strong>Controls:</strong>
            <br />
            • WASD or Arrow Keys - Move
            <br />
            • 1/2/3 - Select action (Move/Plant/Cut)
            <br />
            • Space/Enter - Execute action at current position
            <br />• Grow Trees button - Make all trees grow older
          </div>
          
          <div style={{ 
            display: "flex", 
            gap: "24px",
            paddingTop: "12px",
            borderTop: "2px solid black"
          }}>
            <div>
              <strong>Trees Planted:</strong> {score.planted}
            </div>
            <div>
              <strong>Trees Cut:</strong> {score.cut}
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
