const { getClientIp } = require('../lib/ipBan');

describe('getClientIp', () => {
  it('uses x-forwarded-for first entry', () => {
    const ip = getClientIp({ headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }, connection: {}, socket: {} });
    expect(ip).toBe('1.1.1.1');
  });

  it('falls back to x-real-ip', () => {
    const ip = getClientIp({ headers: { 'x-real-ip': '3.3.3.3' }, connection: {}, socket: {} });
    expect(ip).toBe('3.3.3.3');
  });

  it('uses connection remoteAddress last', () => {
    const ip = getClientIp({ headers: {}, connection: { remoteAddress: '4.4.4.4' }, socket: {} });
    expect(ip).toBe('4.4.4.4');
  });
});
