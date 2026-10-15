# Konzert Database

A multilingual classical music catalogue for browsing composers and their
works. Locale is derived from the URL prefix (`/en`, `/zh`, `/fr`, `/de`,
`/ja`); `proxy.ts` redirects unlocalized paths to the default locale.

## Data

Composer and work data is fetched from CSV files in the
[konzert-public-data](https://github.com/KenParker-CN/konzert-public-data)
repository. The server loads `composers.csv` and composer-specific catalogue
files from GitHub's raw content endpoint (with a pinned jsDelivr CDN
revision as fallback), caching responses in memory for up to five minutes
per server instance.

Mozart's KV catalogue is read from the vendored snapshot in
`public/kv-entries.json`, which holds the
[Digital Mozart Edition](https://dme.mozarteum.at/digital-editions/api/kv-entriesidx)
index. The endpoint serves a ~6 MB payload that takes around ten seconds to
download, so it is only consulted if the snapshot is missing; `KV.csv` from
the public-data repository is the final fallback. Refresh the snapshot with:

```sh
node scripts/fetch-kv-entries.mjs
```

Supported catalogues: BWV (Bach), KV (Mozart), Hob (Haydn), HWV (Handel),
RV (Vivaldi), TWV (Telemann), CPE (C. P. E. Bach), Marnat (Ravel), LWV
(Lully), Corelli, BuxWV (Buxtehude), Deutsch (Schubert), Gerard (Boccherini),
RCT (Rameau), MWV (Mendelssohn), GMW (Mahler), Shostakovich, and
Tchaikovsky. Works within a catalogue are grouped into hierarchical
categories (for example MWV by catalogue letter and TWV by catalogue
number) by `lib/data/work-groups.ts`.

## Stack

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4
- npm

## Development

```bash
npm install
npm run dev
```

Other available scripts:

```bash
npm run build
npm run start
```

## Maintenance scripts

```bash
node scripts/fetch-kv-entries.mjs        # refresh public/kv-entries.json
node scripts/find-unused-i18n-keys.mjs   # report unused keys in messages/*.json
node scripts/prune-unused-i18n-keys.mjs  # remove them (--write to apply)
node scripts/flatten-kv-raw.mjs          # rebuild KV-works.csv from KV-raw.json
```

## Project layout

```text
app/
  [locale]/
    catalogues/           Catalogue directory and detail pages
  actions.ts              Server action to refresh the data cache
  globals.css
components/
  AppShell.tsx            Shared page shell (nav, theme, language)
  catalogues/             Catalogue list and works display
  common/                 Panels and loading states
  ui/                     Shared primitives (button, input, toast)
lib/
  composer-name.ts        Localized composer names and flag codes
  data/                   CSV loading, catalogue mapping, work grouping
  db/composers.ts         Composer directory and catalogue-work accessors
  i18n/                   Locale configuration and dictionaries
messages/                 English, Chinese, French, German, and Japanese text
public/kv-entries.json    Vendored Mozart KV index snapshot
scripts/                  Data and i18n maintenance scripts
proxy.ts                  Locale redirects (Next.js 16 middleware replacement)
```
