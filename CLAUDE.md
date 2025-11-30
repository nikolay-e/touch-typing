# touch-typing

Touch typing practice app supporting English and Russian keyboards.

## Tech Stack

- Vanilla JavaScript (ES6+), HTML5, CSS3
- No build process (static files)
- nginx Docker container

## Commands

```bash
# Local dev
cd src && python -m http.server 8000

# Docker
docker build -t touch-typing .
docker run -p 8080:80 touch-typing
```

## Structure

```
src/
├── index.html
├── css/styles.css
└── js/
    ├── app.js      # Main logic
    ├── config.js   # Constants
    ├── stats.js    # Statistics
    └── ui.js       # UI management
```

## Features

- Practice modes: letters, bigrams, words, sentences
- Real-time stats: WPM, accuracy, response time
- Visual keyboard with highlighting
- Data export/import (JSON)
- Dark mode, accessibility (ARIA)

## Deployment

GitOps via Argo CD. See `../gitops/helm-charts/touch-typing/`
