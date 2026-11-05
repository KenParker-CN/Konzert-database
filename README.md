# Konzert Database

A multilingual classical music catalogue for browsing composers and their works.

Supported locales: English (`/en`), Chinese (`/zh`), French (`/fr`), German (`/de`). Unlocalized paths redirect to `/en`.

## Quick start

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run start`.

## Data

- Composer and work data lives in CSV files under `data/catalogues/`. They are cached in memory for five minutes per server instance.
- The source CSVs are maintained in [konzert-public-data](https://github.com/KenParker-CN/konzert-public-data) and copied here when refreshed.
- Mozart's KV catalogue is read from the local `data/catalogues/KV.csv`. It no longer uses the Mozarteum API.

## Maintenance scripts

```bash
node scripts/find-unused-i18n-keys.mjs   # report unused keys in messages/*.json
node scripts/prune-unused-i18n-keys.mjs  # remove them (--write to apply)
node scripts/flatten-kv-raw.mjs          # rebuild KV-works.csv from KV-raw.json
```

## Project layout

```text
app/                 Next.js App Router pages, including app/[locale]/
components/          Shared UI and catalogue, composer, genre components
lib/                 Data loading, database accessors, and i18n
messages/            Translations (en, zh, fr, de)
data/catalogues/     Catalogue CSVs
data/meta/           Composer, genre and instrument CSVs
public/              Static files
scripts/             Data and i18n maintenance scripts
proxy.ts             Locale redirects
```

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, npm.
