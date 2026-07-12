import { CdnService } from './cdn.service';

describe('CdnService', () => {
  let service: CdnService;

  beforeEach(() => {
    service = new CdnService();
  });

  it('should transform cloudinary image URLs correctly', () => {
    const rawUrl = 'https://res.cloudinary.com/demo/image/upload/v1570979139/sample.jpg';
    const transformed = service.transformImageUrl(rawUrl, {
      width: 500,
      height: 300,
      quality: 'auto',
      format: 'webp',
      crop: 'fill',
    });

    expect(transformed).toContain('f_webp');
    expect(transformed).toContain('q_auto');
    expect(transformed).toContain('w_500');
    expect(transformed).toContain('h_300');
    expect(transformed).toContain('c_fill');
  });

  it('should transform cloudinary video URLs correctly', () => {
    const rawUrl = 'https://res.cloudinary.com/demo/video/upload/v1570979139/sample.mp4';
    const transformed = service.transformVideoUrl(rawUrl, {
      quality: '80',
      format: 'webm',
      streamingProfile: 'hd',
    });

    expect(transformed).toContain('vc_auto');
    expect(transformed).toContain('q_80');
    expect(transformed).toContain('f_webm');
    expect(transformed).toContain('p_hd');
  });

  it('should fall back to original URL if not a cloudinary URL', () => {
    const localUrl = 'http://localhost:3000/uploads/avatars/test.jpg';
    const transformed = service.transformImageUrl(localUrl, { width: 500 });
    expect(transformed).toBe(localUrl);
  });

  it('should generate a responsive image set mapping correctly', () => {
    const rawUrl = 'https://res.cloudinary.com/demo/image/upload/v1570979139/sample.jpg';
    const srcSet = service.getResponsiveImageSet(rawUrl, { aspectRatio: 1.5 });

    expect(srcSet['360w']).toContain('w_360');
    expect(srcSet['360w']).toContain('h_240'); // 360 / 1.5
    expect(srcSet['720w']).toContain('w_720');
    expect(srcSet['1080w']).toContain('w_1080');
    expect(srcSet['1920w']).toContain('w_1920');
  });
});
