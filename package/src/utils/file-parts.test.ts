import { getFileFromPart, getImageUrlFromPart } from './file-parts';

describe('utils/file-parts', () => {
  it('reads the address of an image from url or data, by mediaType or mimeType', () => {
    expect(
      getImageUrlFromPart({ type: 'file', mediaType: 'image/png', url: 'https://a/b.png' })
    ).toBe('https://a/b.png');
    expect(getImageUrlFromPart({ type: 'file', mimeType: 'image/jpeg', data: 'AAA' })).toBe(
      'data:image/jpeg;base64,AAA'
    );
    expect(getImageUrlFromPart({ type: 'image', image: 'https://a/c.png' })).toBe(
      'https://a/c.png'
    );
    expect(getImageUrlFromPart({ type: 'data-image', data: { url: 'https://a/d.png' } })).toBe(
      'https://a/d.png'
    );
    expect(
      getImageUrlFromPart({ type: 'file', mediaType: 'application/pdf', url: 'x' })
    ).toBeNull();
    expect(getImageUrlFromPart('text')).toBeNull();
  });

  it('reads the name, type and size of a file', () => {
    expect(
      getFileFromPart({ type: 'file', name: 'spec.pdf', mimeType: 'application/pdf', size: 10 })
    ).toEqual({ filename: 'spec.pdf', mediaType: 'application/pdf', size: 10, url: undefined });
    expect(getFileFromPart({ type: 'file' })?.filename).toBe('Attachment');
    expect(getFileFromPart({ type: 'text', text: 'x' })).toBeNull();
  });
});
