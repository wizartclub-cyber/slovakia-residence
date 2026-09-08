import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { HomePage } from '../pages/HomePage';
import { AboutPage } from '../pages/AboutPage';
import { SourceLibraryPage } from '../features/source-library/SourceLibraryPage';
import { FinderPage } from '../features/route-finder/FinderPage';
import { RoutePage } from '../features/route-page/RoutePage';
import { PrivacyPage } from '../pages/PrivacyPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { defaultLocale } from '../lib/content/site';

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Navigate to={`/${defaultLocale}/`} replace />} />
        <Route path=":lang" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="finder" element={<FinderPage />} />
          <Route path="route/:id" element={<RoutePage />} />
          <Route path="sources" element={<SourceLibraryPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="*" element={<Navigate to={`/${defaultLocale}/`} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
