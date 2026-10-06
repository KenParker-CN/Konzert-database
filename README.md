# Konzert Database

A multilingual classical music catalogue for browsing composers and their works.

## Data

Composer and work data is fetched from CSV files in the
[konzert-public-data](https://github.com/KenParker-CN/konzert-public-data)
repository. The server loads `composers.csv` and composer-specific catalogue
files from GitHub's raw content endpoint, caching responses for one hour.
There is no local SQLite database, database CRUD interface, or administrator
authentication.

Catalogue files currently supported: BWV, KV, Hob, HWV, RV, TWV, CPE, and
Marnat.

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

## Project layout

```text
app/
  [locale]/
    composers/          Composer directory and detail pages
  globals.css
components/             Shared UI and layout components
lib/
  data/                 GitHub CSV loading and catalogue mapping
  db/composers.ts       Composer and composer-work accessors (CSV-backed)
  i18n/                 Locale configuration and dictionaries
messages/               English, Chinese, French, German, and Japanese text
proxy.ts                Locale redirects
```
