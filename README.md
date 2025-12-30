# Gradnja – Stroški

Offline-first namizna aplikacija za spremljanje stroškov gradnje. Grajena z Electron + Vite + React + TypeScript + Tailwind + framer-motion + Recharts in lokalnim JSON shranjevanjem (brez Pythona in brez native modulov/node-gyp).

## Windows koraki (developerji)

1. Kloniraj projekt  
   ```bash
   git clone <repo-url>
   cd SS_V1
   ```
2. Namesti odvisnosti  
   ```bash
   npm install
   ```
3. Zaženi razvoj (Vite + Electron, odpre okno)  
   ```bash
   npm run dev
   ```
4. Pripravi produkcijski build rendererja + main procesa  
   ```bash
   npm run build
   ```
5. Ustvari Windows namestitveni EXE prek electron-builder  
   ```bash
   npm run dist
   ```

## Struktura
- `/electron`: glavni proces, JSON shramba in IPC handlerji
- `/src`: renderer (React + Tailwind + shadcn-style UI)
- `/src/features`: domenske funkcionalnosti (dashboard, costs, phases, contractors, documents, settings, style-guide)
- `/src/components`: skupne UI komponente in error boundary
- `/src/store`: globalno stanje (zustand)
- `/src/styles`: globalni stili

## Podatki & poti (Windows)
- Vsi podatki: `%APPDATA%/GradnjaStroski/data.json`
- Priponke: `%APPDATA%/GradnjaStroski/uploads/`
- Poti se pridobijo prek `app.getPath("userData")` in niso odvisne od Pythona ali native modulov.

### Ponastavi podatke
Z zaprtim programom izbriši datoteko `%APPDATA%/GradnjaStroski/data.json` (po potrebi tudi mapo `uploads`). Ob ponovnem zagonu se shramba znova inicializira z osnovnimi fazami.
