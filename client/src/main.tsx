import '@trimble-oss/moduswebcomponents/modus-wc-styles.css';
import '@trimble-oss/moduswebcomponents/modus-icons-2.css';
import '@trimble-oss/moduswebcomponents/modus-icons.css';
import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
