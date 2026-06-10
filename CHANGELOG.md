# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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