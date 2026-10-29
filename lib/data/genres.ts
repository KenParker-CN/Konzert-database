export type GenreCategoryId = 'vocal' | 'instrumental' | 'stage'

export type GenreEntry = {
    slug: string
    term: string
    /** Wikidata entity ID (QID), used to load the localized Wikipedia introduction. */
    wikiID?: string
}

export type GenreNavNode = {
    id: string
    labelKey?: string
    genre?: GenreEntry
    children?: readonly GenreNavNode[]
}

// A tree root is always one of the three top-level categories.
export type GenreCategoryNode = GenreNavNode & {
    id: GenreCategoryId
    genres: readonly GenreEntry[]
}

export type GenreCategory = GenreCategoryNode

const genreCategoryTree: readonly GenreCategoryNode[] = [
    {
        id: 'stage',
        labelKey: 'genrePages.groups.stageWorks',
        genres: [],
        children: [
            {
                id: 'opera',
                genre: {slug: 'opera', term: 'Opera', wikiID: 'Q1344'},
                children: [
                    {id: 'opera-seria', genre: {slug: 'opera-seria', term: 'Opera seria', wikiID: 'Q210675'},},
                    {id: 'opera-buffa', genre: {slug: 'opera-buffa', term: 'Opera buffa', wikiID: 'Q208080'},},
                    {id: 'singspiel', genre: {slug: 'singspiel', term: 'Singspiel', wikiID: 'Q377258'}},
                    {id: 'opera-ballet', genre: {slug: 'opera-ballet', term: 'Opéra-ballet', wikiID: 'Q1084127'}},
                    {
                        id: 'tragedie-en-musique',
                        genre: {slug: 'tragedie-en-musique', term: 'Tragédie en musique', wikiID: 'Q908705'}
                    },
                    {id: 'operetta', genre: {slug: 'operetta', term: 'Operetta', wikiID: 'Q170384'},},
                ],
            },

            {id: 'pasticcio', genre: {slug: 'pasticcio', term: 'Pasticcio', wikiID: 'Q674448'},},
            {id: 'ballet', genre: {slug: 'ballet', term: 'Ballet', wikiID: 'Q4851628'},},
            {id: 'incidental-music', genre: {slug: 'incidental-music', term: 'Incidental Music', wikiID: 'Q1147752'},},
            {id: 'film-music', genre: {slug: 'film-music', term: 'Film Music', wikiID: 'Q492264'},},
        ],
    },
    {
        id: 'vocal',
        labelKey: 'genrePages.vocal',
        genres: [],
        children: [
            {id: 'cantata', genre: {slug: 'cantata', term: 'Cantata', wikiID: 'Q174873'},},
            {id: 'oratorio', genre: {slug: 'oratorio', term: 'Oratorio', wikiID: 'Q85477'},},
            {
                id: 'mass',
                genre: {slug: 'mass', term: 'Mass', wikiID: 'Q217295'},
                children: [
                    {id: 'requiem', genre: {slug: 'requiem', term: 'Requiem', wikiID: 'Q51616'}},
                ],
            },
            {id: 'serenata', genre: {slug: 'serenata', term: 'Serenata', wikiID: 'Q18071186'}},
            {id: 'motet', genre: {slug: 'motet', term: 'Motet', wikiID: 'Q188285'}},
            {id: 'Psalm', genre: {slug: 'Psalm', term: 'Psalm', wikiID: 'Q12497663'}},
            {id: 'Hymn', genre: {slug: 'Hymn', term: 'Hymn', wikiID: 'Q484692'}},
            {id: 'Antiphon', genre: {slug: 'Antiphon', term: 'Antiphon', wikiID: 'Q582093'}},
            {id: 'Anthem', genre: {slug: 'Anthem', term: 'Anthem', wikiID: 'Q541947'}},
            {id: 'Litany', genre: {slug: 'Litany', term: 'Litany', wikiID: 'Q240709'}},
            {id: 'Magnificat', genre: {slug: 'Magnificat', term: 'Magnificat', wikiID: 'Q200809'}},
            {id: 'Stabat Mater', genre: {slug: 'Stabat Mater', term: 'Stabat Mater', wikiID: 'Q210080'}},
            {id: 'Offertory', genre: {slug: 'Offertory', term: 'Offertory', wikiID: 'Q21653515'}},
            {id: 'Sequence', genre: {slug: 'Sequence', term: 'Sequence', wikiID: 'Q1147354'}},
            {id: 'Vespers', genre: {slug: 'Vespers', term: 'Vespers', wikiID: 'Q827135'}},
            {id: 'Song', genre: {slug: 'Song', term: 'Song', wikiID: 'Q7366'}},
            {id: 'Lied', genre: {slug: 'Lied', term: 'Lied', wikiID: 'Q216860'}},
            {id: 'Mélodie', genre: {slug: 'Mélodie', term: 'Mélodie', wikiID: 'Q2737175'}},
            {id: 'Song-cycle', genre: {slug: 'Song-cycle', term: 'Song-cycle', wikiID: 'Q893466'}},
        ],
    },
    {
        id: 'instrumental',
        labelKey: 'genrePages.instrumental',
        genres: [],
        children: [
            {id: 'symphony', genre: {slug: 'symphony', term: 'Symphony', wikiID: 'Q9734',}},
            {id: 'sinfonia', genre: {slug: 'sinfonia', term: 'Sinfonia', wikiID: 'Q377141',}},
            {id: 'sinfonietta', genre: {slug: 'sinfonietta', term: 'Sinfonietta', wikiID: 'Q15077165',}},
            {
                id: 'concerto', genre: {slug: 'concerto', term: 'Concerto', wikiID: 'Q9748',},
                children: [
                    {id: 'concerto grosso', genre: {slug: 'concerto grosso', term: 'Concerto grosso', wikiID: 'Q210216',}},
                    {id: 'concertino', genre: {slug: 'concertino', term: 'Concertino', wikiID: 'Q779024',}},
                    {id: 'Sinfonia concertante', genre: {slug: 'Sinfonia concertante', term: 'Sinfonia concertante', wikiID: 'Q1136846',}},
                ],
            },
            {
                id: 'sonata', genre: {slug: 'sonata', term: 'Sonata', wikiID: 'Q131269',},
                children: [
                    {id: 'sonatina', genre: {slug: 'sonatina', term: 'Sonatina', wikiID: 'Q1045984',}},
                ],
            },
            {
                id: 'suite', genre: {slug: 'suite', term: 'Suite', wikiID: 'Q203005',},
                children: [
                    {id: 'overture-suite', genre: {slug: 'overture-suite', term: 'Overture-Suite', wikiID: '',}},
                ],
            },
            {
                id: 'Variations', genre: {slug: 'Variations', term: 'Variations', wikiID: 'Q214981',},
                children: [
                    {id: 'Keyboard Variations', genre: {slug: 'Keyboard Variations', term: 'Keyboard Variations', wikiID: '',}},
                ],
            },
            {id: 'Fugue', genre: {slug: 'Fugue', term: 'Fugue', wikiID: 'Q181014',}},
            {id: 'Divertimento', genre: {slug: 'Divertimento', term: 'Divertimento', wikiID: 'Q647653',}},
            {id: 'Serenade', genre: {slug: 'Serenade', term: 'Serenade', wikiID: 'Q215911',}},
            {id: 'Solo', genre: {slug: 'Solo', term: 'Solo', wikiID: 'Q270827',}},
            {
                id: 'Ensemble', genre: {slug: 'Ensemble', term: 'Ensemble', wikiID: 'Q2088357',},
                children: [
                    {id: 'Duet', genre: {slug: 'Duet', term: 'Duet', wikiID: 'Q109940',}},
                    {id: 'Quartet', genre: {slug: 'Quartet', term: 'Quartet', wikiID: 'Q1135557',}},
                    {id: 'Quintet', genre: {slug: 'Quintet', term: 'Quintet', wikiID: 'Q389888',}},
                    {id: 'Sextet', genre: {slug: 'Sextet', term: 'Sextet', wikiID: 'Q1944586',}},
                    {id: 'Septet', genre: {slug: 'Septet', term: 'Septet', wikiID: 'Q547833',}},
                    {id: 'Octet', genre: {slug: 'Octet', term: 'Octet', wikiID: 'Q373712',}},
                ],
            },
        ],
    },
]

function flattenGenres(nodes: readonly GenreNavNode[]): GenreEntry[] {
    return nodes.flatMap(node => [
        ...(node.genre ? [node.genre] : []),
        ...flattenGenres(node.children ?? []),
    ])
}

export const genreCategories: readonly GenreCategory[] = genreCategoryTree.map(category => ({
    ...category,
    genres: flattenGenres(category.children ?? []),
}))

export const genres: readonly GenreEntry[] = Array.from(
    new Map(genreCategories.flatMap(category => category.genres).map(genre => [genre.slug, genre])).values(),
)

export function getGenreBySlug(slug: string): GenreEntry | undefined {
    let decodedSlug = slug
    try {
        decodedSlug = decodeURIComponent(slug)
    } catch {
        // Keep the original slug if it contains malformed percent encoding.
    }
    const normalizedSlug = decodedSlug.normalize('NFC')
    return genres.find(genre => genre.slug.normalize('NFC') === normalizedSlug)
}

export function getGenreTermsBySlug(slug: string): string[] {
    const normalizedSlug = slug.normalize('NFC')
    function findNode(nodes: readonly GenreNavNode[]): GenreNavNode | undefined {
        for (const node of nodes) {
            if (node.genre?.slug.normalize('NFC') === normalizedSlug) return node
            const childMatch = findNode(node.children ?? [])
            if (childMatch) return childMatch
        }
        return undefined
    }

    const node = findNode(genreCategories)
    return node ? flattenGenres([node]).map(genre => genre.term) : []
}
