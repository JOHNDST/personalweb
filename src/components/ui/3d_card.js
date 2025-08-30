"use client";

import { cn } from "../../lib/utils";
import React, { createContext, useState, useContext, useRef, useEffect } from "react";

const MouseEnterContext = createContext(undefined);

export const CardContainer = ({
  children,
  className = "",
  containerClassName = "",
  perspective = 1000,
  rotateStrength = 16,
  style,
  ...props
}) => {
  const containerRef = useRef(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);
  const raf = useRef();

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    const ry = px * rotateStrength;
    const rx = -py * rotateStrength;

    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      containerRef.current.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
  };

  const handleMouseEnter = () => setIsMouseEntered(true);
  const handleMouseLeave = () => {
    setIsMouseEntered(false);
    if (containerRef.current) containerRef.current.style.transform = "rotateX(0deg) rotateY(0deg)";
  };

  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      <div
        className={cn("flex items-center justify-center", containerClassName)}
        style={{ perspective: `${perspective}px`, ...style }}
        {...props}
      >
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={cn("relative transition-transform duration-200 will-change-transform", className)}
          style={{ transformStyle: "preserve-3d" }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
};

export const CardBody = ({ children, className = "", style, ...props }) => {
  return (
    <div
      className={cn("w-full h-full flex flex-col [transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d] w-full h-auto", className)}
      style={{ transformStyle: "preserve-3d", ...style }}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardItem = ({
  as: Tag = "div",
  children,
  className = "",
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...rest
}) => {
  const ref = useRef(null);
  const [isMouseEntered] = useMouseEnter();

  const base = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
  const flat = `translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;

  useEffect(() => {
    if (!ref.current) return;
    // Always set transform (so depth exists even if enter is blocked).
    ref.current.style.transform = isMouseEntered ? base : flat;
  }, [isMouseEntered, base]);

  return (
    <Tag
      ref={ref}
      className={cn("w-fit transition-transform duration-200 ease-linear will-change-transform", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
};

// Hook
export const useMouseEnter = () => {
  const ctx = useContext(MouseEnterContext);
  if (ctx === undefined) throw new Error("useMouseEnter must be used within CardContainer");
  return ctx;
};
