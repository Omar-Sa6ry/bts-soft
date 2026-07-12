import {
  DeleteCommand,
  DeleteImageCommand,
  DeleteVideoCommand,
  DeleteAudioCommand,
  DeleteFileCommand,
  DeleteModel3dCommand
} from './delete.command';

describe('DeleteCommand Suite', () => {
  let mockStrategy: any;

  beforeEach(() => {
    mockStrategy = {
      delete: jest.fn().mockResolvedValue({ result: 'ok' }),
    };
  });

  it('should call delete on strategy with correct arguments', async () => {
    const command = new DeleteCommand(mockStrategy, 'test_id', 'image');
    const result = await command.execute();

    expect(mockStrategy.delete).toHaveBeenCalledWith('test_id', 'image');
    expect(result.result).toBe('ok');
  });

  it('should instantiate and call delete with image type in DeleteImageCommand', async () => {
    const command = new DeleteImageCommand(mockStrategy, 'img_123');
    await command.execute();
    expect(mockStrategy.delete).toHaveBeenCalledWith('img_123', 'image');
  });

  it('should instantiate and call delete with video type in DeleteVideoCommand', async () => {
    const command = new DeleteVideoCommand(mockStrategy, 'vid_123');
    await command.execute();
    expect(mockStrategy.delete).toHaveBeenCalledWith('vid_123', 'video');
  });

  it('should instantiate and call delete with video type in DeleteAudioCommand', async () => {
    const command = new DeleteAudioCommand(mockStrategy, 'aud_123');
    await command.execute();
    expect(mockStrategy.delete).toHaveBeenCalledWith('aud_123', 'video');
  });

  it('should instantiate and call delete with raw type in DeleteFileCommand', async () => {
    const command = new DeleteFileCommand(mockStrategy, 'file_123');
    await command.execute();
    expect(mockStrategy.delete).toHaveBeenCalledWith('file_123', 'raw');
  });

  it('should instantiate and call delete with raw type in DeleteModel3dCommand', async () => {
    const command = new DeleteModel3dCommand(mockStrategy, 'model_123');
    await command.execute();
    expect(mockStrategy.delete).toHaveBeenCalledWith('model_123', 'raw');
  });
});
