import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { findStatsHeading, findInsertionPoint, init } from './content';

vi.mock('./App', () => ({
  App: () => null,
}));

vi.mock('./utils/logger', () => ({
  nextGenerationLog: vi.fn(),
}));

describe('content', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('findStatsHeading', () => {
    it('returns null when no h2 exists', () => {
      expect(findStatsHeading()).toBeNull();
    });

    it('returns null when h2 exists but text is not Stats', () => {
      document.body.innerHTML = '<h2>Other</h2>';
      expect(findStatsHeading()).toBeNull();
    });

    it('finds h2 with text Stats', () => {
      document.body.innerHTML = '<h2>Stats</h2>';
      const result = findStatsHeading();
      expect(result).not.toBeNull();
      expect(result?.tagName).toBe('H2');
      expect(result?.textContent).toBe('Stats');
    });

    it('finds h2 with trimmed whitespace', () => {
      document.body.innerHTML = '<h2>  Stats  </h2>';
      expect(findStatsHeading()).not.toBeNull();
    });

    it('ignores h2 with partial match', () => {
      document.body.innerHTML = '<h2>Statistics</h2>';
      expect(findStatsHeading()).toBeNull();
    });
  });

  describe('findInsertionPoint', () => {
    it('returns null when page is empty', () => {
      expect(findInsertionPoint()).toBeNull();
    });

    it('returns content ancestor when Stats h2 exists inside #root', () => {
      document.body.innerHTML = `
        <div id="root">
          <div class="content-wrapper">
            <h2>Stats</h2>
          </div>
        </div>
      `;
      const result = findInsertionPoint();
      expect(result).not.toBeNull();
      expect(result?.parentElement?.id).toBe('root');
    });

    it('returns #root as fallback when no Stats h2', () => {
      document.body.innerHTML = '<div id="root"><p>Hello</p></div>';
      const result = findInsertionPoint();
      expect(result).not.toBeNull();
      expect(result?.id).toBe('root');
    });

    it('returns the direct child of #root containing the h2', () => {
      document.body.innerHTML = `
        <div id="root">
          <div class="sidebar">Sidebar</div>
          <div class="main">
            <div class="stats-area">
              <h2>Stats</h2>
            </div>
          </div>
        </div>
      `;
      const result = findInsertionPoint();
      expect(result).not.toBeNull();
      const parent = result?.parentElement;
      expect(parent?.id).toBe('root');
    });
  });

  describe('init', () => {
    it('creates mngs-root container', () => {
      document.body.innerHTML = `
        <div id="root">
          <div class="content"><h2>Stats</h2></div>
        </div>
      `;
      init();
      expect(document.getElementById('mngs-root')).not.toBeNull();
    });

    it('does not create duplicate container', () => {
      document.body.innerHTML = `
        <div id="root">
          <div class="content"><h2>Stats</h2></div>
        </div>
      `;
      init();
      init();
      const roots = document.querySelectorAll('#mngs-root');
      expect(roots.length).toBe(1);
    });

    it('inserts after the stats content ancestor', () => {
      document.body.innerHTML = `
        <div id="root">
          <div class="content"><h2>Stats</h2></div>
        </div>
      `;
      init();
      const mngsRoot = document.getElementById('mngs-root');
      expect(mngsRoot?.previousElementSibling).not.toBeNull();
    });

    it('appends to body when no insertion point found', () => {
      init();
      const mngsRoot = document.getElementById('mngs-root');
      expect(mngsRoot).not.toBeNull();
      expect(mngsRoot?.parentElement).toBe(document.body);
    });
  });
});

