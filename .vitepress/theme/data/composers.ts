export type ComposerPeriod = 'Early' | 'Middle' | 'Late'

export interface Composer {
  name: string
  born: number
  died: number
  era: string
  period: ComposerPeriod
  nationality: string
  intro: string
  slug?: string
  color: string
}

export const eras = ['Medieval', 'Renaissance', 'Baroque', 'Classical', 'Romantic', 'Modern']

export const composers: Composer[] = [
  {
    name: 'Guillaume de Machaut',
    born: 1300,
    died: 1377,
    era: 'Medieval',
    period: 'Late',
    nationality: 'French',
    intro: 'A major French composer and poet of the Ars Nova period.',
    slug: 'machaut',
    color: '#8b5cf6'
  },

  {
    name: 'Guillaume Dufay',
    born: 1397,
    died: 1474,
    era: 'Renaissance',
    period: 'Early',
    nationality: 'Franco-Flemish',
    intro: 'One of the most influential composers of the early Renaissance.',
    slug: 'dufay',
    color: '#6366f1'
  },

  {
    name: 'Josquin des Prez',
    born: 1450,
    died: 1521,
    era: 'Renaissance',
    period: 'Middle',
    nationality: 'Franco-Flemish',
    intro: 'A leading composer of the High Renaissance, renowned for his vocal music.',
    slug: 'josquin',
    color: '#4f46e5'
  },

  {
    name: 'Claudio Monteverdi',
    born: 1567,
    died: 1643,
    era: 'Renaissance',
    period: 'Late',
    nationality: 'Italian',
    intro: 'A pivotal composer in the transition from the Renaissance to the Baroque.',
    slug: 'monteverdi',
    color: '#2563eb'
  },

  {
    name: 'Jean-Baptiste Lully',
    born: 1632,
    died: 1687,
    era: 'Baroque',
    period: 'Early',
    nationality: 'French',
    intro: 'The dominant composer of French court music under Louis XIV.',
    slug: 'lully',
    color: '#0891b2'
  },

  {
    name: 'Marc-Antoine Charpentier',
    born: 1643,
    died: 1704,
    era: 'Baroque',
    period: 'Early',
    nationality: 'French',
    intro: 'A prolific French composer known for sacred music, chamber music and theatrical works.',
    slug: 'charpentier',
    color: '#0d9488'
  },

  {
    name: 'Arcangelo Corelli',
    born: 1653,
    died: 1713,
    era: 'Baroque',
    period: 'Middle',
    nationality: 'Italian',
    intro: 'An influential Italian violinist and composer who shaped the development of the concerto and sonata.',
    slug: 'corelli',
    color: '#059669'
  },

  {
    name: 'Henry Purcell',
    born: 1659,
    died: 1695,
    era: 'Baroque',
    period: 'Early',
    nationality: 'English',
    intro: 'One of England’s most important Baroque composers.',
    slug: 'purcell',
    color: '#16a34a'
  },

  {
    name: 'François Couperin',
    born: 1668,
    died: 1733,
    era: 'Baroque',
    period: 'Middle',
    nationality: 'French',
    intro: 'A leading French composer and keyboardist of the late seventeenth and early eighteenth centuries.',
    slug: 'couperin',
    color: '#65a30d'
  },

  {
    name: 'Antonio Vivaldi',
    born: 1678,
    died: 1741,
    era: 'Baroque',
    period: 'Middle',
    nationality: 'Italian',
    intro: 'An Italian composer and violinist best known for his concertos, operas and sacred music.',
    slug: 'vivaldi',
    color: '#ca8a04'
  },

  {
    name: 'Georg Philipp Telemann',
    born: 1681,
    died: 1767,
    era: 'Baroque',
    period: 'Late',
    nationality: 'German',
    intro: 'One of the most prolific composers of the late Baroque period.',
    slug: 'telemann',
    color: '#d97706'
  },

  {
    name: 'Jean-Philippe Rameau',
    born: 1683,
    died: 1764,
    era: 'Baroque',
    period: 'Late',
    nationality: 'French',
    intro: 'A major French composer and music theorist, particularly known for his operas and keyboard music.',
    slug: 'rameau',
    color: '#ea580c'
  },

  {
    name: 'Johann Sebastian Bach',
    born: 1685,
    died: 1750,
    era: 'Baroque',
    period: 'Late',
    nationality: 'German',
    intro: 'One of the central figures of Western classical music and the late Baroque.',
    slug: 'bach',
    color: '#dc2626'
  },

  {
    name: 'George Frideric Handel',
    born: 1685,
    died: 1759,
    era: 'Baroque',
    period: 'Late',
    nationality: 'German-British',
    intro: 'A German-born composer who became one of the leading figures of English Baroque music.',
    slug: 'handel',
    color: '#e11d48'
  },

  {
    name: 'Christoph Willibald Gluck',
    born: 1714,
    died: 1787,
    era: 'Classical',
    period: 'Early',
    nationality: 'German',
    intro: 'A composer who played an important role in reforming eighteenth-century opera.',
    slug: 'gluck',
    color: '#db2777'
  },

  {
    name: 'Joseph Haydn',
    born: 1732,
    died: 1809,
    era: 'Classical',
    period: 'Middle',
    nationality: 'Austrian',
    intro: 'A central figure of the Classical period and a major developer of the symphony and string quartet.',
    slug: 'haydn',
    color: '#c026d3'
  },

  {
    name: 'Wolfgang Amadeus Mozart',
    born: 1756,
    died: 1791,
    era: 'Classical',
    period: 'Late',
    nationality: 'Austrian',
    intro: 'A prolific and influential composer whose works span opera, symphony, concerto and chamber music.',
    slug: 'mozart',
    color: '#9333ea'
  },

  {
    name: 'Ludwig van Beethoven',
    born: 1770,
    died: 1827,
    era: 'Classical',
    period: 'Late',
    nationality: 'German',
    intro: 'A pivotal composer whose music connects the Classical and Romantic eras.',
    slug: 'beethoven',
    color: '#7c3aed'
  },

  {
    name: 'Franz Schubert',
    born: 1797,
    died: 1828,
    era: 'Romantic',
    period: 'Early',
    nationality: 'Austrian',
    intro: 'A major early Romantic composer celebrated especially for his songs and chamber music.',
    slug: 'schubert',
    color: '#4f46e5'
  },

  {
    name: 'Johannes Brahms',
    born: 1833,
    died: 1897,
    era: 'Romantic',
    period: 'Late',
    nationality: 'German',
    intro: 'A major nineteenth-century composer whose music combines Romantic expression with Classical forms.',
    slug: 'brahms',
    color: '#4338ca'
  },

  {
    name: 'Antonín Dvořák',
    born: 1841,
    died: 1904,
    era: 'Romantic',
    period: 'Late',
    nationality: 'Czech',
    intro: 'A Czech composer known for symphonies, chamber music and works influenced by Czech musical traditions.',
    slug: 'dvorak',
    color: '#3730a3'
  },

  {
    name: 'Claude Debussy',
    born: 1862,
    died: 1918,
    era: 'Modern',
    period: 'Early',
    nationality: 'French',
    intro: 'A French composer whose music helped redefine harmony, timbre and musical form at the turn of the twentieth century.',
    slug: 'debussy',
    color: '#1d4ed8'
  },

  {
    name: 'Igor Stravinsky',
    born: 1882,
    died: 1971,
    era: 'Modern',
    period: 'Middle',
    nationality: 'Russian-French-American',
    intro: 'One of the most influential composers of the twentieth century, known for his constantly evolving musical language.',
    slug: 'stravinsky',
    color: '#0369a1'
  }
]


export function composerBySlug(slug: string): Composer | undefined {
  return composers.find(composer => composer.slug === slug)
}

export function composersByEra(era: string): Composer[] {
  return composers.filter(composer => composer.era === era)
}

export function composerLink(composer: Composer): string {
  return composer.slug ? `/pages/composers/${composer.slug}` : ''
}

/** Wikipedia article title used by the Wikipedia introduction component. */
export function wikipediaPage(composer: Composer): string {
  return composer.name.replace(/ /g, '_')
}
