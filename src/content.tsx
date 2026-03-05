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
    const statsContainer = findStatsContainer(statsHeading);
    if (statsContainer) {
      nextGenerationLog(
        'Found insertion point via Stats heading container'
      );
      return statsContainer;
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

const findStatsContainer = (el: HTMLElement): HTMLElement | null => {
  // Walk up from the Stats heading to find the main content column.
  // Medium's layout: #root > shell > sidebar + contentColumn.
  // The stats content sits several levels inside the content column.
  // We look for the deepest ancestor that still contains all stats sections.
  let current: HTMLElement | null = el;
  let candidate: HTMLElement | null = null;

  while (current && current !== document.body) {
    const parentEl: HTMLElement | null = current.parentElement;
    if (!parentEl) break;

    // Stop before we reach #root — we don't want to escape the
    // content column.
    if (parentEl.id === 'root' || parentEl === document.body) {
      break;
    }

    // The content column typically has a computed width style like
    // "calc(100% - 240px)" or is a direct child of #root's child.
    // We pick the last container before #root's direct child.
    if (
      parentEl.parentElement?.id === 'root' ||
      parentEl.parentElement === document.body
    ) {
      candidate = current;
      break;
    }

    current = parentEl;
  }

  return candidate;
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
  if (insertionPoint) {
    insertionPoint.appendChild(container);
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

