# Documentation Refactoring Design

## Overview

Refactor all 126 documentation files in the `/docs` folder to improve UI/UX, readability, and developer experience for Revenue Monster API documentation.

## Goals

1. Make documentation clean, professional, and visually structured
2. Simplify language into short, clear, easy-to-understand sentences
3. Keep content informative but concise
4. Optimize for scanability

## Core Rules

- **Do NOT change the meaning of content**
- Remove non-essential details only if core meaning remains intact
- Preserve all images, videos, and media exactly as-is
- Ensure every API doc includes clear step-by-step instructions

## Refactoring Priority

1. **Intro docs first** (`introduction/`, `quickstart/`) — establish baseline patterns
2. **Core API docs** (`payment-method.mdx`, `error-codes.md`, etc.)
3. **Feature docs** (`campaign/`, `ekyc/`, `merchant-onboarding/`)
4. **Plugin/integration docs** (`ecom-plugin/`, `v2/`, etc.)

## Per-File Checklist

### Structure
- [ ] Clear heading hierarchy (H1 → H2 → H3, no skipped levels)
- [ ] Break long paragraphs into smaller chunks (3-4 sentences max)
- [ ] Use spacing and dividers to group related content
- [ ] Ensure each API page answers: What is this? When to use it? How to use it?

### Formatting
- [ ] Code blocks properly formatted (JSON, bash, etc.)
- [ ] Technical terms use monospace font (`code`, not default font)
- [ ] Apply consistent formatting across all docs
- [ ] Convert markdown tables to `ParamTable` component where applicable

### Highlighting
- [ ] Use `:::tip`, `:::warning`, `:::important` for important info
- [ ] Highlight key terms, parameters, field names in monospace
- [ ] Make notes, warnings, and tips visually distinct

### Code Examples
- [ ] All request/response examples in proper code blocks
- [ ] JSON properly formatted with indentation
- [ ] cURL examples normalized and clean

## Available Components

| Component | Purpose |
|-----------|---------|
| `ParamTable` | Parameter tables with name, type, description, example |
| `ApiPlayground` | Interactive API examples with multi-language snippets |
| `Tabs` / `TabItem` | Environment-specific content (sandbox vs production) |
| `:::tip` | Tips and best practices |
| `:::warning` | Warnings and important notices |
| `:::important` | Critical information |

## Patterns by Doc Type

### Overview/Introduction Pages
```
# [Title]

[2-3 sentence summary]

## What is this?
[Concise explanation]

## Prerequisites
[Step-by-step setup if applicable]

## Next Steps
[Links to related docs]
```

### API Endpoint Pages
```
# [Endpoint Name]

[Brief description of what this endpoint does]

## When to Use
[When/why to use this endpoint]

## Request
[Parameters table or code block]

## Response
[Response format with example]

## Example
[Full working example - cURL, code snippet]
```

### Reference Pages (error codes, etc.)
```
# [Title]

[Brief intro]

## [Category 1]
[Related items grouped]

## [Category 2]
[Related items grouped]
```

## Files to Skip / Special Handling

- **Very large files** (>10k tokens): Split into logical sections
- **MDX files with JSX**: Preserve JSX components, refactor markdown around them
- **Files using custom components**: Don't break existing working components

## Success Criteria

- All docs follow consistent formatting patterns
- Technical terms consistently formatted in monospace
- Code examples clean and properly formatted
- Scanability improved (users can understand content quickly)
- API docs follow What / When / How structure