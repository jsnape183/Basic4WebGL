import { Routes, Route } from "react-router-dom";
import LandingPage from "../../pages/LandingPage";
import ProjectsPage from "../../pages/ProjectsPage";
import EditPage from "../../pages/EditPage";
import DocsPage from "../../pages/DocsPage";

const GlobalRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/projects" element={<ProjectsPage />} />
    <Route path="/projects/:id/edit" element={<EditPage />} />
    <Route path="/docs" element={<DocsPage />} />
    <Route path="/docs/:section" element={<DocsPage />} />
    <Route path="/docs/:section/:slug" element={<DocsPage />} />
  </Routes>
);

export default GlobalRoutes;
