# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Docusaurus 2 documentation site for Revenue Monster's API. The documentation covers payment processing, merchant onboarding, loyalty programs, eKYC, and more.

## Commands

```bash
npm start        # Start dev server with hot reload at http://localhost:3000
npm run build     # Build production bundle
npm run deploy    # Deploy to GitHub Pages
npm run swizzle   # Eject Docusaurus theme components for customization
```

## Architecture

### Documentation Structure
- `docs/` — Public API documentation (MDX format)
- `docs_internal/` — Internal payment API documentation
- `sidebars.js` — Sidebar navigation structure with category definitions

### Custom Components
- `src/components/ApiPlayground/` — Interactive API example component with multi-language code snippets and copy functionality
- `src/components/ParamTable/` — Parameter table component for API documentation
- `src/components/ApiExamples/` — API examples with copy-to-clipboard

### Custom Remark Plugin
`src/remark/apiPlayground.js` transforms MDX code blocks with ` ```api-playground ` language into the `<ApiPlayground />` component. Configuration is passed via YAML:

````
```api-playground
method: POST
endpoint: /v1/token
```
````

### Sidebar API Method Badges
Docs with `className: "api-get"`, `"api-post"`, etc. in `sidebars.js` display colored HTTP method badges (GET/POST/PUT/DEL/PATCH) next to the link. See `src/css/custom.css` lines 129-187 for styling.

### Theme Customization
- `src/theme/DocSidebar/` — Custom sidebar components
- `src/theme/DocItem/Layout/` — Custom doc layout
- `src/css/custom.css` — Global CSS overrides and API method badge styles
- `src/css/api-playground.css` — ApiPlayground component styles

### API Proxy
`rm-api-proxy/` — Cloudflare Workers-based API proxy (contains its own `package.json` and `wrangler.toml` for deployment).
