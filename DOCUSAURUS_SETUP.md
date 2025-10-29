# Docusaurus Documentation Setup

This project uses [Docusaurus](https://docusaurus.io/) to build a public documentation site from the markdown files in the `/docs` directory.

## Setup

Docusaurus is already configured and ready to use. The configuration:

- **Source**: `/docs/**` - All markdown files in the docs directory
- **API Docs**: Automatically includes TypeDoc-generated API documentation from `/docs/api/`
- **Build Output**: `/build` directory (gitignored)
- **Deployment**: GitHub Pages via GitHub Actions

## Local Development

Start the development server:

```bash
npm run docs:start
# or
npm run docs:dev
```

The site will be available at `http://localhost:3000`

## Building for Production

Build the static site:

```bash
npm run docs:build
```

This will:

1. Generate TypeDoc API documentation (`npm run docs`)
2. Build the Docusaurus site (`docusaurus build`)

The built site will be in the `/build` directory.

## Deploying

The site is automatically deployed to GitHub Pages when you push to `main` via the GitHub Actions workflow (`.github/workflows/docs.yml`).

To manually trigger deployment:

1. Go to GitHub Actions
2. Select "Build and Deploy Documentation"
3. Click "Run workflow"

## Customization

- **Configuration**: `docusaurus.config.js`
- **Sidebar**: `sidebars.js`
- **Styles**: `src/css/custom.css`
- **Static Assets**: `static/` directory

## Notes

- The docs are served at the root path (`/`) rather than `/docs`
- TypeDoc-generated API docs are automatically included from `/docs/api/`
- No rewriting required - your existing markdown files work as-is!
