import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getToken } from './api/client';
import { LoginPage } from './pages/LoginPage';
import { SitesPage } from './pages/SitesPage';
import { SitePage } from './pages/SitePage';
import { PageEditorPage } from './pages/PageEditorPage';

function RequireAuth({ children }: { children: ReactElement }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireAuth><SitesPage /></RequireAuth>} />
      <Route path="/sites/:siteId" element={<RequireAuth><SitePage /></RequireAuth>} />
      <Route path="/sites/:siteId/pages/:pageId" element={<RequireAuth><PageEditorPage /></RequireAuth>} />
    </Routes>
  );
}
