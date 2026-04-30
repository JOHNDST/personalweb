import React, { useRef, useEffect } from "react";
import "./style.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Typewriter from "typewriter-effect";
import { introdata, meta } from "../../content_option";
import { Link } from "react-router-dom";
import { PixelMapScene } from "../../components/PixelMapScene";

// Subtle forest-green cursor trail for the light theme
const CursorCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const trail = [];
    const onMove = (e) => {
      trail.push({ x: e.clientX, y: e.clientY, life: 1 });
      if (trail.length > 22) trail.shift();
    };
    window.addEventListener("mousemove", onMove);

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i];
        p.life -= 0.06;
        if (p.life <= 0) { trail.splice(i, 1); continue; }
        const sz = Math.max(1, Math.ceil(p.life * 5));
        ctx.fillStyle = `rgba(35, 93, 25, ${p.life * 0.35})`;
        ctx.fillRect(
          Math.round(p.x) - Math.floor(sz / 2),
          Math.round(p.y) - Math.floor(sz / 2),
          sz, sz
        );
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(animId);
    };
  }, []);
  return <canvas ref={canvasRef} className="cursor-canvas" />;
};

export const Home = () => {
  const titleStr = introdata.title;
  const bracketIdx = titleStr.indexOf("[");
  const nameMain = bracketIdx >= 0 ? titleStr.slice(0, bracketIdx).trim() : titleStr;
  const nameAlias = bracketIdx >= 0 ? titleStr.slice(bracketIdx).trim() : "";

  return (
    <HelmetProvider>
      <section id="home" className="home home-bg">
        <Helmet>
          <meta charSet="utf-8" />
          <title>{meta.title}</title>
          <meta name="description" content={meta.description} />
        </Helmet>

        {/* Full-screen pixel-art site plan */}
        <div className="bg-scene">
          <PixelMapScene />
        </div>

        <div className="scanlines" aria-hidden="true" />

        {/* Text overlay */}
        <div className="home-overlay">
          <div className="intro">
            <h1 className="hero-title">
              <span className="name-main">{nameMain}</span>
              {nameAlias && <span className="name-alias">{nameAlias}</span>}
            </h1>

            <h2 className="hero-role">
              <Typewriter
                options={{
                  strings: [
                    introdata.animated.first,
                    introdata.animated.second,
                    introdata.animated.third,
                  ],
                  autoStart: true,
                  loop: true,
                  deleteSpeed: 10,
                }}
              />
            </h2>

            <p className="hero-desc">
              Research Focus:<mark className="desc-mark">Decision Support</mark> in <mark className="desc-mark">Landscape</mark> and Urban Systems.
            </p>

            <div className="intro_btn-action pb-5">
              <Link to="/portfolio" className="text_2">
                <div id="button_p" className="ac_btn btn">
                  My Portfolio
                </div>
              </Link>
              <Link to="/research">
                <div id="button_h" className="ac_btn btn">
                  My Research
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </HelmetProvider>
  );
};
