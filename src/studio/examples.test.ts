import { describe, expect, it } from 'vitest';
import filteredList from '../editor/fixtures/filtered-list.json';
import login from '../editor/fixtures/login.json';
import settings from '../editor/fixtures/settings.json';
import { EXAMPLE_PAGES } from './examples';

describe('E featured examples', () => {
  it('E-01 example ids point at golden fixture files', () => {
    expect(JSON.stringify(EXAMPLE_PAGES.login.messages)).toBe(
      JSON.stringify(login),
    );
    expect(JSON.stringify(EXAMPLE_PAGES.settings.messages)).toBe(
      JSON.stringify(settings),
    );
    expect(JSON.stringify(EXAMPLE_PAGES['filtered-list'].messages)).toBe(
      JSON.stringify(filteredList),
    );
  });
});
