# Design tokens

Aplikacija uporablja enoten nabor CSS tokenov (nastavljeni v `src/styles/index.css`) za lučnejši premium izgled in popoln dark mode. Vrednosti so definirane kot RGB in se preklopijo z atributom `data-theme` na elementu `<html>`.

## Barve
| Token | Opis | Light | Dark |
| --- | --- | --- | --- |
| `--color-background` | Glavno ozadje aplikacije | `245 247 251` | `12 20 36` |
| `--color-surface` | Primarne površine/kartice | `255 255 255` | `15 23 42` |
| `--color-surface-elevated` | Dvignjene površine/inputi | `248 250 252` | `17 28 49` |
| `--color-muted` | Ozadja za tabele, sekundarne sekcije | `238 242 246` | `21 33 53` |
| `--color-border` | Robovi in delilniki | `227 232 239` | `31 42 61` |
| `--color-text-primary` | Primarno besedilo | `11 19 36` | `229 231 235` |
| `--color-text-secondary` | Sekundarno besedilo | `91 100 120` | `156 163 175` |
| `--color-accent` | Glavni poudarek (CTA, grafi) | `91 141 239` | `138 162 255` |
| `--color-accent-foreground` | Besedilo na poudarjenih elementih | `248 250 252` | `11 18 32` |
| `--color-success` | Pozitivna stanja | `34 197 94` | `52 211 153` |
| `--color-warning` | Opozorila | `245 158 11` | `251 191 36` |
| `--color-danger` | Napake | `239 68 68` | `248 113 113` |
| `--color-focus-ring` | Fokus/outline barva | `rgba(91, 141, 239, 0.45)` | `rgba(138, 162, 255, 0.35)` |
| `--shadow-soft` / `--shadow-card` | Mehke sence za kartice | svetle sence | temnejše sence |

> Opomba: Tailwind barve so vezane na te spremenljivke (`rgb(var(--token) / <alpha-value>)`), zato so `bg-*` in `text-*` razredi konsistentni v obeh temah.

## Tipografija
- Pisava: Inter, z glajenjema `-webkit-font-smoothing: antialiased`.
- Hierarhija: naslovi `CardTitle` z `text-lg`–`text-3xl`, opisi `CardDescription` z `text-sm text-muted-foreground`.
- KPI številke uporabljajo `text-3xl` in krepke uteži za boljšo čitljivost.

## Uporaba
- Uporabljajte barvne razrede Tailwind (`bg-surface`, `text-foreground`, `border-border`, `bg-muted`, `bg-primary/10` …). 
- Fokus in outline stanja naj uporabljajo `focus-visible:ring-[var(--color-focus-ring)]`.
- Dvignjene površine (inputi, dropdowni, modal) uporabljajo `bg-elevated` + `border-border` in mehko senco.
