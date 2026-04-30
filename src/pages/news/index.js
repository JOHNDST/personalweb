// src/pages/news/index.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import { motion } from "motion/react";
import "./style.css";
import { NewsTurntable } from "../../components/NewsTurntable";

function parseYears(md) {
  const src = (md || "").replace(/\r\n/g, "\n");
  const h1Matches = [...src.matchAll(/^#\s+(.+?)\s*$/gm)];
  if (h1Matches.length === 0) return [{ title: "", items: parseItems(src) }];
  const sections = [];
  for (let i = 0; i < h1Matches.length; i++) {
    const title = h1Matches[i][1].trim();
    const start = h1Matches[i].index + h1Matches[i][0].length;
    const end = i + 1 < h1Matches.length ? h1Matches[i + 1].index : src.length;
    sections.push({ title, items: parseItems(src.slice(start, end).trim()) });
  }
  return sections;
}

function parseItems(sectionText) {
  const items = [];
  const re =
    /-\s*`?(\d{4}-\d{2}-\d{2})`?\s*\n([\s\S]*?)(?=(?:\n-\s*`?\d{4}-\d{2}-\d{2}`?\s*\n)|(?:\n#\s+)|$)/g;
  let m;
  while ((m = re.exec(sectionText)) !== null) {
    items.push({ date: m[1], bodyMd: (m[2] || "").trim() });
  }
  items.sort((a, b) => b.date.localeCompare(a.date));
  return items;
}

function classify(text) {
  const t = text.toLowerCase();
  if (/peer review/.test(t))                                          return { kind: "review",    label: "REVIEW" };
  if (/(paper|our paper).*(accepted|published)|papers? got accepted/.test(t))
                                                                       return { kind: "paper",     label: "PUBLICATION" };
  if (/present(ed|ing)|poster session|conference|workshop|annual meeting/.test(t))
                                                                       return { kind: "talk",      label: "TALK" };
  if (/award|won|funding|selected|fellow|grant/.test(t))               return { kind: "award",     label: "AWARD" };
  if (/developed|launched|released|built/.test(t))                     return { kind: "tool",      label: "TOOL" };
  if (/started|joined|began/.test(t))                                  return { kind: "milestone", label: "MILESTONE" };
  return { kind: "update", label: "UPDATE" };
}

function NewsItem({ item, index, isFocus, isLatest, registerRef }) {
  const cat = classify(item.bodyMd);
  return (
    <motion.li
      ref={(el) => registerRef(index, el)}
      data-idx={index}
      data-kind={cat.kind}
      className={`news-item${isFocus ? " is-focus" : ""}${isLatest ? " is-latest" : ""}`}
      initial={{ opacity: 0, x: 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {isLatest && (
        <div className="news-latest-flag">
          <span className="news-latest-tick" />
          <span className="news-latest-label">// LATEST UPDATE</span>
          <span className="news-latest-pulse" aria-hidden="true">
            <span className="news-latest-pulse-dot" />
            <span className="news-latest-pulse-ring" />
          </span>
        </div>
      )}
      <header className="news-item-header">
        <time className="news-date">{item.date}</time>
        <span className={`news-badge news-badge--${cat.kind}`}>{cat.label}</span>
      </header>
      <div className="news-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, [remarkEmoji, { padSpaceAfter: true }]]}
        >
          {item.bodyMd}
        </ReactMarkdown>
      </div>
    </motion.li>
  );
}

export default function NewsPage() {
  const [md, setMd] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);
  const itemRefs = useRef(new Map());

  useEffect(() => {
    const base =
      (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) ||
      process.env.PUBLIC_URL ||
      "/";
    fetch(`${base.replace(/\/+$/, "")}/news.md`)
      .then((r) => r.text())
      .then(setMd)
      .catch(() =>
        setMd("# 1970\n- `1970-01-01`\nFailed to load :warning:\nCheck that /public/news.md exists.")
      );
  }, []);

  const sections = useMemo(() => parseYears(md), [md]);

  // Flatten all items (already sorted DESC within each section), then re-sort
  // globally by date descending so the wheel reflects true chronology.
  const allItems = useMemo(() => {
    const flat = [];
    for (const sec of sections) {
      for (const it of sec.items) flat.push({ ...it, year: sec.title });
    }
    flat.sort((a, b) => b.date.localeCompare(a.date));
    return flat;
  }, [sections]);

  const registerRef = (idx, el) => {
    if (el) itemRefs.current.set(idx, el);
    else itemRefs.current.delete(idx);
  };

  // Track which item is closest to the viewport center; that's the "focus".
  useEffect(() => {
    if (allItems.length === 0) return;
    let ticking = false;
    const compute = () => {
      const center = window.innerHeight / 2;
      let bestIdx = 0;
      let bestDist = Infinity;
      itemRefs.current.forEach((el, idx) => {
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const d = Math.abs(mid - center);
        if (d < bestDist) { bestDist = d; bestIdx = idx; }
      });
      setFocusIndex(bestIdx);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [allItems]);

  return (
    <div className="news-page">
      <NewsTurntable items={allItems} focusIndex={focusIndex} />

      <div className="news-content">
        <header className="news-header">
          <div className="news-header-tick">
            <span className="news-header-tick-line" />
            <span className="news-header-tick-label">// JOURNAL · {allItems.length || "—"} ENTRIES</span>
          </div>
          <h1 className="news-title">News &amp; Updates</h1>
          <p className="news-subtitle">
            Scroll the wheel — research, talks, papers, peer review, awards.
          </p>
        </header>

        <ol className="news-list">
          {allItems.map((it, i) => (
            <NewsItem
              key={`${it.date}-${i}`}
              item={it}
              index={i}
              isFocus={i === focusIndex}
              isLatest={i === 0}
              registerRef={registerRef}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}
