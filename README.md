# Konzert Database

A multilingual classical music catalogue for browsing composers, catalogue numbers, works, instruments and genres.

Supported locales: English (`/en`), Chinese (`/zh`), French (`/fr`), German (`/de`). Unlocalized paths redirect to `/en`.

## Quick start

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run start`. `predev` and `prebuild` run `scripts/generate-catalogue-updates.mjs` automatically.

## Data

- Catalogue and work data lives in `data/catalogues/`. Mozart's KV catalogue is read from `data/catalogues/KV.csv`.
- Composer, genre and instrument metadata lives in `data/meta/` (`composers.csv`, `genres.csv`, `instruments.csv`).
- Data is cached in memory for five minutes per server instance.
- The source CSVs are maintained in [konzert-public-data](https://github.com/KenParker-CN/konzert-public-data) and copied here when refreshed.

## Search

The global search and `/[locale]/search` page cover four result types: catalogues, works, instruments and genres. The search index is built in memory from the CSV data and served by `/api/search?q=...&locale=...`.

## Maintenance scripts

```bash
node scripts/find-unused-i18n-keys.mjs   # report unused keys in messages/*.json
node scripts/prune-unused-i18n-keys.mjs  # remove them (--write to apply)
```

## Project layout

```text
app/                 Next.js App Router pages, including app/[locale]/
components/          Shared UI and catalogue, composer, genre components
lib/                 Data loading, database accessors, search, and i18n
messages/            UI translations (en, zh, fr, de)
data/catalogues/     Catalogue CSVs
data/meta/           Composer, genre and instrument CSVs
public/              Static files
scripts/             Data and i18n maintenance scripts
proxy.ts             Locale redirects
```

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, npm.
