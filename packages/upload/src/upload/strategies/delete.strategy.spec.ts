import { CloudinaryDeleteStrategy } from './delete.strategy';

describe('CloudinaryDeleteStrategy', () => {
  let strategy: CloudinaryDeleteStrategy;
  let mockCloudinary: any;

  beforeEach(() => {
    mockCloudinary = {
      uploader: {
        destroy: jest.fn(),
      },
    };
    strategy = new CloudinaryDeleteStrategy(mockCloudinary);
  });

  it('should call cloudinary destroy with correct parameters', async () => {
    mockCloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

    const result = await strategy.delete('test_id', 'image');

    expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith(
      'test_id',
      { resource_type: 'image' }
    );
    expect(result.result).toBe('ok');
  });

  it('should reject on error', async () => {
    const error = new Error('cloudinary error');
    mockCloudinary.uploader.destroy.mockRejectedValue(error);

    await expect(strategy.delete('test_id')).rejects.toThrow('cloudinary error');
  });
});
