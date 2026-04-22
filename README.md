# Rybársky denník — Portál rybárskych revírov

Semestrálna práca pre predmet **TDMWS** (FEIT, Žilinská univerzita v Žiline).
Editoriálny rybársky almanach s plnohodnotnou backend logikou: register revírov, AJAX kniha úlovkov, admin panel, dark/light téma a OSM mapa.

## Tech stack

Node.js · TypeScript · Express · EJS · MySQL (`mysql2`) · `express-session` + `express-mysql-session` · Zod · Multer · Helmet · `express-rate-limit` · axios · Leaflet (OSM)

## Spustenie

```bash
# 1) MySQL — vytvorte prázdnu databázu
mysql -u root -e "CREATE DATABASE ticha_voda CHARACTER SET utf8mb4;"

# 2) Skopírujte .env a upravte podľa svojho lokálneho MySQL
cp .env.example .env

# 3) Inštalácia
npm install

# 4) Naplniť demo dátami (vytvorí schému + používateľov + 12 slovenských revírov + úlovky)
npm run seed

# 5) Vývojový server
npm run dev
# → http://localhost:3000
```

## Produkčný build

```bash
npm run build
npm start
```

## Demo účty (po `npm run seed`)

| Rola | Email | Heslo |
|---|---|---|
| Admin | `admin@tichavoda.sk` | `Admin123` |
| Rybár | `jozef@tichavoda.sk` | `Rybar123` |
| Rybár | `maria@tichavoda.sk` | `Rybar123` |

## Štruktúra

```
src/
  index.ts                 bootstrap (helmet, session, locals, error handlers)
  config/                  db pool, multer, session store
  data/seed.ts             demo dáta
  middlewares/             auth, admin, owner-or-admin, locals, error handler
  models/                  Active-Record (User, Address, Spot, Catch, WaterType)
  services/                biznis logika
  controllers/             HTTP handlery
  routes/                  public, spot, catch, admin
  validators/              Zod schémy (auth, spot, catch, user)
  views/                   EJS šablóny (layout, home, auth, spots, catches, admin, errors)
public/
  css/                     tokens, base, components, pages
  js/                      theme, modal, favorites, catches, leaflet-init
  images/                  ui/, uploads/
```

## Funkcionality

- Registrácia + prihlásenie (sessions v MySQL, hash hesla cez `crypto` scrypt, Zod refine pre silu)
- Repopulácia formulárov cez session pri chybe
- CRUD revírov, autorské obmedzenia (creator alebo admin)
- File upload (multer) — fotka revíru aj fotka úlovku
- AJAX kniha úlovkov (axios, GET/POST/PATCH/DELETE)
- AJAX obľúbené revíry
- Admin panel (správa používateľov, štatistiky)
- Dark / light téma (CSS premenné, persistované v `localStorage` aj session)
- OSM mapa s pinom (Leaflet)
- 404 / 500 / 401 / 403 chybové stránky
- Helmet CSP, rate-limit na auth, parametrizované SQL všade
- Filtrovanie revírov podľa typu vody a kraja (query parametre)
- Osobný „Môj denník" — moje revíry + úlovky + obľúbené

## Vizuálny smer

„**Tichá voda**" — editoriálny rybársky almanach.
- Typografia: **Fraunces** (display) × **Newsreader** (body) × **JetBrains Mono** (popisky)
- Paleta: pergamen `#F2EBDC`, atrament `#1A1F1B`, loden `#2C3E2D`, voda `#5C7882`, mosadz `#B5853F`
- Atmosféra: papierový grain, akvarelové vlny, drop caps, asymetrický grid kariet, letterpress tlačidlá

## Bezpečnosť

- `helmet` s vlastnou CSP (povolené iba: self + jsdelivr/unpkg pre axios/leaflet, Google Fonts, OSM dlaždice)
- `express-rate-limit` na `/registracia` a `/prihlasenie` (20 / 15 min)
- Všetky SQL dotazy parametrizované (`?` placeholders, žiadne string-konkatenácie)
- Heslá hashované cez vstavaný `crypto.scrypt` so soľou a `timingSafeEqual` pri verifikácii
- EJS auto-escape všade kde je `<%= %>`; `<%- %>` použité len pre statické partials
- SameSite=Lax cookies, httpOnly
