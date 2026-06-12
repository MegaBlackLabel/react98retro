# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
