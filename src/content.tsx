import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

import 'bootstrap/dist/css/bootstrap.min.css';
import './css/mngs.scss';

const CONTAINER_ID = 'mngs-root';

const init = (): void => {
  if (document.getElementById(CONTAINER_ID)) return;

  const container = document.createElement('div');
  container.id = CONTAINER_ID;

  const statsContainer = document.querySelector('.container.stats');
  if (statsContainer) {
    statsContainer.parentNode?.insertBefore(
      container,
      statsContainer.nextSibling
    );
  } else {
    document.body.appendChild(container);
  }

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

