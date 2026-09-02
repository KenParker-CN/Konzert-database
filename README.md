# Parker Home

A personal classical music archive — composers, work catalogues, recordings, and listening links — built with [VitePress](https://vitepress.dev/) and Vue.

## Features

- **Composer profiles** — 23 composers across six eras, with linked catalogue entries, discography links, and live Wikipedia introductions.
- **Work catalogues** — interactive tables for RV (Vivaldi), TWV (Telemann), HWV (Handel), KV (Mozart), and BWV (Bach). Search, multi-select filtering (Type / Key / Instrumentation), sorting, and pagination.
- **Album collections** — a cover gallery with detail modals, performer/composer links, and embedded streaming players (Spotify, Apple Music, TIDAL).
- **MusicBrainz tool** — search MusicBrainz releases and export them as the `albums.csv` data source.
- **AI assistant** — a simple chat interface backed by an OpenAI serverless function.
- **Admin area** — a lightweight (front-end only) authenticated `/admin` section with a login page.

## Tech Stack

- [VitePress](https://vitepress.dev/) 2.0 (alpha) — static site generation
- [Vue](https://vuejs.org/) 3 — components with `<script setup lang="ts">`
- TypeScript — data layer and component logic
- [OpenAI](https://www.npmjs.com/package/openai) — serverless chat API
- [Vercel](https://vercel.com/) — deployment (static output + serverless functions)

## Project Structure

```text
parker-home/
├── .vitepress/
│   ├── config.mts            # Site config (nav / sidebar generated from data)
│   └── theme/
│       ├── auth.ts           # Admin front-end auth (sessionStorage)
│       ├── style.css         # Design system (archive theme variables)
│       ├── Layout.vue        # Custom layout (site footer)
│       ├── index.ts          # Global component registration
│       ├── data/             # TypeScript data layer
│       │   ├── composers.ts  # Composer records + helpers
│       │   ├── catalogues.ts # Catalogue definitions + CSV loading/filtering
│       │   └── albums.ts     # Album types + name matching + streaming URLs
│       └── components/
│           ├── admin/        # AdminPanel, LoginPage
│           ├── album/        # AlbumCard, AlbumList, AlbumModal, StreamingPlayer
│           ├── catalogue/    # Catalogues, CatalogueTable, CatalogueFilters, ComposerCatalogues
│           ├── composer/     # ComposerList, ComposerProfile
│           ├── common/       # AIChat, WikipediaIntro
│           └── musicbrainz/  # mbSearch
├── pages/                    # Markdown pages (composers, composers/*, albums, ai)
├── admin.md                  # /admin (protected)
├── admin/login.md            # /admin/login
├── catalogues.md             # /catalogues — work catalogue browser
├── index.md                  # / — homepage
├── docs/                     # Misc docs & locales (de, en, fr)
├── public/data/              # CSV data (albums, rv, twv, hwv, kv, bwv, instrumentations)
├── api/chat.ts               # Vercel serverless function (OpenAI chat)
├── vercel.json               # Vercel build/output config
└── package.json
```

## Data

CSV files in `public/data/` are served as static assets and loaded at runtime:

| File | Contents |
| --- | --- |
| `albums.csv` | Album collection (id, musicbrainz id, title, composers, artists, label, year, streaming links, …) |
| `rv.csv` / `twv.csv` / `hwv.csv` / `kv.csv` / `bwv.csv` | Work catalogues (Vivaldi / Telemann / Handel / Mozart / Bach) |
| `instrumentations.csv` | Instrument reference (name, category, aliases) |

Composer and catalogue metadata lives in `.vitepress/theme/data/` as TypeScript. Note that `bwv.csv` is currently an empty placeholder.

## Development

> On Windows PowerShell, use `npm.cmd` instead of `npm` if the `.ps1` wrapper is blocked by the execution policy.

```bash
npm install
npm run docs:dev        # start the dev server
npm run docs:build      # build the static site
npm run docs:preview    # preview the production build
```

## Deployment

Deployed on Vercel (`vercel.json`): build via `npm run docs:build`, output `.vitepress/dist`. The `api/` directory is deployed as serverless functions (requires `OPENAI_API_KEY` in the environment for the AI chat). A GitHub Actions workflow also runs the build on every push/PR to `master`.

## Admin Authentication

The `/admin` area uses a **front-end-only** auth guard (session state kept in `sessionStorage`). This is not real security — the static pages remain directly fetchable.

Credentials are configured in `.vitepress/theme/auth.ts`:

```ts
export const ADMIN_ACCOUNT: AdminAccount = {
  username: 'admin',
  email: '',          // optional; when set, either matches
  password: 'admin123'
}
```

## License

Personal project.
