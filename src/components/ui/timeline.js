// src/components/ui/timeline.js
"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import "./timeline.css";

export const Timeline = ({ data = [] }) => {
  const measureRef = useRef(null);
  const containerRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!measureRef.current) return;
    const el = measureRef.current;

    // Keep the line height correct as content (images) loads/resizes
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setHeight(rect.height);
    });
    ro.observe(el);

    // initial measure
    setHeight(el.getBoundingClientRect().height);

    return () => ro.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="tl-root" ref={containerRef}>
      <div className="tl-header">
        <h1 className="tl-title">News &amp; Updates</h1>
        <p className="tl-subtitle">
          Check out my latest research, projects, and publications.
        </p>
      </div>

      <div className="tl-inner" ref={measureRef}>
        {data.map((item, index) => (
          <div key={index} className="tl-row">
            {/* Left column for large sticky title on desktop */}
            <div className="tl-left">
              <h3 className="tl-year tl-year-desktop">{item.title}</h3>
            </div>

            {/* Right content */}
            <div className="tl-right">
              <h3 className="tl-year tl-year-mobile">{item.title}</h3>
              {item.content}
            </div>

            {/* Dot for this row */}
            <span className="tl-dot" aria-hidden="true" />
          </div>
        ))}

        {/* Vertical line & animated progress */}
        <div className="tl-line" style={{ height: `${height}px` }} aria-hidden="true">
          <motion.div
            className="tl-line-progress"
            style={{ height: heightTransform, opacity: opacityTransform }}
          />
        </div>
      </div>
    </div>
  );
};

export default Timeline;
