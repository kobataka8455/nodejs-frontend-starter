# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This project uses pnpm as the package manager. Key commands:

- `pnpm start` - Development mode: builds all assets, starts file watcher, and runs server on http://localhost:8282
- `pnpm build` - Production build: builds all assets (icon fonts, images, JS, EJS templates, SCSS)
- `pnpm lint` - Run all linting (runs lint:ejs, lint:js, lint:scss)
- `pnpm test` - Visual regression testing using BackstopJS
- `pnpm serve` - Start development server only
- `pnpm watch` - Start file watcher only

Individual build commands:
- `pnpm build:icon` - Compile SVG icons to icon font
- `pnpm build:image` - Optimize and process images
- `pnpm build:js` - Bundle TypeScript/JavaScript using Rollup
- `pnpm build:ejs` - Compile EJS templates to HTML
- `pnpm build:scss` - Compile SCSS to CSS

## Project Architecture

This is a Node.js frontend starter template with a custom build system. Architecture:

### Build System
- Custom npm scripts in `/npm-scripts/` handle all compilation
- Uses Rollup for JavaScript bundling, SASS for CSS, EJS for templating
- File watching and live reloading via browser-sync
- BackstopJS for visual regression testing

### Source Structure
- `/src/scripts/` - TypeScript source files, entry point is `index.ts`
- `/src/scss/` - SASS stylesheets with modular component structure
- `/src/ejs/` - EJS templates with partials in `/components/`
- `/src/icon-font/svg/` - SVG icons that compile to icon fonts
- `/src/images/` - Source images for optimization

### Build Output
- `/dist/` - Compiled assets for distribution

### Key Features
- Icon font generation from SVG files
- Component-based SCSS and EJS structure
- TypeScript compilation with ESLint
- Image optimization pipeline
- HTML minification and beautification
- Lint-staged pre-commit hooks

Node.js requirement: >=20.19.2 || >=22.16.0