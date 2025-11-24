import React, { useState, useEffect, useRef } from 'react';

export const DitheredImage = ({ src, alt, width, height, threshold = 128, style }) => {
  const [ditheredImage, setDitheredImage] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!src) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);
      
      const imageData = ctx.getImageData(0, 0, width, height);
      const { data } = imageData;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          
          const gray = Math.round(
            0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
          );
          
          const newValue = gray > threshold ? 255 : 0;
          const error = gray - newValue;

          data[idx] = newValue;
          data[idx + 1] = newValue;
          data[idx + 2] = newValue;

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
        setDitheredImage(src);
      }
    };
    img.onerror = () => {
        setDitheredImage(src);
    };
    
    if (src.startsWith('http')) {
        const cleanUrl = src.replace(/^https?:\/\//, '');
        img.src = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&w=${width}&h=${height}&fit=cover&output=jpg`;
    } else {
        img.src = src;
    }
  }, [src, width, height, threshold]);

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div style={{ 
          width: width, 
          height: height, 
          border: "2px solid black", 
          overflow: "hidden",
          ...style 
      }}>
        {(ditheredImage || src) && (
          <img
            src={ditheredImage || src}
            alt={alt}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              imageRendering: "pixelated",
            }}
          />
        )}
      </div>
    </>
  );
};
