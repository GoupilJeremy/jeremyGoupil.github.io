# CLAUDE.md

## Project Overview

This is **jeremyGoupil.github.io** — a personal portfolio/resume website for Jeremy Goupil, hosted on GitHub Pages. It is a static HTML/CSS/JS site with no build tools, frameworks, or dependencies.

**Live URL:** https://jeremygoupil.github.io

## Repository Structure

```
.
├── index.html              # Main (and only) HTML page — the portfolio
├── params.json             # GitHub Pages internal config (do not delete)
├── images/                 # Image assets (background, GitHub logo)
│   ├── bkg.png
│   └── blacktocat.png
├── javascripts/
│   └── main.js             # Placeholder JS file (currently just a console.log)
└── stylesheets/
    ├── stylesheet.css       # Base GitHub Pages theme (dark/terminal aesthetic)
    ├── custom.css           # Portfolio-specific styles (overrides base theme)
    ├── pygment_trac.css     # Syntax highlighting theme
    └── print.css            # Print stylesheet (referenced but may not exist)
```

## Technology Stack

- **HTML5** — semantic markup, single-page layout
- **CSS3** — no preprocessors, no CSS framework; styles use `!important` overrides on the base GitHub Pages theme
- **Vanilla JavaScript** — minimal usage (placeholder only)
- **GitHub Pages** — automatic deployment from the `master` branch

There is **no** package.json, no npm, no build step, no bundler, no testing framework, no linter configuration.

## Design System / Styling Conventions

The visual design is defined in `stylesheets/custom.css`, overriding the base GitHub Pages theme in `stylesheets/stylesheet.css`.

- **Color palette:**
  - Header background: `#2c3e50` (dark blue-gray)
  - Accent / links: `#1abc9c` (teal)
  - Text: `#333` (body), `#555` (paragraphs), `#7f8c8d` (muted/company info)
  - Borders / list items background: `#ecf0f1` (light gray)
  - Body background: `#fff`
- **Typography:** Helvetica Neue / Helvetica / Arial / sans-serif
- **Layout:** 80% width container, centered, with box-shadow card for main content
- **Convention:** `custom.css` uses `!important` extensively to override the base theme. Follow this pattern when adding new styles.

## Content Structure (index.html)

The page contains:
1. **Header** — site title "Jeregoupix" with a GitHub profile link (currently hidden via CSS)
2. **About Me** — brief introduction
3. **Experience** — list of `.job` div blocks, each containing:
   - `<h3>` — job title
   - `<p class="company-info">` — company, dates, location
   - Optional `<ul>` with bullet points describing responsibilities
   - Optional `<p><strong>Skills:</strong> ...</p>`

When adding new experience entries, follow the existing `.job` div pattern.

## Git Workflow

- **Primary branch:** `master` (deployed to GitHub Pages)
- **Remote default branch:** `main` (on GitHub)
- **Feature branches:** use the pattern `feature/<description>` or `claude/<description>`
- **Commit messages:** use conventional commit style — e.g., `feat: Update portfolio with professional experience and new style`
- **PRs:** feature branches are merged via pull requests

## Deployment

Deployment is automatic via GitHub Pages. Pushing to the deployed branch makes changes live — there is no build step or CI pipeline.

**Important:** Since there is no build/test gate, verify changes locally before pushing. Any push to the deployed branch goes live immediately.

## Key Files to Know

| File | Purpose |
|---|---|
| `index.html` | The entire site content — this is the file to edit for content changes |
| `stylesheets/custom.css` | All custom styling — edit this for visual changes |
| `stylesheets/stylesheet.css` | Base theme — avoid editing; override in `custom.css` instead |
| `params.json` | GitHub Pages internal file — do not delete or modify |

## Guidelines for AI Assistants

- This is a simple static site. Do not introduce build tools, frameworks, or dependencies unless explicitly requested.
- Preserve the existing HTML structure and CSS class naming conventions (`.job`, `.company-info`, `#experience`, `#main_content`).
- When adding styles, add them to `custom.css`, not `stylesheet.css`.
- Use `!important` in `custom.css` when needed to override the base theme (this is the established pattern).
- Keep the site accessible — use semantic HTML elements and maintain good contrast ratios.
- The `params.json` file is used internally by GitHub Pages — never delete it.
- Content is in French date format (e.g., "Sept. 2021 - Apr. 2025") but English language.
