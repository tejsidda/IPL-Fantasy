import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import { TeamsPage } from './pages/TeamsPage';
import { TeamDetailsPage } from './pages/TeamDetailsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AdminPage } from './pages/AdminPage';
import { PlayerPage } from './pages/PlayerPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<TeamsPage />} />
          <Route path="team/:id" element={<TeamDetailsPage />} />
          <Route path="points-table" element={<LeaderboardPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="player/:apiId" element={<PlayerPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
