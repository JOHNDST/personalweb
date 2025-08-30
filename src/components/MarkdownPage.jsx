import React, { useEffect, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./markdown.css";
import rehypeRaw from "rehype-raw";

export default function MarkdownPage({ file }) {
  const [content, setContent] = useState("");

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

  return (
    <div className="markdown-body">
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
}
