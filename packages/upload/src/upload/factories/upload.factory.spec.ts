import { UploadServiceFactory } from './upload.factory';
import { ConfigService } from '@nestjs/config';
import { CloudinaryInstance } from '../config/cloudinary';

jest.mock('../config/cloudinary', () => ({
  CloudinaryInstance: {
    getInstance: jest.fn().mockReturnValue({ api_key: 'mock-key' }),
  },
}));

describe('UploadServiceFactory', () => {
  it('should call CloudinaryInstance.getInstance with configService', () => {
    const mockConfig = {} as ConfigService;
    const result = UploadServiceFactory.create(mockConfig);

    expect(CloudinaryInstance.getInstance).toHaveBeenCalledWith(mockConfig);
    expect(result).toEqual({ api_key: 'mock-key' });
  });
});
