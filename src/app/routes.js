import React from "react";
import { Route, Routes, useParams } from "react-router-dom";
import withRouter from "../hooks/withRouter"
import { Home } from "../pages/home";
import { Portfolio } from "../pages/portfolio";
import { ContactUs } from "../pages/contact";
import { About } from "../pages/about";
import { Research } from "../pages/research";
import { Socialicons } from "../components/socialicons";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import MarkdownPage from "../components/MarkdownPage"; // Import the MarkdownPage component

function MarkdownRouter() {
  const { slug } = useParams();
  const file = `${process.env.PUBLIC_URL}/content/${slug}.md`;
  return <MarkdownPage file={file} />;
}

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
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/research" element={<Research />} />
        <Route path="/contact" element={<ContactUs />} />
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
