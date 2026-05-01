import { BaseResponse } from './BaseResponse';

describe('BaseResponse', () => {
  it('should create a response object with defaults', () => {
    const response = new BaseResponse();
    response.success = true;
    response.statusCode = 200;
    response.message = 'OK';
    response.timeStamp = new Date().toISOString();

    expect(response.success).toBe(true);
    expect(response.statusCode).toBe(200);
  });
});
