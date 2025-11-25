const { getThreadUrl } = require('../lib/slugUtils');

describe('getThreadUrl', () => {
  it('uses slug when present', () => {
    expect(getThreadUrl({ id: 1, slug: 'hello-world' })).toBe('/threads/hello-world');
  });

  it('falls back to id when no slug', () => {
    expect(getThreadUrl({ id: 5 })).toBe('/threads/5');
  });
});
