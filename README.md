# Gradnja – Stroški

Offline-first namizna aplikacija za spremljanje stroškov gradnje. Grajena z Electron + Vite + React + TypeScript + Tailwind + framer-motion + Recharts ter lokalno SQLite WASM bazo (sql.js) – brez Pythona / node-gyp.

## Hitri začetek (Windows-first)

1. Namesti odvisnosti (Python ni potreben)
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
- Baza: `%APPDATA%/GradnjaStroski/data/app.sqlite`
- Uploadi: `%APPDATA%/GradnjaStroski/data/uploads`
- Uporabljene poti vedno prek `path.join` in `app.getPath('userData')`

### Ponastavi podatke
Z zaprtim programom izbriši datoteko `%APPDATA%/GradnjaStroski/data/app.sqlite` (po potrebi tudi mapo uploads). Ob ponovnem zagonu se baza znova inicializira z osnovnimi fazami.
