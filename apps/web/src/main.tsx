import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SearchPage } from './pages/SearchPage';
import { ResultsPage } from './pages/ResultsPage';
import { ProspectPage } from './pages/ProspectPage';
import { InteractionsPage } from './pages/InteractionsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ConditionPage } from './pages/ConditionPage';
import { Layout } from './components/Layout';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/prospect/:id" element={<ProspectPage />} />
          <Route path="/interactions" element={<InteractionsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/condition/:id" element={<ConditionPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </React.StrictMode>
);
