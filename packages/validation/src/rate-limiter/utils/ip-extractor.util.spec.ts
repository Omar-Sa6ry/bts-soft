import { extractIp } from './ip-extractor.util';

describe('extractIp', () => {
  it('extracts the first IP from X-Forwarded-For when present', () => {
    const req = { headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1, 172.16.0.1' } };
    expect(extractIp(req)).toBe('203.0.113.1');
  });

  it('extracts a single IP from X-Forwarded-For', () => {
    const req = { headers: { 'x-forwarded-for': '1.2.3.4' } };
    expect(extractIp(req)).toBe('1.2.3.4');
  });

  it('trims whitespace from X-Forwarded-For', () => {
    const req = { headers: { 'x-forwarded-for': '  5.5.5.5  , 10.0.0.1' } };
    expect(extractIp(req)).toBe('5.5.5.5');
  });

  it('falls back to X-Real-IP when X-Forwarded-For is absent', () => {
    const req = { headers: { 'x-real-ip': '8.8.8.8' } };
    expect(extractIp(req)).toBe('8.8.8.8');
  });

  it('falls back to req.ip when no proxy headers are present', () => {
    const req = { headers: {}, ip: '192.168.1.1' };
    expect(extractIp(req)).toBe('192.168.1.1');
  });

  it('falls back to socket.remoteAddress when req.ip is absent', () => {
    const req = { headers: {}, socket: { remoteAddress: '10.20.30.40' } };
    expect(extractIp(req)).toBe('10.20.30.40');
  });

  it('falls back to connection.remoteAddress as last resort', () => {
    const req = { headers: {}, connection: { remoteAddress: '172.16.5.5' } };
    expect(extractIp(req)).toBe('172.16.5.5');
  });

  it('returns "unknown" when nothing is available', () => {
    expect(extractIp({})).toBe('unknown');
    expect(extractIp(null)).toBe('unknown');
    expect(extractIp(undefined)).toBe('unknown');
  });

  it('prefers X-Forwarded-For over X-Real-IP over req.ip', () => {
    const req = {
      headers: {
        'x-forwarded-for': '1.1.1.1',
        'x-real-ip': '2.2.2.2',
      },
      ip: '3.3.3.3',
    };
    expect(extractIp(req)).toBe('1.1.1.1');
  });
});
