import React, { useEffect, useState, useRef, useMemo } from "react";

// Assuming you have 'motion' or framer-motion installed, fallback to standard if not.
// We'll just define the component using standard React logic.
import { animate } from "motion"; 

export default function PixelTrail(props) {
    const { 
        tileSize = 50, 
        trigger = "hover", 
        delay = 1, 
        transition = { duration: 0.5 }, 
        mode = "trail",
        backgroundColor = "#00000000", // Default transparent for background
        trailColor = "#FFFFFF" 
    } = props;
    
    const [isMousePressed, setIsMousePressed] = useState(false);
    const [tiles, setTiles] = useState([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [hoveredTiles, setHoveredTiles] = useState(new Set());
    const [tileColors, setTileColors] = useState({});
    
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const gridRef = useRef({ cols: 0, rows: 0 });
    const prevPositionRef = useRef(null);
    const timeoutRefs = useRef({});
    const animationRefs = useRef({});
    const mousePositionRef = useRef(null);
    const hoveredTilesRef = useRef(new Set());

    const updateHoveredTiles = updater => {
        const newTiles = typeof updater === "function" ? updater(hoveredTilesRef.current) : updater;
        hoveredTilesRef.current = newTiles;
        setHoveredTiles(newTiles);
    };

    useEffect(() => {
        if (!containerRef.current) return;
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
        const cols = Math.ceil(width / tileSize);
        const rows = Math.ceil(height / tileSize);
        gridRef.current = { cols, rows };
        setTiles(new Array(cols * rows).fill(false));
    }, [tileSize]);

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
                const newCols = Math.ceil(width / tileSize);
                const newRows = Math.ceil(height / tileSize);
                if (newCols !== gridRef.current.cols || newRows !== gridRef.current.rows) {
                    gridRef.current = { cols: newCols, rows: newRows };
                    setTiles(new Array(newCols * newRows).fill(false));
                    updateHoveredTiles(new Set());
                    setTileColors({});
                    Object.keys(timeoutRefs.current).forEach(key => {
                        clearTimeout(timeoutRefs.current[Number(key)]);
                        delete timeoutRefs.current[Number(key)];
                    });
                    Object.keys(animationRefs.current).forEach(key => {
                        animationRefs.current[Number(key)]?.stop?.();
                        delete animationRefs.current[Number(key)];
                    });
                }
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, [tileSize]);

    // Draw the grid with crossmarks
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        // Match actual display dimensions to draw crisp strokes
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        canvas.style.width = `${dimensions.width}px`;
        canvas.style.height = `${dimensions.height}px`;
        
        const { cols } = gridRef.current;

        // Fill entire background first (clears the canvas if transparent)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (backgroundColor !== "transparent" && !backgroundColor.endsWith(", 0)") && backgroundColor !== "#00000000") {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        for (let i = 0; i < tiles.length; i++) {
            const x = i % cols;
            const y = Math.floor(i / cols);
            
            if (tileColors[i]) {
                const centerX = x * tileSize + tileSize / 2;
                const centerY = y * tileSize + tileSize / 2;
                const crossSize = tileSize * 0.2; // Made smaller
                
                ctx.strokeStyle = tileColors[i];
                ctx.lineWidth = Math.max(1, tileSize * 0.05); // Thinner line
                ctx.lineCap = "butt";
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY - crossSize);
                ctx.lineTo(centerX, centerY + crossSize);
                ctx.moveTo(centerX - crossSize, centerY);
                ctx.lineTo(centerX + crossSize, centerY);
                ctx.stroke();
            }
        }
    }, [tiles, dimensions, backgroundColor, tileColors, tileSize]);

    const clearAnimation = index => {
        if (timeoutRefs.current[index]) {
            clearTimeout(timeoutRefs.current[index]);
            delete timeoutRefs.current[index];
        }
        if (animationRefs.current[index]) {
            animationRefs.current[index]?.stop?.();
            delete animationRefs.current[index];
        }
    };

    const startResetTimer = index => {
        if (mode === "drawing") return;
        clearAnimation(index);
        const onComplete = () => {
            setTiles(prev => {
                const newTiles = [...prev];
                newTiles[index] = false;
                return newTiles;
            });
            setTileColors(prev => {
                const newColors = { ...prev };
                delete newColors[index];
                return newColors;
            });
            delete timeoutRefs.current[index];
            delete animationRefs.current[index];
        };
        let shouldAnimate = true;
        if (typeof transition.duration === "number" && transition.duration <= 0) {
            shouldAnimate = false;
        }
        if (shouldAnimate) {
            setTileColors(prev => ({ ...prev, [index]: trailColor }));
            timeoutRefs.current[index] = window.setTimeout(() => {
                // Safely handle animation
                try {
                    const animation = animate(trailColor, "#00000000", {
                        ...transition,
                        onUpdate: latest => {
                            setTileColors(prev => ({ ...prev, [index]: latest }));
                        },
                        onComplete
                    });
                    animationRefs.current[index] = animation;
                } catch(e) {
                    onComplete();
                }
            }, delay * 1000);
        } else {
            const transitionDelay = transition.delay || 0;
            timeoutRefs.current[index] = window.setTimeout(onComplete, (delay + transitionDelay) * 1000);
        }
    };

    const getPointsOnLine = (x0, y0, x1, y1) => {
        const points = [];
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        for (let i = 0; i < 500; i++) {
            points.push(y0 * gridRef.current.cols + x0);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
        return points;
    };

    const isMouseInBounds = (mouseX, mouseY) => {
        return mouseX >= 0 && mouseX <= dimensions.width && mouseY >= 0 && mouseY <= dimensions.height;
    };

    const onMove = (x, y) => {
        if (navigator.maxTouchPoints) return;
        if (trigger === "hover" || (trigger === "click" && isMousePressed)) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const relativeX = x - rect.left;
            const relativeY = y - rect.top;
            if (!isMouseInBounds(relativeX, relativeY)) {
                handleMouseUp();
                return;
            }
            const currentX = Math.floor(relativeX / tileSize);
            const currentY = Math.floor(relativeY / tileSize);
            if (currentX < 0 || currentX >= gridRef.current.cols || currentY < 0 || currentY >= gridRef.current.rows) {
                return;
            }
            if (prevPositionRef.current) {
                const { x: prevX, y: prevY } = prevPositionRef.current;
                const points = getPointsOnLine(prevX, prevY, currentX, currentY);
                const validPoints = points.filter(index => index >= 0 && index < tiles.length);
                setTiles(prev => {
                    const newTiles = [...prev];
                    for (const index of validPoints) { newTiles[index] = true; }
                    return newTiles;
                });
                updateHoveredTiles(prev => new Set([...prev, ...validPoints]));
                setTileColors(prev => {
                    const newColors = { ...prev };
                    for (const index of validPoints) { newColors[index] = trailColor; }
                    return newColors;
                });
            }
            prevPositionRef.current = { x: currentX, y: currentY };
            const currentIndex = currentY * gridRef.current.cols + currentX;
            hoveredTilesRef.current.forEach(index => {
                if (index !== currentIndex && !getPointsOnLine(prevPositionRef.current?.x || currentX, prevPositionRef.current?.y || currentY, currentX, currentY).includes(index)) {
                    updateHoveredTiles(prev => {
                        const next = new Set(prev);
                        next.delete(index);
                        return next;
                    });
                    startResetTimer(index);
                }
            });
        }
    };

    const handleMouseUp = () => {
        if (navigator.maxTouchPoints) return;
        setIsMousePressed(false);
        prevPositionRef.current = null;
        if (mode !== "drawing") {
            hoveredTilesRef.current.forEach(index => {
                startResetTimer(index);
            });
        }
        updateHoveredTiles(new Set());
    };

    useEffect(() => {
        const handleGlobalMouseMove = e => {
            if (navigator.maxTouchPoints) return;
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            let isInside = (clientX >= 0 && clientY >= 0 && clientX <= innerWidth && clientY <= innerHeight);
            if (isInside) {
                mousePositionRef.current = [e.clientX, e.clientY];
                onMove(e.clientX, e.clientY);
            } else {
                handleMouseLeave();
            }
        };
        const handleGlobalMouseDown = e => {
            if (navigator.maxTouchPoints) return;
            if (trigger === "click") {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                const relativeX = e.clientX - rect.left;
                const relativeY = e.clientY - rect.top;
                if (!isMouseInBounds(relativeX, relativeY)) return;
                setIsMousePressed(true);
                const x = Math.floor(relativeX / tileSize);
                const y = Math.floor(relativeY / tileSize);
                const index = y * gridRef.current.cols + x;
                if (index >= tiles.length) return;
                updateHoveredTiles(prev => new Set(prev).add(index));
                setTiles(prev => {
                    const newTiles = [...prev];
                    newTiles[index] = true;
                    return newTiles;
                });
                setTileColors(prev => ({ ...prev, [index]: trailColor }));
            }
        };
        const handleScroll = () => {
            if (navigator.maxTouchPoints) return;
            if (mousePositionRef.current) {
                const [mouseX, mouseY] = mousePositionRef.current;
                onMove(mouseX, mouseY);
            }
        };
        const handleMouseLeave = e => {
            if (navigator.maxTouchPoints) return;
            if (!e || !isMouseInBounds(e.clientX, e.clientY)) {
                prevPositionRef.current = null;
                hoveredTilesRef.current.forEach(startResetTimer);
                updateHoveredTiles(new Set());
            }
        };
        const handleMouseEnter = e => {
            if (navigator.maxTouchPoints) return;
            if (!isMouseInBounds(prevPositionRef.current?.x, prevPositionRef.current?.y)) {
                prevPositionRef.current = null;
            }
        };
        const container = containerRef.current;
        if (container) {
            container.addEventListener("mouseenter", handleMouseEnter);
            container.addEventListener("mouseleave", handleMouseLeave);
        }
        window.addEventListener("mousemove", handleGlobalMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mousedown", handleGlobalMouseDown);
        window.addEventListener("scroll", handleScroll);
        window.addEventListener("mouseleave", handleMouseLeave);
        return () => {
            if (container) {
                container.removeEventListener("mouseenter", handleMouseEnter);
                container.removeEventListener("mouseleave", handleMouseLeave);
            }
            window.removeEventListener("mousemove", handleGlobalMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("mousedown", handleGlobalMouseDown);
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [trigger, tileSize, tiles.length, trailColor, isMousePressed]);

    return (
        <div ref={containerRef} style={{ ...props.style, position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", overflow: "hidden", pointerEvents: "none", zIndex: 9999 }}>
            <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0 }} />
        </div>
    );
}