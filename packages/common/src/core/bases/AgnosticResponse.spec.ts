import { AgnosticResponse } from './AgnosticResponse';

describe('AgnosticResponse', () => {
  it('should create an instance with correct fields', () => {
    const response = new AgnosticResponse();
    response.success = true;
    response.statusCode = 201;
    response.message = 'Created';
    response.timeStamp = '2026-05-01T00:00:00Z';

    expect(response.success).toBe(true);
    expect(response.statusCode).toBe(201);
  });
});
