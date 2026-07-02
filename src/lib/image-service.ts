/* Sharp-based image service that preserves ICC color profiles.
   Astro's built-in sharp service strips all metadata from derivatives, which
   silently downgrades Display P3 photos to "assumed sRGB" — visibly duller on
   wide-gamut screens. This service is the built-in transform plus
   `keepIccProfile()`, so AVIF/WebP/JPEG derivatives stay color-tagged. */
import type { LocalImageService } from 'astro';
import sharpService from 'astro/assets/services/sharp';
import sharp from 'sharp';

const fitMap = {
  fill: 'fill',
  contain: 'inside',
  cover: 'cover',
  none: 'outside',
  'scale-down': 'inside',
  outside: 'outside',
  inside: 'inside',
} as const;

const service: LocalImageService = {
  ...sharpService,
  async transform(inputBuffer, transformOptions, config) {
    const transform = transformOptions as Record<string, any>;
    if (transform.format === 'svg') return { data: inputBuffer, format: 'svg' };

    const result = sharp(inputBuffer, {
      failOnError: false,
      pages: -1,
      limitInputPixels: (config.service.config as Record<string, any>).limitInputPixels,
    });
    result.keepIccProfile();
    result.rotate();

    const withoutEnlargement = Boolean(transform.fit);
    if (transform.width && transform.height && transform.fit) {
      const fit = fitMap[transform.fit as keyof typeof fitMap] ?? 'inside';
      result.resize({
        width: Math.round(transform.width),
        height: Math.round(transform.height),
        fit,
        position: transform.position,
        withoutEnlargement,
      });
    } else if (transform.height && !transform.width) {
      result.resize({ height: Math.round(transform.height), withoutEnlargement });
    } else if (transform.width) {
      result.resize({ width: Math.round(transform.width), withoutEnlargement });
    }

    if (transform.background) result.flatten({ background: transform.background });

    if (transform.format) {
      const quality = typeof transform.quality === 'number' ? transform.quality : undefined;
      result.toFormat(transform.format, { quality });
    }

    const { data, info } = await result.toBuffer({ resolveWithObject: true });
    return { data: new Uint8Array(data), format: info.format as never };
  },
};

export default service;
