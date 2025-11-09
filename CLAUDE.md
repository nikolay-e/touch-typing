# CLAUDE.md - touch-typing

## Project Overview

Free online touch typing practice application supporting English and Russian keyboards. Static HTML/CSS/JavaScript application served via nginx, designed for Kubernetes deployment.

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Server**: nginx (Alpine-based Docker image)
- **Deployment**: Docker + Kubernetes (Helm chart)
- **Build**: No build process (static files)

## Project Structure

```
touch-typing/
├── src/
│   ├── index.html          # Main HTML page
│   ├── css/
│   │   └── styles.css      # Application styles
│   └── js/
│       ├── app.js          # Main application logic
│       ├── config.js       # Configuration and constants
│       ├── stats.js        # Statistics tracking
│       └── ui.js           # UI management
├── Dockerfile              # nginx Alpine container
└── directory_tree.yaml
```

## Features

- **Bilingual Support**: English and Russian keyboard layouts
- **Multiple Practice Modes**: Letters, bigrams, words, sentences
- **Real-time Statistics**: WPM, accuracy, average response time
- **Visual Keyboard**: On-screen keyboard with current key highlighting
- **Data Export/Import**: Save and restore practice statistics (JSON)
- **Dark Mode**: Theme switching
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## Commands

### Local Development

```bash
# Run with Python's built-in HTTP server
cd src/
python -m http.server 8000

# Or use any static file server
npx serve src/
```

Access at `http://localhost:8000`

### Docker Development

```bash
# Build image
docker build -t touch-typing:local .

# Run container
docker run -p 8080:80 touch-typing:local

# Access at http://localhost:8080
```

### Production Deployment (GitOps via Argo CD)

This application is deployed via GitOps using Argo CD. Deployment configuration is managed in the `gitops` repository.

**Deployment managed via Argo CD** - see `../gitops/helm-charts/touch-typing/` for configuration.

## Development Notes

### No Build Process
This is a static site with vanilla JavaScript. No webpack, no npm dependencies, no build step. Just edit and refresh.

### Browser Compatibility
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- ES6+ features used (arrow functions, classes, modules via inline scripts)
- Local Storage API for data persistence

### Adding New Practice Modes
1. Add mode configuration to `src/js/config.js`
2. Update UI generation in `src/js/ui.js`
3. Add mode logic in `src/js/app.js`

### Statistics Storage
Statistics are stored in browser `localStorage`:
- `touchTypingData` - per-character statistics
- `settings` - user preferences (theme, language, mode)

## Testing

Since this is a static site without dependencies:

```bash
# Manual testing checklist:
# 1. Load page in browser
# 2. Test all practice modes (letters, bigrams, words, sentences)
# 3. Switch between English and Russian layouts
# 4. Verify statistics accuracy (WPM, accuracy, timing)
# 5. Test export/import functionality
# 6. Test dark mode toggle
# 7. Verify keyboard visual highlighting
# 8. Test accessibility (keyboard navigation, screen readers)
```

For integration/E2E tests, use Playwright or Cypress to automate browser interactions.

## Common Issues

**Fonts not loading**: Check nginx is serving static files correctly
**Statistics not persisting**: Verify localStorage is enabled in browser
**Keyboard layout mismatch**: Check browser language settings vs application language setting

## Related Files

See parent workspace:
- `../CLAUDE.md` - Core development principles
- `../private/SYSTEM_SETUP.md` - Workspace infrastructure
- `../gitops/` - GitOps deployment manifests
