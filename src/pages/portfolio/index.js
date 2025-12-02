import React, { useState } from "react";
import { createPortal } from "react-dom";
import "./style.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { dataportfolio, meta } from "../../content_option";
import { Link } from "react-router-dom";
import medalIcon from "../../images/medal.png";

// ⬇️ 3D card components
import { CardBody, CardContainer, CardItem } from "../../components/ui/3d_card";

const AuthorDisplay = ({ authors }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const maxLength = 35;

  const isLong = authors && authors.length > maxLength;
  const displayAuthors = isLong ? authors.substring(0, maxLength) + "..." : authors;

  const handleMouseMove = (e) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <span style={{ whiteSpace: "nowrap", display: "inline-block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "bottom" }}>
        {isLong ? authors.substring(0, maxLength) : authors}
        {isLong && (
          <span
            style={{ cursor: "pointer", color: "blue", marginLeft: "2px", display: "inline-block" }}
            onMouseEnter={(e) => {
                setShowTooltip(true);
                setTooltipPos({ x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => setShowTooltip(false)}
            onMouseMove={handleMouseMove}
          >
            &gt;&gt;&gt;
          </span>
        )}
      </span>
      {showTooltip && createPortal(
        <div
          style={{
            position: "fixed",
            top: tooltipPos.y + 15,
            left: tooltipPos.x + 15,
            backgroundColor: "rgba(0,0,0,0.9)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: "5px",
            zIndex: 9999,
            pointerEvents: "none",
            maxWidth: "300px",
            fontSize: "0.85rem",
            whiteSpace: "normal",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
          }}
        >
          {authors}
        </div>,
        document.body
      )}
    </>
  );
};

const Medal = ({ awardName }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div
        style={{
          cursor: "pointer",
          color: "#FFD700", // Gold color
        }}
        onMouseEnter={(e) => {
          setShowTooltip(true);
          setTooltipPos({ x: e.clientX, y: e.clientY });
        }}
        onMouseLeave={() => setShowTooltip(false)}
        onMouseMove={handleMouseMove}
      >
        <img src={medalIcon} alt="Award" width="48" height="48" />
      </div>
      {showTooltip && createPortal(
        <div
          style={{
            position: "fixed",
            top: tooltipPos.y + 15,
            left: tooltipPos.x + 15,
            backgroundColor: "rgba(0,0,0,0.9)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: "5px",
            zIndex: 9999,
            pointerEvents: "none",
            maxWidth: "300px",
            fontSize: "0.85rem",
            whiteSpace: "normal",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
          }}
        >
          {awardName}
        </div>,
        document.body
      )}
    </>
  );
};

export const Portfolio = () => {
  const [selectedTag, setSelectedTag] = useState("All");

  // Extract unique tags
  const allTags = ["All", ...new Set(dataportfolio.flatMap(item => 
    item.tag ? item.tag.split(";").map(t => t.trim()) : []
  ))];

  // Filter projects
  const filteredPortfolio = selectedTag === "All" 
    ? dataportfolio 
    : dataportfolio.filter(item => {
        if (!item.tag) return false;
        const tags = item.tag.split(";").map(t => t.trim());
        return tags.includes(selectedTag);
      });

  return (
    <HelmetProvider>
      <Container className="portfolio-header">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Portfolio | {meta.title}</title>
          <meta name="description" content={meta.description} />
        </Helmet>

        <Row className="mb-5 mt-3 align-items-end">
          <Col lg="8">
            <h1 className="display-4 mb-4">Portfolio</h1>
            <hr className="t_border my-4 ml-0 text-left" />
          </Col>
          <Col lg="4" className="d-flex justify-content-lg-end align-items-center mb-4 mb-lg-0">
            <div className="d-flex justify-content-lg-end">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                style={{
                  padding: "8px 15px",
                  borderRadius: "5px",
                  border: "1px solid",
                  background: "transparent",
                  cursor: "pointer",
                  minWidth: "150px"
                }}
                aria-label="Filter projects"
              >
                {allTags.map((tag, i) => (
                  <option key={i} value={tag} style={{ color: "black" }}>
                    {tag.replace("#", "")}
                  </option>
                ))}
              </select>
            </div>
          </Col>
        </Row>

        <div className="masonry-grid">
          {filteredPortfolio.map((data, i) => (
            <div key={i} className="masonry-item">
              <CardContainer className="inter-var w-full h-auto rounded-xl p-6 border" style={{ perspective: 1000 }}>
                <CardBody className="!bg-red-500 p-4 rounded w-full h-full flex flex-col justify-between relative">
                  {data.award && (
                    <CardItem
                      translateZ={60}
                      className="z-20"
                      style={{ position: "absolute", top: "15px", right: "15px" }}
                    >
                      <Medal awardName={data.award} />
                    </CardItem>
                  )}
                  <div style={{ transformStyle: "preserve-3d" }}>
                    <CardItem as="h3" translateZ={50} className="text-xl font-bold">
                      {data.title}
                    </CardItem>

                    <CardItem translateZ={30} className="text-neutral-500 text-sm mt-2 dark:text-neutral-300">
                      <AuthorDisplay authors={data.authors} />
                    </CardItem>

                    {data.tag && (
                      <CardItem translateZ={40} className="w-full mt-2">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {String(data.tag).split(";").map((tag, i) => (
                            <span
                              key={i}
                              style={{
                                backgroundColor: "#333",
                                color: "#fff",
                                padding: "4px 10px",
                                borderRadius: "12px",
                                fontSize: "0.75rem",
                                display: "inline-block",
                              }}
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </CardItem>
                    )}
                    
                    {data.date && (
                      <CardItem as="p" translateZ={30} className="text-neutral-500 text-xs mt-1 dark:text-neutral-400">
                        {data.date}
                      </CardItem>
                    )}

                    <CardItem translateZ={70} className="mt-4">

                      <div style={{ aspectRatio: "305 / 180", borderRadius: "0.75rem", overflow: "hidden" }}>
                        <img
                          src={data.img}
                          alt={data.title}
                          width={305}
                          height={180}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    </CardItem>
                  </div>

                  <div className="flex justify-end" style={{ transformStyle: "preserve-3d", marginTop: "20px" }}>
                    {data?.route ? (
                      <CardItem as={Link} to={data.route} translateZ={80} className="btn-ghost">
                        View project →
                      </CardItem>
                    ) : (
                      <CardItem as="a" href={data.link} target="_blank" rel="noreferrer" translateZ={120} className="btn-ghost">
                        View project ↗
                      </CardItem>
                    )}
                  </div>
                </CardBody>
              </CardContainer>
            </div>
          ))}
        </div>
      </Container>
    </HelmetProvider>
  );
};
