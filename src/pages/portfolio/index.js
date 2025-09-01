import React from "react";
import "./style.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { dataportfolio, meta } from "../../content_option";
import { Link } from "react-router-dom";

// ⬇️ 3D card components
import { CardBody, CardContainer, CardItem } from "../../components/ui/3d_card";

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

        <Row className="g-4">
          {dataportfolio.map((data, i) => (
            <Col key={i} lg={4} md={6} xs={12}>
              <CardContainer className="inter-var w-full min-h-[460px] rounded-xl p-6 border" style={{ perspective: 1000 }}>
              <CardBody
                className="!bg-red-500 p-4 rounded w-[300px]">

                  <CardItem as="h3" translateZ={50} className="text-xl font-bold">
                    {data.title}
                  </CardItem>

                  <CardItem as="p" translateZ={30} className="text-neutral-500 text-sm mt-2 dark:text-neutral-300">
                    {data.authors}{data.date ? ` · ${data.date}` : ""}
                  </CardItem>

                  <CardItem translateZ={70} className="mt-4">
                    <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                      <img
                        src={data.img}
                        alt={data.title}
                        width={305}
                        height={160}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CardItem>

                  <div className="mt-6 flex justify-end">
                    {data?.route ? (
                      <CardItem as={Link} to={data.route} translateZ={120} className="btn-ghost">
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

            </Col>
          ))}
        </Row>
      </Container>
    </HelmetProvider>
  );
};
