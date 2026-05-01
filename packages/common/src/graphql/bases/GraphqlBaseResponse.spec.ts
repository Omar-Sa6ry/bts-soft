import { GraphqlBaseResponse } from './GraphqlBaseResponse';

describe('GraphqlBaseResponse', () => {
  it('should create an instance with provided data', () => {
    const response = new GraphqlBaseResponse();
    response.success = true;
    response.statusCode = 200;
    response.message = 'Success';
    response.timeStamp = new Date().toISOString();

    expect(response.success).toBe(true);
    expect(response.statusCode).toBe(200);
  });
});
