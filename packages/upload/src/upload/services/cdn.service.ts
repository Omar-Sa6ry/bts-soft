import { Injectable } from '@nestjs/common';

@Injectable()
export class CdnService {
  /**
   * Transforms a Cloudinary URL to apply on-the-fly CDN optimization parameters
   * (e.g., resizing, quality auto, format auto).
   * Returns the original URL if it's not a Cloudinary URL or if transformation fails.
   */
  transformImageUrl(
    url: string,
    options: {
      width?: number;
      height?: number;
      quality?: string | number;
      format?: string;
      crop?: string;
    } = {}
  ): string {
    if (!url || !url.includes('cloudinary.com')) {
      return url;
    }

    const { width, height, quality = 'auto', format = 'auto', crop = 'limit' } = options;

    const transformParams: string[] = [];
    transformParams.push(`f_${format}`);
    transformParams.push(`q_${quality}`);

    if (width) transformParams.push(`w_${width}`);
    if (height) transformParams.push(`h_${height}`);
    if (width || height) transformParams.push(`c_${crop}`);

    const transformString = transformParams.join(',');

    // Cloudinary URL pattern contains "/upload/" or "/private/" or "/authenticated/"
    // We insert transformations immediately after that segment.
    const match = url.match(/(\/(upload|private|authenticated|raw|video)\/)(v\d+\/)?/);
    if (!match) {
      return url;
    }

    const matchedSegment = match[0];
    const replacement = `${match[1]}${transformString}/${match[3] || ''}`;
    return url.replace(matchedSegment, replacement);
  }

  /**
   * Transforms a video URL to optimize codec and quality parameters.
   */
  transformVideoUrl(
    url: string,
    options: {
      quality?: string | number;
      format?: string;
      streamingProfile?: string;
    } = {}
  ): string {
    if (!url || !url.includes('cloudinary.com')) {
      return url;
    }

    const { quality = 'auto', format = 'auto', streamingProfile } = options;

    const transformParams: string[] = [];
    transformParams.push(`vc_auto`);
    transformParams.push(`q_${quality}`);
    if (format) transformParams.push(`f_${format}`);
    if (streamingProfile) transformParams.push(`p_${streamingProfile}`);

    const transformString = transformParams.join(',');

    const match = url.match(/(\/(video|upload)\/)(v\d+\/)?/);
    if (!match) {
      return url;
    }

    const matchedSegment = match[0];
    const replacement = `${match[1]}${transformString}/${match[3] || ''}`;
    return url.replace(matchedSegment, replacement);
  }

  /**
   * Generates a dictionary of optimized image URLs for different screen widths.
   * Useful for HTML `srcset` implementation in responsive frontends.
   */
  getResponsiveImageSet(
    url: string,
    options: {
      aspectRatio?: number; // width / height
      crop?: string;
    } = {}
  ): Record<string, string> {
    const widths = [360, 720, 1080, 1920];
    const srcSet: Record<string, string> = {};

    for (const w of widths) {
      const height = options.aspectRatio ? Math.round(w / options.aspectRatio) : undefined;
      srcSet[`${w}w`] = this.transformImageUrl(url, {
        width: w,
        height,
        crop: options.crop || 'fill',
        quality: 'auto',
        format: 'auto',
      });
    }

    return srcSet;
  }
}
