"use client";
import React, { useEffect, useRef } from "react";

/**
 * Two concentric tilted rings centered on the left edge of the viewport.
 *
 *  - Outer ring (news): rotates per item — focused entry sits at 3 o'clock.
 *  - Inner ring (years): rotates only when the focused YEAR changes, so the
 *    year tag is pinned while scrolling within the same year.
 *  - Empty annular slots are decorated with ASCII chars.
 *  - Rotation velocity drives an isotropic motion blur on the canvas.
 *  - The chevron pointer follows the focused label — both share y = cy.
 */
export function NewsTurntable({ items, focusIndex }) {
  const canvasRef = useRef(null);
  const itemsRef = useRef(items);
  const focusRef = useRef(0);

  // News (item-level) rotation
  const itemRotRef = useRef(0);
  const itemTargetRef = useRef(0);

  // Year (year-level) rotation — independent
  const yearRotRef = useRef(0);
  const yearTargetRef = useRef(0);
  const yearListRef = useRef([]);

  useEffect(() => {
    itemsRef.current = items;
    const ys = [];
    for (const it of items) if (!ys.includes(it.year)) ys.push(it.year);
    yearListRef.current = ys;
  }, [items]);

  useEffect(() => {
    focusRef.current = focusIndex;
    const items = itemsRef.current;
    const N = items.length;
    if (N > 0) itemTargetRef.current = focusIndex * ((2 * Math.PI) / N);

    const years = yearListRef.current;
    const focusYear = items[focusIndex]?.year;
    const yIdx = years.indexOf(focusYear);
    if (yIdx >= 0 && years.length > 0) {
      yearTargetRef.current = yIdx * ((2 * Math.PI) / years.length);
    }
  }, [focusIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, dpr = 1;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight - 60;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    window.addEventListener("resize", resize);

    const drawEllipse = (cx, cy, rx, ry, color, dash) => {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      if (dash) ctx.setLineDash(dash);
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    };

    let raf;
    const draw = () => {
      const items = itemsRef.current;
      const N = items.length;

      // Smooth rotations
      const itemDiff = itemTargetRef.current - itemRotRef.current;
      itemRotRef.current += itemDiff * 0.085;
      const yearDiff = yearTargetRef.current - yearRotRef.current;
      yearRotRef.current += yearDiff * 0.10;

      ctx.clearRect(0, 0, W, H);

      if (N === 0) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const angleStep = (2 * Math.PI) / N;
      const focusIdx = focusRef.current;

      // Geometry — large wheel anchored to the left edge; OK to overflow.
      const cx = -W * 0.04;
      const cy = H / 2;
      const Rout = Math.min(H * 0.62, W * 0.50);
      const Rin = Rout * 0.50;
      const tilt = 0.42;
      const cosT = Math.cos(tilt);

      // Base ring guides
      drawEllipse(cx, cy, Rout, Rout * cosT, "rgba(35, 93, 25, 0.18)", [4, 6]);
      drawEllipse(cx, cy, Rin,  Rin  * cosT, "rgba(35, 93, 25, 0.22)", [3, 5]);

      // ASCII texture in the annulus
      const decoSlots = 96;
      const decoChars = ["·", "·", "·", "─", "·", "═", "·", "·", "·", "▪"];
      for (let i = 0; i < decoSlots; i++) {
        const a = (i / decoSlots) * 2 * Math.PI - itemRotRef.current;
        const cosA = Math.cos(a);
        if (cosA < -0.18) continue;
        let near = false;
        for (let j = 0; j < N; j++) {
          let d = (a - (j * angleStep - itemRotRef.current)) % (2 * Math.PI);
          if (d > Math.PI) d -= 2 * Math.PI;
          if (d < -Math.PI) d += 2 * Math.PI;
          if (Math.abs(d) < angleStep * 0.45) { near = true; break; }
        }
        if (near) continue;
        const sinA = Math.sin(a);
        const depth = (cosA + 0.18) / 1.18;
        const ch = decoChars[i % decoChars.length];
        for (let r = Rin + 22; r < Rout - 6; r += 26) {
          const x = cx + r * cosA;
          const y = cy + r * sinA * cosT;
          ctx.save();
          ctx.fillStyle = `rgba(35, 93, 25, ${0.12 + 0.18 * depth})`;
          ctx.font = `${10 + 2 * depth}px "PixelNormal", monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(ch, x, y);
          ctx.restore();
        }
      }

      // Inner ASCII rim (uses YEAR rotation so it stays in sync with years)
      const rimSlots = 72;
      for (let i = 0; i < rimSlots; i++) {
        const a = (i / rimSlots) * 2 * Math.PI - yearRotRef.current;
        const cosA = Math.cos(a);
        if (cosA < -0.18) continue;
        const sinA = Math.sin(a);
        const r = Rin - 10;
        const x = cx + r * cosA;
        const y = cy + r * sinA * cosT;
        const depth = (cosA + 0.18) / 1.18;
        ctx.save();
        ctx.fillStyle = `rgba(35, 93, 25, ${0.16 + 0.20 * depth})`;
        ctx.font = `${9 + 2 * depth}px "PixelNormal", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(i % 4 === 0 ? "+" : "·", x, y);
        ctx.restore();
      }

      // Outer ring: news date labels
      let focusDot = null;
      let focusLabel = null;
      for (let i = 0; i < N; i++) {
        const a = i * angleStep - itemRotRef.current;
        const cosA = Math.cos(a);
        if (cosA < -0.06) continue;
        const sinA = Math.sin(a);
        const x = cx + Rout * cosA;
        const y = cy + Rout * sinA * cosT;
        const isFocus = i === focusIdx;
        const depth = (cosA + 0.06) / 1.06;
        const fontSize = (isFocus ? 26 : 13) * (0.6 + 0.4 * depth);
        const opacity = 0.32 + 0.68 * depth;
        const dateStr = items[i].date.slice(5);

        ctx.save();
        const dotR = isFocus ? 8 : 3.4;
        ctx.fillStyle = isFocus
          ? `rgba(74, 143, 58, ${opacity})`
          : `rgba(35, 93, 25, ${opacity * 0.55})`;
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, 2 * Math.PI);
        ctx.fill();
        if (isFocus) {
          ctx.strokeStyle = `rgba(31, 32, 24, ${opacity})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, dotR + 5, 0, 2 * Math.PI);
          ctx.stroke();
        }

        if (!isFocus) {
          ctx.fillStyle = `rgba(31, 32, 24, ${opacity * 0.6})`;
          ctx.font = `${fontSize}px "PixelNormal", monospace`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(dateStr, x + 10, y);
        } else {
          // Defer drawing the focused label so it renders ABOVE everything,
          // and so we can draw the chevron right after it (sharing y).
          focusDot = { x, y, dotR };
          focusLabel = { dateStr, fontSize, opacity, x, y };
        }
        ctx.restore();
      }

      // Inner ring: years (independent rotation)
      const years = yearListRef.current;
      const yearStep = years.length > 0 ? (2 * Math.PI) / years.length : 0;
      const focusYear = items[focusIdx]?.year;
      for (let yi = 0; yi < years.length; yi++) {
        const year = years[yi];
        const a = yi * yearStep - yearRotRef.current;
        const cosA = Math.cos(a);
        if (cosA < -0.06) continue;
        const sinA = Math.sin(a);
        const x = cx + Rin * cosA;
        const y = cy + Rin * sinA * cosT;
        const isActive = year === focusYear;
        const depth = (cosA + 0.06) / 1.06;
        const fontSize = (isActive ? 110 : 44) * (0.55 + 0.45 * depth);
        const opacity = 0.65 + 0.35 * depth;

        ctx.save();
        ctx.fillStyle = isActive
          ? `rgba(35, 93, 25, ${opacity})`
          : `rgba(88, 89, 82, ${opacity * 0.45})`;
        ctx.font = `bold ${fontSize}px "PixelHead", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(year, x, y);
        if (isActive) {
          ctx.fillStyle = `rgba(74, 143, 58, ${opacity * 0.7})`;
          ctx.fillRect(x - fontSize * 0.95, y + fontSize * 0.50, fontSize * 1.9, 2);
        }
        ctx.restore();
      }

      // Focus row: dot → label → chevron, all on y = focusDot.y so they share
      // the same horizontal centerline.
      if (focusDot && focusLabel) {
        const { x, y } = focusLabel;
        const labelX = x + 18;

        // soft connector tick from dot to label
        ctx.save();
        ctx.strokeStyle = "rgba(74, 143, 58, 0.55)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(focusDot.x + focusDot.dotR + 4, y);
        ctx.lineTo(labelX - 6, y);
        ctx.stroke();
        ctx.restore();

        // label
        ctx.save();
        ctx.fillStyle = `rgba(31, 32, 24, ${focusLabel.opacity})`;
        ctx.font = `bold ${focusLabel.fontSize}px "PixelNormal", monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(focusLabel.dateStr, labelX, y);
        const labelW = ctx.measureText(focusLabel.dateStr).width;
        ctx.restore();

        // chevron immediately after the label, vertically centered on y
        const chX = labelX + labelW + 18;
        const chH = focusLabel.fontSize * 0.55;
        ctx.save();
        ctx.fillStyle = "rgba(74, 143, 58, 0.85)";
        ctx.strokeStyle = "rgba(35, 93, 25, 0.95)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(chX,             y - chH * 0.5);
        ctx.lineTo(chX + chH * 0.8, y);
        ctx.lineTo(chX,             y + chH * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="news-turntable" aria-hidden="true" />;
}

export default NewsTurntable;
