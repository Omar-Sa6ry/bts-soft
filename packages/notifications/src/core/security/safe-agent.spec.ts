import { describe, it, expect, vi } from 'vitest';
import * as http from 'node:http';
import * as https from 'node:https';

vi.mock('node:dns', () => {
  return {
    lookup: vi.fn(),
  };
});

import * as dns from 'node:dns';
import { SafeAgentFactory } from './safe-agent';

describe('SafeAgentFactory', () => {
  it('should create http and https agents with custom lookup', () => {
    const { httpAgent, httpsAgent } = SafeAgentFactory.createAgents({ keepAlive: true, timeout: 5000 });
    expect(httpAgent).toBeInstanceOf(http.Agent);
    expect(httpsAgent).toBeInstanceOf(https.Agent);
    expect((httpAgent as any).options.keepAlive).toBe(true);
    expect((httpAgent as any).options.timeout).toBe(5000);
    expect(typeof (httpAgent as any).options.lookup).toBe('function');
  });

  it('should resolve primary IP when lookup succeeds with public IP', async () => {
    const { httpAgent } = SafeAgentFactory.createAgents();
    const lookup = (httpAgent as any).options.lookup;

    vi.mocked(dns.lookup).mockImplementation((host: any, options: any, cb: any) => {
      cb(null, [{ address: '93.184.216.34', family: 4 }]);
    });

    await new Promise<void>((resolve, reject) => {
      lookup('example.com', {}, (err: any, address: string, family: number) => {
        try {
          expect(err).toBeNull();
          expect(address).toBe('93.184.216.34');
          expect(family).toBe(4);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should return all addresses when options.all is true', async () => {
    const { httpAgent } = SafeAgentFactory.createAgents();
    const lookup = (httpAgent as any).options.lookup;

    const mockAddresses = [
      { address: '93.184.216.34', family: 4 },
      { address: '93.184.216.35', family: 4 },
    ];
    vi.mocked(dns.lookup).mockImplementation((host: any, options: any, cb: any) => {
      cb(null, mockAddresses);
    });

    await new Promise<void>((resolve, reject) => {
      lookup('example.com', { all: true }, (err: any, addresses: any) => {
        try {
          expect(err).toBeNull();
          expect(addresses).toEqual(mockAddresses);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should pass through dns error if dns lookup itself fails', async () => {
    const { httpAgent } = SafeAgentFactory.createAgents();
    const lookup = (httpAgent as any).options.lookup;

    const dnsErr = new Error('ENOTFOUND');
    vi.mocked(dns.lookup).mockImplementation((host: any, options: any, cb: any) => {
      cb(dnsErr, null);
    });

    await new Promise<void>((resolve, reject) => {
      lookup('notfound.local', {}, (err: any) => {
        try {
          expect(err).toBe(dnsErr);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should throw and return ESSRFBLOCKED when no DNS records found', async () => {
    const { httpAgent } = SafeAgentFactory.createAgents();
    const lookup = (httpAgent as any).options.lookup;

    vi.mocked(dns.lookup).mockImplementation((host: any, options: any, cb: any) => {
      cb(null, []);
    });

    await new Promise<void>((resolve, reject) => {
      lookup('empty.com', {}, (err: any) => {
        try {
          expect(err).toBeDefined();
          expect(err.code).toBe('ESSRFBLOCKED');
          expect(err.message).toContain('No DNS records found');
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should block private/loopback IP address and return ESSRFBLOCKED', async () => {
    const { httpAgent } = SafeAgentFactory.createAgents();
    const lookup = (httpAgent as any).options.lookup;

    vi.mocked(dns.lookup).mockImplementation((host: any, options: any, cb: any) => {
      cb(null, [{ address: '127.0.0.1', family: 4 }]);
    });

    await new Promise<void>((resolve, reject) => {
      lookup('localhost', {}, (err: any) => {
        try {
          expect(err).toBeDefined();
          expect(err.code).toBe('ESSRFBLOCKED');
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});
