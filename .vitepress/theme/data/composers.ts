export type ComposerPeriod = 'Early' | 'Middle' | 'Late'

export interface Composer {
  name: string
  born: number
  died: number
  era: string
  period: ComposerPeriod
  nationality: string
  intro: string
  slug: string
  color: string
}

export const eras = [
  'Medieval',
  'Renaissance',
  'Baroque',
  'Classical',
  'Romantic',
  'Modernism',
  'Contemporary'
]

/**
 * Era classification groups (for reference, not displayed as separate timelines).
 */
export const eraGroups: Record<string, string> = {
  'Medieval': 'Early music',
  'Renaissance': 'Early music',
  'Baroque': 'Common practice period',
  'Classical': 'Common practice period',
  'Romantic': 'Common practice period',
  'Modernism': 'New music',
  'Contemporary': 'New music'
}

/**
 * Nationality to flag emoji mapping.
 * Historical/mixed entities that don't map cleanly to a modern country
 * use a neutral emoji (🎵 for historical, 🌐 for mixed).
 */
const nationalityEmoji: Record<string, string> = {
  'French': '🇫🇷',
  'Franco-Flemish': '🎵',
  'Italian': '🇮🇹',
  'English': '🇬🇧',
  'German': '🇩🇪',
  'Austrian': '🇦🇹',
  'Czech': '🇨🇿',
  'Russian-French-American': '🌐',
}

const fallbackEmoji = '🌍'

export function nationalityToEmoji(nationality: string): string {
  if (!nationality) return fallbackEmoji
  return nationalityEmoji[nationality] || fallbackEmoji
}

export const composers: Composer[] = [
  {
    name: 'Hildegard von Bingen',
    born: 1098,
    died: 1179,
    era: 'Medieval',
    period: 'Early',
    nationality: 'German',
    intro: 'A German Benedictine abbess, composer, and mystic whose liturgical songs are among the earliest surviving notated music by a named female composer.',
    slug: 'hildegard',
    color: '#a855f7'
  },

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
    name: 'Pérotin',
    born: 1160,
    died: 1230,
    era: 'Medieval',
    period: 'Middle',
    nationality: 'French',
    intro: 'A French composer of the Notre-Dame school who expanded polyphonic music to three and four voices.',
    slug: 'perotin',
    color: '#7c3aed'
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
    intro: 'One of England\'s most important Baroque composers.',
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
    period: 'Late',
    nationality: 'Italian',
    intro: 'An Italian composer and violinist best known for his concertos, operas and sacred music.',
    slug: 'vivaldi',
    color: '#15803d'
  },

  {
    name: 'Georg Philipp Telemann',
    born: 1681,
    died: 1767,
    era: 'Baroque',
    period: 'Middle',
    nationality: 'German',
    intro: 'A prolific German Baroque composer whose music bridged the Baroque and Classical styles.',
    slug: 'telemann',
    color: '#0f766e'
  },

  {
    name: 'Jean-Philippe Rameau',
    born: 1683,
    died: 1764,
    era: 'Baroque',
    period: 'Late',
    nationality: 'French',
    intro: 'A major French composer and music theory writer of the late Baroque.',
    slug: 'rameau',
    color: '#0e7490'
  },

  {
    name: 'Giovanni Battista Pergolesi',
    born: 1710,
    died: 1736,
    era: 'Baroque',
    period: 'Early',
    nationality: 'Italian',
    intro: 'An Italian composer, violinist and organist of the Baroque period.',
    slug: 'pergolesi',
    color: '#0369a1'
  },

  {
    name: 'Johann Sebastian Bach',
    born: 1685,
    died: 1750,
    era: 'Baroque',
    period: 'Late',
    nationality: 'German',
    intro: 'One of the most influential composers in Western music history and a central figure of the late Baroque.',
    slug: 'bach',
    color: '#dc2626'
  },

  {
    name: 'George Frideric Handel',
    born: 1685,
    died: 1759,
    era: 'Baroque',
    period: 'Late',
    nationality: 'German',
    intro: 'A German-British Baroque composer known for his operas, oratorios and concerti grossi, and one of the leading figures of English Baroque music.',
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
    name: 'Robert Schumann',
    born: 1810,
    died: 1856,
    era: 'Romantic',
    period: 'Middle',
    nationality: 'German',
    intro: 'A German Romantic composer known for his piano works, songs and orchestral music.',
    slug: 'schumann',
    color: '#4338ca'
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
    era: 'Modernism',
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
    era: 'Modernism',
    period: 'Middle',
    nationality: 'Russian-French-American',
    intro: 'One of the most influential composers of the twentieth century, known for his constantly evolving musical language.',
    slug: 'stravinsky',
    color: '#0369a1'
  },

  {
    name: 'Arnold Schoenberg',
    born: 1874,
    died: 1951,
    era: 'Modernism',
    period: 'Late',
    nationality: 'Austrian',
    intro: 'An Austrian composer who pioneered atonality and the twelve-tone technique, fundamentally changing the course of twentieth-century music.',
    slug: 'schoenberg',
    color: '#0c4a6e'
  }
]

export function composerBySlug(slug: string): Composer | undefined {
  return composers.find(composer => composer.slug === slug)
}

export function composerLink(composer: Composer): string {
  return composer.slug
      ? `/pages/composers/${composer.slug}`
      : ''
}

/** Wikipedia article title used by the Wikipedia introduction component. */
export function wikipediaPage(composer: Composer): string {
  return composer.name.replace(/ /g, '_')
}