# Reddit Clone Design System

## Brand Identity

- **Name:** Reddit Clone
- **Core Values:** Community-driven, conversational, accessible, and structured.
- **Visual Style:** Clean, modular, and content-first with a high-contrast interaction layer (Reddit Orange).

## Color Palette

### Primary (Brand)

- **Reddit Orange:** `#FF4500` (Main CTA, logo highlights, active states)
- **Upvote:** `#FF4500`
- **Downvote:** `#7193FF`

### Backgrounds

- **App Background:** `#DAE0E6` (Light grey for subtle separation)
- **Surface Background:** `#FFFFFF` (Posts, sidebar cards, navigation)
- **Dark Mode Background:** `#030303` (Pure black for OLED)
- **Dark Mode Surface:** `#1A1A1B` (Elevated dark surfaces)

### Typography

- **Primary Font:** `IBM Plex Sans`, `Arial`, sans-serif
- **Secondary Font (Heads):** `Noto Sans`
- **Body Text:** 14px (Normal), 12px (Metadata/Small)
- **Post Titles:** 18px Bold

## Layout & Grids

- **Max Width:** 1200px (Centered)
- **Structure:**
  - Left: Navigation/Feeds (optional/collapsed)
  - Center: Main Content Feed (640px - 800px)
  - Right: Sidebar Widgets (312px)
- **Spacing:** 8px base grid (4px, 8px, 12px, 16px, 24px)

## Components

### Post Card

- **Structure:** Vote bar (left), Content area (right).
- **Styling:** White background, 1px solid `#CCCCCC` border, 4px border-radius.
- **Hover:** Border changes to `#898989`.

### Buttons

- **Primary:** Rounded (pill shape), `#FF4500` background, white text.
- **Secondary:** Pill shape, ghost/outlined style, `#0079D3` (Reddit Blue).

### Navigation

- **Top Bar:** Fixed, search bar centered, logo left, user profile right.

## Interaction Patterns

- **Infinite Scroll:** Native feed behavior.
- **Collapsible Threads:** Nested comments with vertical indentation lines.
- **Modals:** Used for authentication and post creation.
