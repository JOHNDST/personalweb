// src/pages/news/index.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import "./style.css";
import { Timeline } from "../../components/ui/timeline"; // use default if that's how you exported it

// Parse sections by H1 (# YEAR), then items by "- `YYYY-MM-DD`"
function parseYears(md) {
  const src = (md || "").replace(/\r\n/g, "\n");

  // Find all H1 sections
  const h1Matches = [...src.matchAll(/^#\s+(.+?)\s*$/gm)];
  if (h1Matches.length === 0) {
    // Fallback: treat the whole document as a single unnamed section
    return [{ title: "", items: parseItems(src) }];
  }

  const sections = [];
  for (let i = 0; i < h1Matches.length; i++) {
    const title = h1Matches[i][1].trim(); // e.g., "2025"
    const start = h1Matches[i].index + h1Matches[i][0].length;
    const end = i + 1 < h1Matches.length ? h1Matches[i + 1].index : src.length;
    const body = src.slice(start, end).trim();
    sections.push({ title, items: parseItems(body) });
  }
  return sections;
}

// Items look like:
// - `2025-09-01`
// Description line 1
// Description line 2
// (until next "- `date`" or next "# " or end)
function parseItems(sectionText) {
  const items = [];
  const re =
    /-\s*`?(\d{4}-\d{2}-\d{2})`?\s*\n([\s\S]*?)(?=(?:\n-\s*`?\d{4}-\d{2}-\d{2}`?\s*\n)|(?:\n#\s+)|$)/g;
  let m;
  while ((m = re.exec(sectionText)) !== null) {
    const date = m[1];
    const body = (m[2] || "").trim();
    items.push({ date, bodyMd: body });
  }
  // Sort newest → oldest by date
  items.sort((a, b) => b.date.localeCompare(a.date));
  return items;
}

export default function TimelineDemo() {
  const [md, setMd] = useState("");

  useEffect(() => {
    const base =
      (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) ||
      process.env.PUBLIC_URL ||
      "/";
    fetch(`${base.replace(/\/+$/, "")}/news.md`)
      .then((r) => r.text())
      .then(setMd)
      .catch(() =>
        setMd(
          "# 1970\n- `1970-01-01`\nFailed to load :warning:\nCheck that /public/news.md exists."
        )
      );
  }, []);

  const sections = useMemo(() => parseYears(md), [md]);

  const data = useMemo(
    () =>
      sections.map((sec, i) => ({
        title: sec.title || "", // e.g., "2025"
        content: (
          <div className="news-group">
            <ul className="news-list">
              {sec.items.map((it) => (
                <li key={`${sec.title}-${it.date}`} className="news-item">
                  <time className="news-date">{it.date}</time>
                  <div className="news-body">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, [remarkEmoji, { padSpaceAfter: true }]]}
                    >
                      {it.bodyMd}
                    </ReactMarkdown>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ),
      })),
    [sections]
  );

  return (
    <div className="news-page">
      <Timeline data={data} />
    </div>
  );
}
