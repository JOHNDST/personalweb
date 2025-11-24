import React from "react";
import "./style.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import {
  dataabout,
  meta,
} from "../../content_option";
import { GamePage } from "./Game";
import { DitheredImage } from "../../components/DitheredImage";
import profilePic from "../../images/headshot.jpg";

export const About = () => {
  return (
    <HelmetProvider>
      <Container className="About-header">
        <Helmet>
          <meta charSet="utf-8" />
          <title> About | {meta.title}</title>
          <meta name="description" content={meta.description} />
        </Helmet>
        
        <Row className="mb-5 mt-3 pt-md-3">
          {/* Left Column: Dithered Photo */}
          <Col lg="5" className="mb-5 mb-lg-0">
            <div className="sticky-top" style={{ top: "100px" }}>
              <DitheredImage 
                src={profilePic}
                alt="Profile"
                width={400}
                height={400}
                threshold={40}
                style={{ maxWidth: "100%", height: "auto" }}
              />
              <div className="mt-3 text-right text-muted" style={{ fontSize: "0.8rem" }}>
                {/* Instructions for the user */}
                Yuxiang Dong, MLA, BA <br />
                PhD Candidate in Architecture <br />
                PhD Minor in Operations Research <br />
                Penn State University <br />
                <br />
                <br />
                Email: dongyuxiang@psu.edu
              </div>
            </div>
          </Col>

          {/* Right Column: About Me + Game */}
          <Col lg="7">
            <h1 className="display-4 mb-4">About me</h1>
            <hr className="t_border my-4 ml-0 text-left" />
            
            <div className="mb-5">
              <p className="lead">{dataabout.aboutme}</p>
              <p>
                I am Yuxiang Dong, MLA, BA, and a PhD candidate in Architecture (PhD minor in Operations Research) at Penn State University. My work sits at the intersection of landscape architecture, environmental modeling, and data science, with a core focus on what I call spatial decision intelligence. I am interested in one central question: how can we design and plan landscapes that are both resilient and fair, while making complex decisions more transparent for planners, designers, and communities.
                My research develops AI assisted and optimization based tools for green infrastructure and spatial planning. I build spatially explicit models that link land use, transportation, ecosystem services, and air quality, and use methods such as multi objective optimization, deep learning surrogates, and decision analysis. These tools are meant to support real decisions, such as where to place green infrastructure for PM2.5 mitigation, how to balance traffic efficiency with habitat quality, or how to improve access to urban nature across different neighborhoods.
              </p>
            </div>

            <div className="mt-5">
              <h3 className="mb-4">Take a break...</h3>
              <GamePage />
            </div>
          </Col>
        </Row>
      </Container>
    </HelmetProvider>
  );
};
