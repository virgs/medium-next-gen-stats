import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { nextGenerationLog } from './utils/logger';

import 'bootstrap/dist/css/bootstrap.min.css';
import './css/mngs.scss';

const CONTAINER_ID = 'mngs-root';
const OBSERVER_TIMEOUT_MS = 15_000;

export const findStatsHeading = (): HTMLElement | null => {
  const headings = document.querySelectorAll('h2');
  for (const h2 of headings) {
    if (h2.textContent?.trim() === 'Stats') {
      return h2;
    }
  }
  return null;
};

export const findInsertionPoint = (): HTMLElement | null => {
  const statsHeading = findStatsHeading();
  if (statsHeading) {
    const mainContentRoot = findContentAncestor(statsHeading);
    if (mainContentRoot) {
      nextGenerationLog(
        'Found insertion point via Stats heading ancestor'
      );
      return mainContentRoot;
    }
  }

  const root = document.getElementById('root');
  if (root) {
    nextGenerationLog(
      'Stats heading not found, falling back to #root'
    );
    return root;
  }

  nextGenerationLog(
    'No insertion point found, will append to body'
  );
  return null;
};

const findContentAncestor = (el: HTMLElement): HTMLElement | null => {
  let current: HTMLElement | null = el;
  while (current && current !== document.body) {
    const parentEl: HTMLElement | null = current.parentElement;
    if (!parentEl) break;
    if (parentEl.id === 'root' || parentEl === document.body) {
      return current;
    }
    current = parentEl;
  }
  return current;
};

export const init = (): void => {
  if (document.getElementById(CONTAINER_ID)) {
    nextGenerationLog('Extension already injected, skipping');
    return;
  }

  nextGenerationLog('Injecting extension container');
  const container = document.createElement('div');
  container.id = CONTAINER_ID;

  const insertionPoint = findInsertionPoint();
  if (insertionPoint && insertionPoint.parentNode) {
    insertionPoint.parentNode.insertBefore(
      container,
      insertionPoint.nextSibling
    );
  } else {
    document.body.appendChild(container);
  }

  nextGenerationLog('Rendering React app');
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const waitForStatsAndInit = (): void => {
  nextGenerationLog(
    'Waiting for Medium stats page to render...'
  );

  if (findStatsHeading()) {
    nextGenerationLog('Stats heading found immediately');
    init();
    return;
  }

  nextGenerationLog(
    'Stats heading not yet present, setting up MutationObserver'
  );
  const observer = new MutationObserver(() => {
    if (findStatsHeading()) {
      nextGenerationLog(
        'Stats heading appeared in DOM via MutationObserver'
      );
      observer.disconnect();
      init();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  setTimeout(() => {
    observer.disconnect();
    nextGenerationLog(
      'MutationObserver timed out, initializing with fallback'
    );
    init();
  }, OBSERVER_TIMEOUT_MS);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForStatsAndInit);
} else {
  waitForStatsAndInit();
}

