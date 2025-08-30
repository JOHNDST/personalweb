import React from 'react';
import './style.css'; // Make sure your CSS is properly set up to reflect the layout
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Container, Row, Col } from 'react-bootstrap';
import { researchdata, meta } from '../../content_option';

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
        <div className="mb-5 research_items">
          {researchdata.map((data, i) => (
            <Row key={i} className="research_item mb-4">
              <Col md={12} className="research_content">
                {/* Update this line to make the title a link */}
                <h2 className="research_title">
                  <a href={data.link} target="_blank" rel="noopener noreferrer">{data.title}</a>
                </h2>
                <div className="research_meta">
                  <span className="research_date">{data.date}</span>
                  <span className="research_authors">{data.authors}</span>
                </div>
                <p className="research_abstract">{data.abstract}</p>
              </Col>

            </Row>
          ))}
        </div>
      </Container>
    </HelmetProvider>
  );
};