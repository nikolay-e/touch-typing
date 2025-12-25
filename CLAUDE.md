# touch-typing

> Extends [../CLAUDE.md](../CLAUDE.md)

Touch typing practice app supporting English and Russian keyboards.

## Tech Stack

- React 19, TypeScript, Vite 6
- Zustand for state management
- Tailwind CSS v4
- nginx Docker container

## Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint check
npm run format   # Prettier format

# Docker
docker build -t touch-typing .
docker run -p 8080:80 touch-typing
```

## Structure

```
src/
├── components/     # React components
│   ├── Keyboard.tsx
│   ├── TargetDisplay.tsx
│   ├── StatsPanel.tsx
│   ├── ModeSelector.tsx
│   └── SettingsBar.tsx
├── stores/         # Zustand stores
│   ├── settings-store.ts
│   ├── typing-store.ts
│   └── stats-store.ts
├── config/         # Keyboard layouts, character sets
├── hooks/          # Custom hooks
├── types/          # TypeScript types
├── App.tsx
└── main.tsx
```

## Features

- Practice modes: lowercase, uppercase, numbers, special chars
- N-gram modes: bigrams, trigrams, tetragrams, pentagrams
- Real-time stats: WPM, accuracy, response time
- Visual keyboard with key highlighting
- English (QWERTY) and Russian (ЙЦУКЕН) layouts
- Data export/import (JSON)
- Dark mode with system preference detection
- Accessible (ARIA labels, keyboard navigation)
- Persistent statistics via localStorage

## Deployment

GitOps via Argo CD. See `../gitops/helm-charts/touch-typing/`
