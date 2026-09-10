import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
// Після global.css: правила друку мають перекривати екранні за однакової ваги.
import './styles/print.css';
import './app/i18n';
import { App } from './app/App';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
