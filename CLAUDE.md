# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tobias Gatschet's Personal Website** - A modern, static website built with Eleventy (11ty), featuring a portfolio, blog, and professional information. The site uses a professional FDP-Switzerland color scheme (primary blue #003da5, accent gold #f4c300).

## Quick Start Commands

```bash
# Start development server with live reload (default port 8080)
npm start

# Build for production (outputs to dist/)
npx eleventy
```

## Project Architecture

### Directory Structure

```
src/
├── index.html                 # Homepage
├── aboutme.html              # About me/CV page with experience timeline
├── blogs.html                # Blog listing page
├── politics.html             # Politics/views page
├── contact.html              # Contact page
├── _includes/
│   ├── layouts/
│   │   ├── base.html         # Main layout wrapper (nav + footer)
│   │   └── blogpost.html     # Blog post template
│   ├── basenavigation.html   # Navigation component
│   └── footer.html           # Footer component
├── _data/
│   └── experience.json       # Experience data for about-me timeline (JSON)
├── blog/                     # Blog posts (Markdown files with frontmatter)
├── experience/               # Additional experience data
├── css/
│   ├── variables.css         # Design tokens (colors, spacing, etc.)
│   ├── global.css            # Global styles and navigation
│   ├── home.css              # Homepage hero and blog cards
│   ├── aboutme.css           # About page timeline styling
│   ├── blogs.css             # Blog listing page
│   ├── contact.css           # Contact page
│   ├── politics.css          # Politics page
│   └── footer.css            # Footer styling
├── js/                       # JavaScript files
└── assets/                   # Images and static files

.eleventy.js                  # Eleventy configuration
dist/                         # Built output (git-ignored)
```

### Key Technical Choices

**Eleventy with Nunjucks**: Uses Nunjucks templating engine for flexible template composition. All templates support Nunjucks syntax even HTML and Markdown files.

**Collections**:

- `blog` - Blog posts tagged with `tags: blog`, sorted by date (newest first)
- Data-driven collections can be added to `.eleventy.js`

**Data Sources**:

- `_data/experience.json` - Global data accessible as `experience` variable in templates
- Markdown frontmatter - Each markdown file's YAML front matter becomes `post.data.*`

**Template Hierarchy**:

1. Page templates (HTML/MD) use `layout: layouts/base.html`
2. Base layout includes navigation and footer
3. Blog posts use `layout: layouts/blogpost.html`

## Design System

### Colors (CSS Variables)

- Primary: `--color-primary: #003da5` (FDP Blue)
- Primary Dark: `--color-primary-dark: #002d7d`
- Accent: `--color-accent: #f4c300` (FDP Gold)
- Background: `--color-bg: #ffffff`
- Light Background: `--color-bg-light: #f8f9fa`
- Text: `--color-text: #1a1a1a`
- Text Secondary: `--color-text-secondary: #666`

### Spacing System

- `--spacing-xs: 0.5rem` through `--spacing-2xl: 4rem`

### Common Patterns

- Hero sections use gradient: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)`
- Section titles have underline: pseudo-element with `--color-accent` background
- Cards have left border: `border-left: 4px solid var(--color-primary)`, change to accent on hover

## Common Development Tasks

### Adding a Blog Post

1. Create file: `src/blog/YYYY-mm-dd-slug.md`
2. Add frontmatter:

```yaml
---
layout: layouts/blogpost.html
title: Post Title
date: 2025-04-18
description: Short description
permalink: "/blog/slug/"
image: /assets/images/blogposts/image.png
tags: blog
kategorie: politik # or technik
---
```

3. Write content in Markdown below frontmatter

### Adding Experience Entry

Edit `src/_data/experience.json` and add object:

```json
{
  "title": "Company Name",
  "period": "Start - End",
  "startDate": "YYYY-MM-DD",
  "year": 2025,
  "position": "Your Role",
  "description": "What you did",
  "showYear": true  # Shows year in timeline circle
}
```

Entries are automatically sorted by startDate (newest first).

### Styling a New Page

1. Create `src/pages/newpage.html` with frontmatter: `newpagecss: true`
2. Create `src/css/newpage.css`
3. Import in layout or reference via frontmatter
4. Use CSS variables for consistency

### Adding Navigation Items

Edit `src/_includes/basenavigation.html` - add `<li>` to the `<ul>` in `.nav-links`

## Important Implementation Details

### About-Me Timeline

- Hero section is very large (380px portrait, 3.5em title)
- Timeline items use year markers (blue circles) for milestone years
- Experience data is in `_data/experience.json` (not markdown files)
- Timeline renders newest-to-oldest via `| reverse` filter

### Responsive Design

- Mobile breakpoint: 768px
- Small mobile breakpoint: 480px
- Navigation transforms to burger menu on mobile with full-screen overlay
- Footer is compact (50px height) with 28px white social icons

### CSS Organization

- `variables.css` first (imported by global.css)
- `global.css` handles nav, footer, body styles
- Page-specific CSS files for hero, cards, layouts
- No CSS framework - vanilla CSS with modern features (Grid, Flexbox, CSS Variables)

## Git Workflow Notes

- Branch: `new-website` (currently active feature branch)
- Main branch: `main` (production)
- Recent changes: FDP design overhaul, About-Me timeline refactor, homepage hero redesign
- No automatic deployments configured - manual build and push to dist required

## Notes for Next Sessions

- **Recent redesign (April 2025)**: Complete FDP Switzerland color scheme implementation, modern hero sections, and footer redesign. Future work should maintain this cohesive design language.
- **Experience data**: Currently JSON-based in `_data/experience.json`. If bulk editing needed, validate JSON syntax carefully.
- **Image references**: Portrait uses `/assets/images/Portrait.jpg` - should be user-swappable
- **Mobile menu**: Uses fixed positioning overlay on small screens - test carefully when modifying
