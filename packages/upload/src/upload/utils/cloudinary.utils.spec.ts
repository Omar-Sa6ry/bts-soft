import { extractPublicId } from './cloudinary.utils';

describe('Cloudinary Utils', () => {
  describe('extractPublicId', () => {
    it('should extract public id from a standard image URL', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg';
      expect(extractPublicId(url, 'image')).toBe('sample');
    });

    it('should extract public id with folders', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v1/avatars/user123.png';
      expect(extractPublicId(url, 'image')).toBe('avatars/user123');
    });

    it('should extract public id from video URL', () => {
      const url = 'https://res.cloudinary.com/demo/video/upload/v1/videos/intro.mp4';
      expect(extractPublicId(url, 'video')).toBe('videos/intro');
    });

    it('should return null for invalid URL', () => {
      expect(extractPublicId('invalid-url', 'image')).toBeNull();
    });

    it('should handle raw files', () => {
      const url = 'https://res.cloudinary.com/demo/raw/upload/v1/files/doc.pdf';
      expect(extractPublicId(url, 'raw')).toBe('files/doc.pdf');
    });
  });
});
