import React from "react";
import "./style.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import {
  dataabout,
  meta,
} from "../../content_option";
import { GamePage } from "./Game";
import profilePic from "../../images/headshot.jpg";
import ReactECharts from "echarts-for-react";

const reviewData = {
  journals: [
    "City and Environment Interactions",
    "Ecological Indicators",
    "Ecosystem Services",
    "Journal of Hydrology: Regional Studies",
    "Environmental Modelling & Software",
    "Environmental Challenges",
    "Frontiers of Architectural Research",
    "Land Use Policy",
    "Landscape and Urban Planning",
    "Resources, Environment and Sustainability",
    "Urban Forestry & Urban Greening",
    "Journal of Arid Environments",
    "Journal of Environmental Management",
    "Geoscience Letters",
    "Environmental Management",
    "Humanities and Social Sciences Communications",
    "Scientific Reports",
    "Discover Applied Sciences",
    "Agroforestry Systems",
    "Journal of Infrastructure Preservation and Resilience",
    "Discover Computing",
    "Discover Cities",
    "Journal of Asian Architecture and Building Engineering",
  ],
  completed: [
    2, 10, 2, 1, 1, 5, 1, 3, 1, 1, 1, 2, 8, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1,
  ],
};

// Sort the data by descending order of completed reviews
const sortedIndices = reviewData.completed
  .map((value, index) => ({ value, index }))
  .sort((a, b) => a.value - b.value)
  .map(item => item.index);

const sortedJournals = sortedIndices.map(index => reviewData.journals[index]);
const sortedCompleted = sortedIndices.map(index => reviewData.completed[index]);

const totalReviews = reviewData.completed.reduce((a, b) => a + b, 0);
const totalJournals = reviewData.journals.length;

const getChartOption = () => {
  return {
    textStyle: {
      fontFamily: "PixelNormal, monospace"
    },
    grid: { top: 32, right: 32, bottom: 32, left: 32, containLabel: true },
    xAxis: {
      type: "value",
    },
    yAxis: {
      type: "category",
      data: sortedJournals,
      axisLabel: {
        width: 250,
        overflow: "truncate",
        ellipsis: "..."
      }
    },
    tooltip: { trigger: "axis", confine: true },
    series: [
      {
        data: sortedCompleted,
        name: "Completed Reviews",
        type: "bar",
        itemStyle: { color: "rgba(41, 166, 27, 1)" },
        label: {
          show: true,
          position: 'right'
        }
      },
    ],
  };
};

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
          {/* Left Column: Photo */}
          <Col lg="5" className="mb-5 mb-lg-0">
            <div className="sticky-top" style={{ top: "100px" }}>
              <img 
                src={profilePic}
                alt="Profile"
                style={{ maxWidth: "100%", height: "auto", width: "400px", border: "2px solid black", boxShadow: "4px 4px 0px #000" }}
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
              <h3 className="mb-4">Reviewer Activities</h3>
              <p className="mb-4">Completed {totalReviews} reviews for {totalJournals} journals in total.</p>
              <ReactECharts option={getChartOption()} style={{ height: "600px", width: "100%" }} />
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
