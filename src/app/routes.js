import React from "react";
import { Route, Routes, useParams } from "react-router-dom";
import withRouter from "../hooks/withRouter"
import { Home } from "../pages/home";
import { Portfolio } from "../pages/portfolio";
import { ContactUs } from "../pages/contact";
import { About } from "../pages/about";
import TimelineDemo from "../pages/news";
import { Research } from "../pages/research";
import { Publications } from "../pages/publications";
import { Socialicons } from "../components/socialicons";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import MarkdownPage from "../components/MarkdownPage"; // Import the MarkdownPage component
import { dataportfolio } from "../content_option";

function MarkdownRouter() {
  const { slug } = useParams();
  const file = `${process.env.PUBLIC_URL}/content/${slug}.md`;
  
  // Find the project in dataportfolio
  const project = dataportfolio.find(p => p.route && p.route.endsWith(`/${slug}`));
  let modelUrl = project ? project.model : null;

  if (modelUrl && !modelUrl.startsWith('http')) {
    modelUrl = `${process.env.PUBLIC_URL}${modelUrl}`;
  }

  return <MarkdownPage file={file} modelUrl={modelUrl} project={project} />;
}
//<Route path="/contact" element={<ContactUs />} />
const AnimatedRoutes = withRouter(({ location }) => (
  <TransitionGroup>
    <CSSTransition
      key={location.key}
      timeout={{
        enter: 400,
        exit: 400,
      }}
      classNames="page"
      unmountOnExit
    >
      <Routes location={location}>
        <Route exact path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/news" element={<TimelineDemo />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/research" element={<Research />} />
        <Route path="/publications" element={<Publications />} />
        <Route path="/p/:slug" element={<MarkdownRouter />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </CSSTransition>
  </TransitionGroup>
));

function AppRoutes() {
  return (
    <div className="s_c">
      <AnimatedRoutes />
      <Socialicons />
    </div>
  );
}

export default AppRoutes;
