import { Routes, Route } from "react-router-dom";
import ProjectsPage from "../../pages/ProjectsPage";
import EditPage from "../../pages/EditPage";

const GlobalRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<ProjectsPage />} />

    <Route path="/projects/:id/edit" element={<EditPage />} />
  </Routes>
);

export default GlobalRoutes;
