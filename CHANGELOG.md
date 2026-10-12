# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.5] - 2026-10-13

### Changed

- Text inside `.win98` now follows the Windows Standard scheme: body text is pure black `#000000` instead of the `#222` that 98.css applies to `body`. Highlight (`#000080` / `#ffffff`), grayed (`#808080`), and desktop icon label (`#ffffff`) colors are unchanged.
- Window surfaces (`title-bar`, `window-body`, `status-bar`) and the `MenuBar` popup layer are promoted to composited layers so pixel fonts are rasterized with grayscale antialiasing instead of Chromium's ClearType (LCD subpixel) antialiasing. The lever is applied per text surface because `will-change: transform` on `.win98` / `.window` would change the containing block of `position: fixed` descendants (window placement, modal backdrop).
- The demo's global CSS no longer sets `text-rendering: optimizeLegibility` and requests grayscale smoothing.

### Fixed

- Greenish/orange edges around all pixel-font text (menu bar, window body, popup menus) on Windows Chromium: 16.8% of glyph pixels were chromatic before, 0% after.

### Added

- README section "文字の配色と描画": the palette table, why ClearType tinting happens (and that `-webkit-font-smoothing` / `text-rendering` are ignored by Chromium), and how to apply the same treatment to custom text surfaces rendered outside `Window`.

## [0.2.4] - 2026-10-12

### Added

- `Window` `modal` prop: renders `role="dialog"` / `aria-modal="true"` / `aria-label={title}` (all overridable through props), draws a full-viewport backdrop that blocks interaction with the windows behind it, focuses itself on mount, and calls `onClose` on `Escape`.
- `MenuBar` top-level items expose `data-menu-id` (explicit `MenuBarMenu.id`, falling back to the label) so tests can target them without matching the split accelerator markup.
- `Tabs` `fill` prop (fills the parent height via flex) and `panelClassName` for styling the tab panel.
- `TableView` accepts `string | number` row ids and normalizes them internally, so numeric ids highlight and toggle correctly instead of silently failing.
- `Checkbox`, `OptionButton`, `TextBox`, and `TextArea` accept an omitted `label` (and `id`), rendering a bare input that can be named with `aria-label`.

### Changed

- The demo app now builds to `demo-dist` (GitHub Pages workflow updated) so `bun run build` no longer empties the library output in `dist`.
- README documents consumer-side setup: `resolve.dedupe: ['react', 'react-dom']`, tarball-based local installation, the fact that no `build.cssMinify` override is needed, and how to control stacking order with `zIndex` instead of wrapper CSS.

## [0.2.3] - 2026-06-13

### Added

- `Window` snap overlap avoidance: when a snapped foreground window overlaps a lower-z snapped background window, the background window shrinks by the overlap amount instead of being hidden.
- `calculateShrinkRect` collision helper to compute minimal shrink geometry for overlapping rectangles.
- `useWindowManager` shrink/resize request state with `requestResize`, `clearResizeRequest`, `restoreShrink`, and `setWindowSnapped`.
- `Window` integration that resolves overlap by z-order priority, restores pre-shrink geometry on unsnap or manual drag/resize, and falls back to existing move-away behavior when shrink is impossible.
- Storybook `SnapOverlapShrink` scenario and Playwright visual QA script to verify zero overlap area after snap.
- `pack:lib` script (build + `bun pm pack`) and `prepublishOnly` guard so the published tarball always matches `exports`.

### Changed

- `WindowManagerContext` now exposes `resizeRequests`, `preShrinkGeometries`, `requestResize`, `clearResizeRequest`, `restoreShrink`, and `setWindowSnapped`.
- `MenuBar` dropdowns now render into a popup layer on `document.body` (`position: fixed`, high `z-index`) instead of inside the menubar subtree, so they are no longer hidden behind other windows or clipped by ancestor overflow.
- `Window` forwards arbitrary DOM props (`data-testid`, `aria-*`, ...) to its root element; a consumer `onPointerDown` is composed with the internal focus handling.
- Package metadata: `exports` now points `./style.css` at the emitted `dist/style.css`, `types` comes first, and `./package.json` is exported.
- Dependencies updated to their latest releases (React 19.3, Vite 8.3, Vitest 5, Storybook 10.6, ESLint 10.12, `@testing-library/jest-dom` 7, jsdom 30, Playwright 1.64, ...).
- TypeScript now runs as two toolchains: `@typescript/native` (TS 7 compiler for `tsc -b`) plus the TS 6 API package that `typescript-eslint` and `vite-plugin-dts` consume.

### Fixed

- Background snapped windows no longer remain hidden behind overlapping foreground snapped windows when `autoMoveOnSnap` is enabled.
- `import '@megablacklabel/react98retro/style.css'` failed to resolve because the export pointed at `dist/style.css` while the build emitted `dist/react98retro.css`.
- Consumers' `vite build` failed with `SyntaxError: [lightningcss minify] Invalid media query` because the bundled 98.css uses `@media (not(hover))`; the shipped CSS is now normalized to `@media not (hover)`.
- Snap preview could stay on screen after the pointer left the snap zone: the rAF throttle flag was never cleared when `requestAnimationFrame` runs synchronously.
- `Tabs` keyboard navigation no longer relies on a dead `nextIdx` initialization (`no-useless-assignment`), and `FileExplorer` callbacks declare their `setSelectedIds` dependency.


## [0.2.2] - 2026-06-12

### Added

- Unit tests for previously uncovered components and modules: `FieldRow`, `Win98Provider`, `Menu`, `SplitButton`, `FileTree`, `Icon`, icon mappings, and public barrel exports.
- Additional `FileExplorer` tests for status-bar object count, selected file size, and address-bar path.
- Expanded `components/index.test.ts` to assert exports of `FieldRow`, `Win98Provider`, `Window`, `Button`, `Menu`, and `SplitButton`.

### Changed

- Simplified `AddressBar` to use the controlled `value` prop directly instead of internal mirrored state.
- Refined drag, resize, and window-manager hooks to update refs inside `useEffect`, avoiding stale closures during pointer events.
- Updated the publish workflow to run only unit tests, removing the Playwright dependency from package releases.
- Bumped package version to 0.2.2.

### Fixed

- `Window` now schedules programmatic move requests with `requestAnimationFrame` before updating position and clearing the request.
- `useResizable` reliably removes the active pointer listeners on resize end.
- `FileList` sorting comparison now initializes the difference explicitly for each column case.
- `useFileSystem` derives the current node and display path directly from the latest filesystem state, keeping the address bar in sync after mutations.

## [0.2.1] - 2026-06-11

### Added

- Auto-move inactive windows on snap to prevent windows from being hidden
- `autoMoveOnSnap` prop on `Win98Provider` to enable/disable auto-move behavior (default: false)
- Per-window `autoMoveOnSnap` prop override on `Window` component
- Geometry tracking in `useWindowManager` via `updateGeometry`/`getAllGeometries`
- Move request system for programmatic window movement via `requestMove`/`clearMoveRequest`
- Collision detection utilities (`isColliding`, `calculateEscapePosition`, `findCollisions`)
- Window components automatically report position/size changes to the window manager
- Window components respond to move requests from the window manager
- Storybook preview configured with `autoMoveOnSnap: true` for component testing

### Changed

- `UseWindowManagerResult` interface now includes `geometries` and `moveRequests` state
- `Win98Provider` accepts optional `autoMoveOnSnap` prop
- Demo `App.tsx` enables `autoMoveOnSnap` for multi-window demonstration

### Fixed

- Inactive windows no longer get completely hidden behind snapped windows

## [0.2.0] - 2026-06-10

### Added

- Window focus management with automatic z-index coordination
- `WindowManagerContext` for multi-window state management
- Dynamic `register`/`unregister` in `useWindowManager` hook
- Auto-focus on first window registration
- Inactive window styling (gray title bar for Windows 98 look)
- Click-to-focus behavior on any window area
- `useWindowManager` exported from public API (`src/index.ts`)
- Multiple FileExplorer demo in `App.tsx`
- `bunfig.toml` with `minimumReleaseAge = 259200` (3 days)

### Changed

- Updated 22+ dependencies to latest versions
- `Win98Provider` now provides `WindowManagerContext`
- `Window.tsx` auto-detects context and participates in focus management

### Fixed

- Active window always stays on top when new windows register
- Single window inside Win98Provider now starts active (backward compat)

## [0.1.0] - 2026-04-10

### Added

- Scoped 98.css styles with Win98Provider to prevent global CSS conflicts
- GitHub Packages publishing support
- Mutable file system actions in the explorer (cut, copy, paste, delete, rename)
- Sortable table headers in file list views
- Explorer list sorting and view modes (details, icons, list)
- Menu and toolbar wiring for explorer actions
- Mobile and narrow viewport support for the file explorer window

### Fixed

- Drag and resize viewport clamping for better window boundary handling
- Window drag behavior after resize operations
- Toolbar separator styling to match menu groove style
- AddressBar grip margin alignment with MenuBar
- Menu bar usability in narrow layouts
- DotGothic16 font rendering on macOS
