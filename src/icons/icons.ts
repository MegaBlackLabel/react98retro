/**
 * アイコンパス定義
 *
 * Chicago95 アイコンは jsDelivr CDN 経由で GitHub リポジトリから取得します。
 * バンドルサイズに影響せず、ライブラリ利用時に GPL ファイルをローカルに持たずに済みます。
 *
 * License: Chicago95 icons are licensed under GPL-3.0
 * https://github.com/grassmunk/Chicago95
 */

export type IconSize = 16 | 32;

const CHICAGO95_CDN =
  'https://cdn.jsdelivr.net/gh/grassmunk/Chicago95@master/Icons/Chicago95';

const c = (path: string) => `${CHICAGO95_CDN}/${path}`;

export const ICONS = {
  // Drives
  hardDrive:       c('devices/scalable/drive-harddisk.svg'),
  floppyDrive:     c('devices/scalable/drive-removable-media-floppy.svg'),
  cdDrive:         c('devices/scalable/media-optical.svg'),
  networkDrive:    c('devices/scalable/network-wired.svg'),
  removableDrive:  c('devices/scalable/media-flash.svg'),

  // Folders
  folderClosed:    c('places/scalable/folder-documents.svg'),
  folderOpen:      c('places/scalable/folder_open.svg'),
  folderWindows:   c('places/scalable/folder_home.svg'),
  folderSystem:    c('places/scalable/folder_images.svg'),

  // System
  myComputer:      c('devices/scalable/gnome-computer.svg'),
  myDocuments:     c('places/scalable/folder-documents.svg'),
  recycleBinEmpty: c('places/scalable/emptytrash.svg'),
  recycleBinFull:  c('places/scalable/edittrash.svg'),
  desktop:         c('places/scalable/desktop.svg'),

  // Files
  fileGeneric:     c('mimes/scalable/empty.svg'),
  fileText:        c('mimes/scalable/text-x-generic-template.svg'),
  fileExecutable:  c('mimes/scalable/application-x-executable.svg'),
  fileImage:       c('mimes/scalable/image-x-generic.svg'),
  fileHtml:        c('mimes/scalable/text-html.svg'),
  fileScript:      c('mimes/scalable/text-x-script.svg'),

  // Toolbar actions
  back:            c('actions/scalable/go-previous.svg'),
  forward:         c('actions/scalable/go-next.svg'),
  up:              c('actions/scalable/go-up.svg'),
  cut:             c('actions/scalable/edit-cut.svg'),
  copy:            c('actions/scalable/edit-copy.svg'),
  paste:           c('actions/scalable/edit-paste.svg'),
  delete:          c('actions/scalable/edit-delete.svg'),
  properties:      c('actions/scalable/document-properties.svg'),

  // Shell / Explorer
  shellWindow:     c('apps/scalable/system-file-manager.svg'),
  windowsLogo:     c('places/scalable/start-here.svg'),
  windowsSlanted:  c('places/scalable/start-here.svg'),
} as const;

export type IconName = keyof typeof ICONS;

export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'exe':
    case 'com':
      return ICONS.fileExecutable;
    case 'txt':
    case 'log':
      return ICONS.fileText;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'bmp':
      return ICONS.fileImage;
    case 'html':
    case 'htm':
      return ICONS.fileHtml;
    case 'js':
    case 'ts':
    case 'vbs':
    case 'bat':
      return ICONS.fileScript;
    default:
      return ICONS.fileGeneric;
  }
}
