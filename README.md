# Classical Music Database

A modern classical music database for exploring works, composers, artists, and recordings.

The project is designed as a structured music database rather than a traditional classical music archive. Its interface follows a modern Google-product-inspired design language with Google Sans, Material 3-inspired surfaces, responsive layouts, and lightweight interaction.

## Overview

This project is a personal classical music database and catalogue application.

It provides structured browsing and discovery for:

- Works
- Composers
- Artists
- Recordings

The application combines a relational SQLite database with a modern Next.js frontend.

The long-term goal is to build a flexible music database capable of connecting works, catalogue numbers, composers, artists, recordings, performances, tracklists, and related metadata.

The project is currently focused on establishing the application architecture, database relationships, and frontend experience before introducing more advanced editing and administration functionality.

## Features

### Works

The Works section provides a unified catalogue of musical works.

Features include:

- Work search
- Catalogue filtering
- Type filtering
- Key filtering
- Instrumentation filtering
- Structured work table
- Sticky first column
- Responsive table layout
- Composer relationships
- Catalogue numbers
- Work metadata

Works are treated as database entities rather than being separated into independent catalogue pages.

Catalogue numbers such as:

- RV
- BWV
- KV
- TWV
- HWV

can coexist within the same Works database.

### Composers

The Composers section provides a directory of composers.

Features include:

- Composer search
- Responsive composer grid
- Compact composer cards
- Placeholder avatars
- Composer names
- Short introductions
- Composer detail pages
- Composer work relationships
- Previous / next composer navigation
- Wikipedia introduction placeholder

Composer cards are designed as people-directory entries rather than simply representing collections of works.

### Artists

Artists are treated as independent database entities.

The Artists section provides:

- Artist search
- Responsive artist grid
- Compact artist cards
- Placeholder avatars
- Artist names
- Short introductions
- Artist detail pages
- Artist-related database relationships

An Artist is not limited to being a composer.

The database can therefore represent relationships between artists and other entities such as works, recordings, performances, and other musical activities.

### Recordings

The Recordings section provides a modern music-recording directory.

The current interface includes:

- Recording search
- Filtering
- Sorting
- Pagination
- Recording artwork
- Recording information
- Catalogue number display
- Tracklist area
- Streaming links where available
- Recording detail dialog

The user-facing concept is called **Recordings**, while some underlying code and data structures may still use the historical `Album` terminology.

This distinction is intentional and allows the database model to evolve without unnecessarily breaking the application structure.

## Technology Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

### Database

- SQLite
- better-sqlite3

### Icons

- lucide-react

### Deployment

- Vercel

### Development

- Node.js
- npm
- Turbopack

## Architecture

The application uses the Next.js App Router.

The high-level architecture is:

    Browser
       │
       ▼
    Next.js App Router
       │
       ├── Server Components
       │
       ├── Client Components
       │
       └── Server-side Data Layer
                 │
                 ▼
           SQLite Database
           identifier.sqlite

The browser never accesses the SQLite database directly.

Database queries are executed on the server through the data-access layer under:

    lib/db/

## Project Structure

The main application structure is:

    .
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css
    │   │
    │   ├── page.tsx
    │   │
    │   ├── works/
    │   │   └── page.tsx
    │   │
    │   ├── composers/
    │   │   ├── page.tsx
    │   │   └── [slug]/
    │   │       └── page.tsx
    │   │
    │   ├── artists/
    │   │   ├── page.tsx
    │   │   └── [slug]/
    │   │       └── page.tsx
    │   │
    │   └── albums/
    │       └── page.tsx
    │
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── TopBar.tsx
    │   │
    │   ├── common/
    │   │   ├── PageHeader.tsx
    │   │   └── SearchInput.tsx
    │   │
    │   ├── composer/
    │   │   ├── ComposerCard.tsx
    │   │   ├── ComposerGrid.tsx
    │   │   └── ComposerNav.tsx
    │   │
    │   ├── catalogue/
    │   │   ├── CatalogueFilters.tsx
    │   │   └── CatalogueTable.tsx
    │   │
    │   └── album/
    │       ├── AlbumCard.tsx
    │       ├── AlbumGrid.tsx
    │       └── AlbumDialog.tsx
    │
    ├── lib/
    │   ├── db/
    │   │   ├── sqlite.ts
    │   │   ├── works.ts
    │   │   ├── composers.ts
    │   │   ├── artists.ts
    │   │   └── albums.ts
    │   │
    │   └── ...
    │
    ├── identifier.sqlite
    ├── public/
    ├── next.config.ts
    ├── postcss.config.mjs
    ├── tsconfig.json
    ├── package.json
    └── README.md

The exact component structure may evolve as the application develops.

## Database

The project currently uses SQLite as its primary relational database.

The database file is:

    identifier.sqlite

The database contains entities and relationships including:

- Artists
- Works
- Work composers
- Recordings
- Recording works
- Recording performers
- Tracklists
- Tracklist entries

The database is designed around relationships rather than storing all information directly inside individual pages.

## Core Relationships

A simplified representation of the current data model is:

    Artist
       │
       │
       └── Work Composer Relationship
                  │
                  ▼
                Work
                  │
                  │
                  └── Catalogue information


    Recording
       │
       ├── Tracklist
       │      └── Tracklist Entries
       │
       ├── Works
       │
       └── Performers

For example, a composer can be connected to multiple works through:

    artists
       │
       ▼
    work_composers
       │
       ▼
    works

This allows the frontend to retrieve composer information and related works without duplicating data.

## Server-side Database Access

SQLite access is intentionally restricted to the server.

Database modules are marked as server-only where appropriate.

A typical data flow is:

    React Page
        │
        ▼
    Next.js Server Component
        │
        ▼
    lib/db/*.ts
        │
        ▼
    better-sqlite3
        │
        ▼
    identifier.sqlite

The client browser should never import or access:

    better-sqlite3

or:

    identifier.sqlite

directly.

## SQLite and Deployment

SQLite is currently used primarily as a read-oriented database for the deployed application.

This works well for the current stage because the database is relatively small and the application primarily needs to read structured music metadata.

However, the application should not rely on runtime writes to a local SQLite file on Vercel as a permanent persistence mechanism.

Vercel serverless environments do not provide the same persistent writable filesystem model as a traditional server.

Therefore, the current architecture is:

    SQLite
       ↓
    Server-side reads
       ↓
    Next.js
       ↓
    Frontend

If the application later requires reliable online editing, persistent user-generated data, or concurrent writes, the database can be migrated to a hosted relational database such as PostgreSQL.

The application is structured so that the database access layer can be changed independently from most of the UI.

## Data Integrity

The frontend should never invent database content simply to make a page look complete.

In particular, the application should not create fake:

- Works
- Artists
- Composers
- Recordings
- Tracklists
- Biographies
- Dates
- Streaming URLs
- Wikipedia content

When data is unavailable, the interface should use an appropriate empty state or placeholder.

This is especially important for music metadata, where apparently harmless invented values can become extremely difficult to distinguish from actual catalogue information later.

## Works and Catalogue Numbers

Catalogue numbers are treated as metadata associated with works or catalogue entries.

Examples include:

    KV 216
    RV ...
    BWV ...
    TWV ...
    HWV ...

A catalogue number is not necessarily the same thing as a work's internal database identifier.

The internal database identifier is used for relationships and application logic, while catalogue numbers are displayed as musical metadata.

This distinction allows multiple cataloguing systems to coexist without treating catalogue numbers as database primary keys.

## Composers and Artists

The project distinguishes between:

    Composer

and:

    Artist

A composer is represented through the existing artist/entity relationship rather than requiring a completely separate person database.

This allows an artist to participate in multiple musical roles and relationships.

For example:

    Artist
     ├── Composer
     ├── Performer
     ├── Conductor
     └── Other musical relationships

The UI therefore treats Composer and Artist pages as directories of people/entities rather than simply extensions of the Works page.

## Wikipedia Integration

Composer and Artist detail pages currently include a lightweight Wikipedia introduction section.

The current implementation is a UI placeholder.

It is intentionally not connected to the Wikipedia API yet.

The intended future structure is:

    Person information
            │
            ▼
    Wikipedia Short Intro
            │
            └── External Wikipedia link

The project should not fabricate Wikipedia content when the integration is unavailable.

A future implementation may retrieve short introductions from an appropriate external source while keeping the external data clearly separated from the core database.

## Theme System

The application uses a shared theme system rather than independent page-level themes.

Supported appearance modes include:

- Light
- Dark
- System

Theme state is managed at the application level so that navigation between routes does not reset the selected theme.

The visual system uses Material-3-inspired semantic concepts such as:

- Surface
- Surface containers
- Primary
- Secondary
- Outline
- On-surface
- On-primary

The goal is not to reproduce Material Design mechanically, but to use its principles to create a consistent interface.

## Design Direction

The visual direction is:

**Modern Google Product + Material 3 + Google Sans**

The website should feel like a modern database, directory, or SaaS-style product.

Important characteristics include:

- Clean layouts
- High information density
- Friendly interaction
- Responsive design
- Soft rounded corners
- Clear hierarchy
- Controlled color usage
- Lightweight elevation
- Clear hover states
- Clear focus states
- Responsive navigation
- Subtle animation

Classical music is the content of the database.

It is not intended to dictate a visual style based on:

- Museum
- Archive
- Editorial
- Antique
- Classical ornamentation

The interface should therefore remain modern even when presenting historical musical content.

## Typography

The primary visual typeface is:

    Google Sans

Typography should remain consistent across:

- Navigation
- Page headers
- Cards
- Tables
- Dialogs
- Buttons
- Metadata
- Detail pages

Fallback fonts may be provided for environments where Google Sans is unavailable.

## Responsive Design

The application is designed for:

- Desktop
- Tablet
- Mobile

### Desktop

The application uses a persistent sidebar and spacious content area.

Typical structure:

    ┌────────────┬─────────────────────────────┐
    │            │ Header                      │
    │ Sidebar    ├─────────────────────────────┤
    │            │                             │
    │            │ Main Content                │
    │            │                             │
    └────────────┴─────────────────────────────┘

### Mobile

The sidebar becomes a navigation drawer.

The interface should provide:

- Hamburger navigation
- Theme controls
- Responsive grids
- Stacked toolbars
- Mobile-friendly dialogs
- No unnecessary horizontal overflow

## Navigation

The primary navigation currently includes:

- Home
- Works
- Composers
- Artists
- Recordings

The application uses a shared `AppShell` to keep navigation behavior consistent across pages.

Navigation state should not be duplicated between individual pages.

## Development

### Requirements

Install:

- Node.js
- npm

Check versions:

    node -v
    npm -v

## Installation

Clone the repository:

    git clone https://github.com/KenParker-CN/parker-home

Enter the project directory:

    cd parker-home

Install dependencies:

    npm install

## Development Server

Start the development server:

    npm run dev

The application will normally be available at:

    http://localhost:3000

Next.js uses Turbopack during development.

Changes to React components, CSS, and application code are automatically reflected during development.

## Production Build

Before deployment, run:

    npm run build

A successful build confirms that the Next.js application can be compiled for production.

## Production Server

After building:

    npm run start

This starts the Next.js production server.

## Environment Variables

Environment-specific values should be stored in:

    .env.local

Do not commit secrets or credentials to the repository.

## Authentication

The project contains an application-level authentication system for administrative functionality.

The current authentication implementation is intentionally lightweight and is not intended to be treated as production-grade security.

Authentication should not be considered equivalent to a secure backend identity system.

Future improvements may include:

- Server-side sessions
- Secure password storage
- Role-based access control
- Database-backed users
- Secure authentication providers

## Current Development Status

The current application has completed the initial migration from the legacy VitePress/Vue application to Next.js.

### Completed

- Next.js App Router
- React frontend
- TypeScript
- Tailwind CSS
- Shared AppShell
- Responsive navigation
- Theme system
- Works page
- Composer directory
- Composer detail page
- Artist directory
- Artist detail page
- Recordings page
- Server-side SQLite data access
- Works / composer relationships
- Search and filtering
- Recording sorting
- Responsive layouts
- Lucide icon system

### In Progress

- More complete Recording / Track relationships
- Expanded music metadata
- Wikipedia integration
- Additional database relationships
- Administration and editing workflows
- Further responsive and accessibility refinement

## Migration History

The project originally used:

    VitePress
    Vue
    TypeScript
    CSV-based catalogue data

The application has since migrated toward:

    Next.js
    React
    TypeScript
    SQLite
    Server-side data access

The migration was motivated by the need for:

- Better application routing
- Server-side database access
- Structured relational data
- More flexible components
- Better support for future CRUD functionality
- A more scalable application architecture
- A modern product-oriented UI

The legacy VitePress implementation may remain in the repository during the transition period, but Next.js is the primary application architecture.

## Design Principles

### 1. Data before decoration

The interface should represent real database entities and relationships.

Visual design should not require invented data.

### 2. Reusable components

Shared interface patterns should be implemented once and reused across pages.

Examples include:

- AppShell
- PageHeader
- Search
- Cards
- Pagination
- Theme controls

### 3. One source of truth

Global state such as theme and navigation should not be duplicated across individual pages.

### 4. Server-side database access

Database access belongs on the server.

The browser should communicate with the Next.js application rather than accessing SQLite directly.

### 5. Responsive by default

Desktop and mobile should be considered simultaneously when designing new components.

### 6. Lightweight interaction

Animation should communicate interaction and state.

It should not demand attention from the user.

### 7. Modern visual language

The application should feel like a contemporary software product rather than a digital museum.

## Future Direction

Potential future development includes:

### Database

- More complete recording metadata
- Performers
- Conductors
- Ensembles
- Labels
- Track-level work relationships
- Recording-level relationships
- Additional catalogue systems
- More complete instrumentation data

### Administration

- Work editing
- Composer / artist editing
- Recording editing
- Tracklist editing
- Relationship management
- Import tools
- Validation tools

### External Data

Potential integrations may include:

- Wikipedia
- MusicBrainz
- Other structured music metadata sources

External metadata should remain distinguishable from the project's canonical database records.

### Database Migration

If the application eventually requires reliable persistent online writes, the SQLite data layer may be migrated to PostgreSQL or another hosted relational database.

## Philosophy

This project is intended to become more than a collection of pages displaying classical music metadata.

The long-term goal is a structured, relational music database where:

    People
       │
       ├── Works
       │
       ├── Recordings
       │
       ├── Performances
       │
       └── Other relationships

can be explored through a modern, responsive interface.

The database should remain flexible enough to represent the complexity of classical music without forcing that complexity onto the user interface.

## License

License information will be added as the project's distribution requirements are finalized.
