import React from "react";
import "./style.css"; // Update your CSS file as per the instructions below
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { dataportfolio, meta } from "../../content_option";

export const Portfolio = () => {
  return (
    <HelmetProvider>
      <Container className="portfolio-header">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Portfolio | {meta.title}</title>
          <meta name="description" content={meta.description} />
        </Helmet>
        <Row className="mb-5 mt-3">
          <Col>
            <h1 className="display-4 mb-4 text-center">Portfolio</h1>
            <hr className="t_border mx-auto text-left" />
          </Col>
        </Row>
        <Row>
          {dataportfolio.map((data, i) => (
            <Col md={12} className="mb-4 portfolio-item" key={i}>
              <div className="portfolio-item-wrapper">
                <h3>{data.title}</h3>
                <img src={data.img} alt={data.description} className="img-fluid portfolio-image" />
                
                <div className="portfolio-item-content">
                  <p>{data.description}</p>
                  <a href={data.link} className="stretched-link">View project</a>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </HelmetProvider>
  );
};

