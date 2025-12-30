# Gradnja – Stroški

Offline-first namizna aplikacija za spremljanje stroškov gradnje. Grajena z Electron + Vite + React + TypeScript + Tailwind + framer-motion + Recharts ter lokalno SQLite bazo (better-sqlite3).

## Hitri začetek (Windows-first)

1. Namesti odvisnosti
   ```bash
   npm install
   ```
2. Zaženi razvojni način (odpre Electron okno)
   ```bash
   npm run dev
   ```

## Build (Windows .exe)

```bash
npm run build
```

## Struktura
- `/electron`: glavni proces, baza in IPC handlerji
- `/src`: renderer (React)
- `/src/features`: domenske funkcionalnosti (dashboard, costs, phases, contractors, documents, settings, style-guide)
- `/src/components`: skupne UI komponente
- `/src/lib`: helperji (IPC wrapperji, utils)
- `/src/store`: globalno stanje (zustand)
- `/src/styles`: globalni stili

## Podatki & poti
- Baza: `%APPDATA%/GradnjaStroski/data/app.db`
- Uploadi: `%APPDATA%/GradnjaStroski/data/uploads`
- Uporabljene poti vedno prek `path.join` in `app.getPath('userData')`
