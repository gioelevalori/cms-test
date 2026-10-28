import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/onest/400.css';
import '@fontsource/onest/500.css';
import '@fontsource/onest/600.css';
import '@fontsource/onest/700.css';
// Caratteri dei siti d'esempio: ognuno ha il suo.
import '@fontsource/gloock/400.css';
import '@fontsource/archivo/800.css';
import '@fontsource/young-serif/400.css';
import '@fontsource/unbounded/700.css';
import { App } from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
