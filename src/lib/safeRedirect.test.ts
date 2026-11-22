import { DEFAULT_REDIRECT, safeRedirectPath } from './safeRedirect';

describe('safeRedirectPath', () => {
  it('keeps root-relative paths, including a query string and hash', () => {
    expect(safeRedirectPath('/inventory?category=coffee#list')).toBe(
      '/inventory?category=coffee#list',
    );
  });

  it('uses the default for missing or non-string values', () => {
    expect(safeRedirectPath(undefined)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath(null)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath(42)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath('   ')).toBe(DEFAULT_REDIRECT);
  });

  it('rejects absolute URLs to another origin', () => {
    expect(safeRedirectPath('https://evil.example/steal')).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath('http://evil.example')).toBe(DEFAULT_REDIRECT);
  });

  it('rejects protocol-relative URLs', () => {
    expect(safeRedirectPath('//evil.example/steal')).toBe(DEFAULT_REDIRECT);
  });

  it('rejects backslashes, which browsers normalise into slashes', () => {
    expect(safeRedirectPath('/\\evil.example/steal')).toBe(DEFAULT_REDIRECT);
  });

  it('rejects schemes and control characters', () => {
    expect(safeRedirectPath('javascript:alert(1)')).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath('data:text/html,<script>')).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath('/ok\nLocation: https://evil.example')).toBe(DEFAULT_REDIRECT);
  });

  it('honours a caller-supplied fallback', () => {
    expect(safeRedirectPath('https://evil.example', '/dashboard')).toBe('/dashboard');
  });
});
