# react98retro - Repository Guide

Generated: 2026-04-07 22:19:50 JST  
Commit: 61ce9481  
Branch: main

---

## OVERVIEW

This repo is both a **library** and a **demo app**.

- **Library surface**: `src/index.ts` exports `./components` and `./icons`
- **Demo app**: `src/main.tsx` mounts `App.tsx` which wraps `FileExplorer` in `Win98Provider`
- **Excluded from package**: `src/features/**`, `src/App.tsx`, `src/main.tsx` (see `vite.lib.config.ts`)

---

## STRUCTURE

```
src/
  index.ts              # Public package API (exports ./components, ./icons)
  components/           # 20+ UI components (public)
  icons/                # Icon subsystem via Chicago95 CDN (public)
  hooks/                # Window behavior hooks (internal, not exported)
  features/file-explorer/   # Demo-only integration code
```

---

## COMPONENTS (`src/components/`)

Standard co-located component pattern:
```
ComponentName/
  ComponentName.tsx
  ComponentName.test.tsx
  ComponentName.stories.tsx
  index.ts
  ComponentName.module.css (optional)
```

**Local exceptions:**
| Pattern | Location | Notes |
|---------|----------|-------|
| `FieldRow.tsx` | `src/components/FieldRow.tsx` | Flat file, no subdirectory |
| `Win98Provider/` | `src/components/Win98Provider/` | Context provider for 98.css scoping |
| `Icon/` | `src/components/Icon/` | Story-only showcase; implementation lives in `src/icons/` |

PascalCase and kebab-case directories intentionally coexist. Follow local precedent.

Components stay reusable/library-grade. Do not put file-explorer-specific assumptions here.

### Window Composite (`src/components/window/`)

`Window`, `TitleBar`, `StatusBar` are one composite module.

**Shared state:** `Window.tsx` owns one `position` state shared by:
- `useDraggable` — title-bar drag moves the window
- `useResizable` — edge/corner resize updates size and position

**Behavior:**
- Min/max/restore are semi-controlled (internal state + external callbacks)
- Title-bar button clicks must not trigger drag (checked via `e.target.closest('button')`)
- Resize handles disappear when minimized/maximized
- Drag props are stripped when minimized

---

## ICONS (`src/icons/`)

Runtime Chicago95 jsDelivr mapping. No local icon assets bundled.

**CDN source:** `https://cdn.jsdelivr.net/gh/grassmunk/Chicago95@master/Icons/Chicago95/...`

**Exports:**
- `ICONS` — object mapping icon names to full CDN URLs
- `getFileIcon(filename)` — central extension-policy point for file-to-icon mapping
- `Icon` — thin wrapper component (`<Icon name="..." size={16|32} />`)

**Icon categories:** Drives, Folders, System, Files, Toolbar, Shell

**File icon policy (getFileIcon):**
- `.exe`, `.com` -> `fileExecutable`
- `.txt`, `.log` -> `fileText`
- `.png`, `.jpg`, `.gif`, `.bmp` -> `fileImage`
- `.html`, `.htm` -> `fileHtml`
- `.js`, `.ts`, `.vbs`, `.bat` -> `fileScript`
- fallback -> `fileGeneric`

Internet connection required. Sizes: 16px (toolbar, lists), 32px (desktop, large icons).

---

## HOOKS (`src/hooks/`)

Internal window behavior hooks. **Not exported from `src/index.ts`.**

| Hook | Purpose |
|------|---------|
| `useDraggable` | Pointer-based drag from a handle (title bar) |
| `useResizable` | 8-directional resize with cursor feedback |
| `useWindowManager` | z-index tracking and window state registry (exists but not fully wired into `Window` today) |

**Implementation notes:**
- Stale-closure prevention via refs (`positionRef.current = position` inside handlers)
- Pointer listeners attach to `window` (not element) to handle cursor leaving bounds
- Cleanup mandatory: `window.removeEventListener('pointermove', onPointerMove)`
- `pointerId` check required to prevent multi-touch conflicts

---

## FILE EXPLORER (`src/features/file-explorer/`)

Demo-only integration code. Excluded from library build by `vite.lib.config.ts`.

**Files:**
| File | Role |
|------|------|
| `FileExplorer.tsx` | Main assembly: Window + MenuBar + Toolbar + AddressBar + FileTree/FileList + StatusBar |
| `FileTree.tsx` | Left pane using `TreeView` |
| `FileList.tsx` | Right pane using `TableView` |
| `useFileSystem.ts` | In-memory fake filesystem with navigation history |

**In-memory filesystem:** Static tree mimicking Windows 98 (`C:\WINDOWS`, `C:\My Documents`, etc.). No real filesystem access.

**Explorer-specific UX glue belongs here:**
- Navigation history (back/forward/up)
- Splitter drag between tree and list panes
- Toolbar button state (disabled when cannot go back/forward/up)
- Status bar text (object count, selection size)
- Address bar path display and dropdown

Do not import from here into `src/components/` or `src/icons/`.

---

## PACKAGE BUILD

- **Entry**: `src/index.ts`
- **Config**: `vite.lib.config.ts`
- **Exclusions**: `src/features/**`, `src/App.tsx`, `src/main.tsx`, `src/**/*.stories.*`, `src/**/*.test.*`
- **CSS scoping**: 98.css gets `.win98` prefix via PostCSS (see `transform` in vite.lib.config.ts)

---

## TESTING & STORIES

- **Unit tests**: Vitest with jsdom environment (`src/**/*.test.{ts,tsx}`)
- **Stories**: Storybook 10 with `@storybook/addon-vitest` integration
- **Provider wrap**: `.storybook/preview.tsx` wraps all stories in `Win98Provider`

---

## COMMANDS

```bash
mise run dev              # Dev server
mise run storybook        # Storybook
mise exec bun -- run build:lib   # Library build
mise exec bun -- run test:coverage  # Coverage
```

---

## DEPLOYMENT

- **GitHub Pages**: `base: '/react98retro/'` in `vite.config.ts`
- **GitHub Packages**: Published as `@megablacklabel/react98retro`
- **Registry**: `npm.pkg.github.com` (see README for `.npmrc` setup)

---

## WHERE TO LOOK

| What | Where |
|------|-------|
| Library entry | `src/index.ts` |
| Package build config | `vite.lib.config.ts` |
| Demo wiring | `src/App.tsx` + `src/main.tsx` |
| Storybook wrap | `.storybook/preview.tsx` |
| Window hook integration | `src/components/window/Window.tsx` |
| Icon CDN mapping | `src/icons/icons.ts` |
| File icon policy | `src/icons/icons.ts` `getFileIcon()` |

---

## ANTI-PATTERNS

- Do **not** import from `src/features/**` in library code (excluded from build)
- Do **not** assume local icon assets exist; icons are CDN-backed via jsDelivr
- Do **not** trust `.github/copilot-instructions.md` as current; it references stale `windows98-icons/png/` paths
- Do **not** put filesystem-specific logic in `src/components/`
- Do **not** export hooks from `src/index.ts` without considering bundle impact
- Do **not** skip `pointerId` check in drag/resize handlers (prevents multi-touch conflicts)

---

## NOTES

- `scripts/*.mjs` are ad-hoc Playwright helpers writing screenshots to `image/`
- `report/YYYYMMDD/report.md` is implementation history, not source of truth
- `src/components/Icon/Icon.stories.tsx` is showcase-only; implementation lives in `src/icons/`
