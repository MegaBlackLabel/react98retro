import { describe, expect, it } from 'vitest';
import { ICONS, getFileIcon } from './icons';

describe('getFileIcon', () => {
  it('maps .exe to fileExecutable', () => {
    expect(getFileIcon('setup.exe')).toBe(ICONS.fileExecutable);
  });

  it('maps .com to fileExecutable', () => {
    expect(getFileIcon('COMMAND.COM')).toBe(ICONS.fileExecutable);
  });

  it('maps .txt to fileText', () => {
    expect(getFileIcon('readme.txt')).toBe(ICONS.fileText);
  });

  it('maps .log to fileText', () => {
    expect(getFileIcon('app.log')).toBe(ICONS.fileText);
  });

  it('maps .jpeg to fileImage', () => {
    expect(getFileIcon('photo.jpeg')).toBe(ICONS.fileImage);
  });

  it('maps .html to fileHtml', () => {
    expect(getFileIcon('index.html')).toBe(ICONS.fileHtml);
  });

  it('maps .ts to fileScript', () => {
    expect(getFileIcon('script.ts')).toBe(ICONS.fileScript);
  });

  it('handles uppercase extensions', () => {
    expect(getFileIcon('readme.TXT')).toBe(ICONS.fileText);
    expect(getFileIcon('PHOTO.JPEG')).toBe(ICONS.fileImage);
  });

  it('falls back to fileGeneric for unknown extensions', () => {
    expect(getFileIcon('archive.tar.gz')).toBe(ICONS.fileGeneric);
    expect(getFileIcon('data.csv')).toBe(ICONS.fileGeneric);
  });

  it('falls back to fileGeneric for files without extension', () => {
    expect(getFileIcon('README')).toBe(ICONS.fileGeneric);
    expect(getFileIcon('.gitignore')).toBe(ICONS.fileGeneric);
  });

  it('returns a valid CDN URL string', () => {
    const url = getFileIcon('test.txt');
    expect(typeof url).toBe('string');
    expect(url.startsWith('https://')).toBe(true);
  });
});

describe('ICONS', () => {
  it('contains expected icon names', () => {
    expect(ICONS).toHaveProperty('hardDrive');
    expect(ICONS).toHaveProperty('folderClosed');
    expect(ICONS).toHaveProperty('fileGeneric');
    expect(ICONS).toHaveProperty('back');
  });

  it('values are valid CDN URLs', () => {
    Object.values(ICONS).forEach((url) => {
      expect(typeof url).toBe('string');
      expect(url.startsWith('https://cdn.jsdelivr.net/')).toBe(true);
    });
  });
});
