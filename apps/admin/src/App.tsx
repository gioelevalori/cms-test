import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getToken } from './api/client';
import { LoginPage } from './pages/LoginPage';
import { BusinessesPage } from './pages/BusinessesPage';
import { BusinessPage } from './pages/BusinessPage';
import { EditorPage } from './pages/EditorPage';

function RequireAuth({ children }: { children: ReactElement }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireAuth><BusinessesPage /></RequireAuth>} />
      <Route path="/b/:businessId" element={<RequireAuth><BusinessPage /></RequireAuth>} />
      <Route path="/b/:businessId/modifica" element={<RequireAuth><EditorPage /></RequireAuth>} />
    </Routes>
  );
}
