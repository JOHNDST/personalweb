import React, { useEffect, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./markdown.css";
import rehypeRaw from "rehype-raw";
import { Link } from "react-router-dom";
import Project3DView from "./Project3DView";
import { RetroWindow } from "./retro/RetroWindow";

export default function MarkdownPage({ file, modelUrl, project }) {
  const [content, setContent] = useState("");
  const [showModel, setShowModel] = useState(true);

  // Absolute URL & dir of the MD file (includes /personalweb if you use basename)
  const mdUrl = useMemo(() => new URL(file, window.location.origin), [file]);
  const mdDir = useMemo(() => mdUrl.pathname.replace(/[^/]+$/, ""), [mdUrl]);

  useEffect(() => {
    fetch(file)
      .then(r => (r.ok ? r.text() : Promise.reject(new Error(r.statusText))))
      .then(setContent)
      .catch(e => {
        console.error("Failed to load markdown:", e);
        setContent("# 404\nFile not found.");
      });
  }, [file]);

  // Reset showModel when modelUrl changes (e.g. navigating between projects)
  useEffect(() => {
    if (modelUrl) {
      setShowModel(true);
    }
  }, [modelUrl]);

  const MarkdownContent = () => (
    <div className="markdown-body" style={modelUrl && showModel ? { maxWidth: '100%', padding: '40px', margin: 0 } : {}}>
      <div style={{ marginBottom: "20px" }}>
        <Link to="/portfolio" className="btn-ghost" style={{ textDecoration: "none", display: "inline-block", padding: "8px 16px", border: "1px solid #000", borderRadius: "4px", color: "#000" }}>
          &larr; Back to Portfolio
        </Link>
      </div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          img(props) {
            let { src = "" } = props;
            const isHttp = /^https?:\/\//i.test(src);
            const isAbsRoot = src.startsWith("/");

            // Resolve relative to the MD file directory; do NOT add PUBLIC_URL here
            let finalSrc = src;
            if (!isHttp && !isAbsRoot) {
              finalSrc = new URL(src, window.location.origin + mdDir).pathname;
            } else if (isAbsRoot) {
              // already absolute (e.g., /content/...), leave it as-is
              finalSrc = src;
            }

            return <img {...props} src={finalSrc} alt={props.alt || ""} />;
          },
    
        }}
        skipHtml={false}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  if (modelUrl && showModel) {
    return (
      <div className="split-layout" style={{ display: 'flex', height: '90vh', width: '100vw', overflow: 'hidden', backgroundColor: 'white', paddingTop: '30px', paddingLeft: '30px' }}>
        <div className="model-window" style={{ flex: '1', height: '90%', position: 'relative', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', minWidth: '250px' }}>
           <RetroWindow 
              title="3D Model View" 
              onClose={(e) => {
                e.stopPropagation();
                setShowModel(false);
              }}
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
           >
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <Project3DView modelUrl={modelUrl} />
                
                {/* Instructions */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '8px',
                  border: '1px solid black',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  pointerEvents: 'none',
                  zIndex: 10
                }}>
                  Left Click: Rotate<br/>
                  Right Click: Pan<br/>
                  Scroll: Zoom
                </div>

                {/* Credits */}
                {project && project.authors && (
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '8px',
                    border: '1px solid black',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    pointerEvents: 'none',
                    textAlign: 'right',
                    zIndex: 10,
                    maxWidth: '200px'
                  }}>
                    <strong>CREDITS</strong><br/>
                    {project.authors}
                  </div>
                )}
              </div>
           </RetroWindow>
        </div>
        <div className="content-scroll" style={{ flex: '1', height: '100%', overflowY: 'auto', backgroundColor: 'white', minWidth: '300px' }}>
           <MarkdownContent />
        </div>
        <style>{`
          @media (max-width: 768px) {
            .split-layout {
              flex-direction: column !important;
              height: auto !important;
              overflow: auto !important;
              padding-top: 80px !important; /* More space on mobile for header */
              padding-left: 0 !important;
            }
            .model-window {
              height: 50vh !important;
              flex: none !important;
            }
            .content-scroll {
              height: auto !important;
              flex: none !important;
              overflow: visible !important;
            }
          }
        `}</style>
      </div>
    );
  }

  return <MarkdownContent />;
}
