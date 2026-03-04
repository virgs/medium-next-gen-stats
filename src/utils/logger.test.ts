import { describe, it, expect, vi } from 'vitest';
import { nextGenerationLog } from './logger';

describe('nextGenerationLog', () => {
  it('logs with the correct prefix format', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    nextGenerationLog('test message');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const loggedMessage = consoleSpy.mock.calls[0][0] as string;
    expect(loggedMessage).toMatch(
      /\[Medium Next Gen Stats - \d{2}:\d{3}\]/
    );
    expect(loggedMessage).toContain('test message');
    consoleSpy.mockRestore();
  });

  it('handles multiple arguments', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    nextGenerationLog('arg1', 'arg2');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });
});

