import React, { useState, useEffect, useRef } from 'react';
import './style.css';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Container, Row, Col } from 'react-bootstrap';
import { researchdata, meta } from '../../content_option';

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
  return (
    <HelmetProvider>
      <Container className="About-header">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Research | {meta.title}</title>
          <meta name="description" content={meta.description} />
        </Helmet>
        <Row className="mb-5 mt-3 pt-md-3">
          <Col lg="8">
            <h1 className="display-4 mb-4">Research</h1>
            <hr className="t_border my-4 ml-0 text-left" />
          </Col>
        </Row>
        <div className="mb-5">
        {researchdata.map((data, i) => (
          <ResearchCard
            key={i}
            title={data.title}
            authors={data.authors}
            date={data.date}
            abstract={data.abstract}
            coverImage={data.img}
            link={data.link}
            ditherThreshold={data.ditherThreshold}
          />
        ))}
        </div>
      </Container>
    </HelmetProvider>
  );
};