<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { composers, eras } from '../../data/composers'

interface TimelineEvent {
  year: number
  title: string
  description: string
}

interface EraConfig {
  name: string
  startYear: number
  endYear: number | null
  color: string  // CSS custom property name
  events: TimelineEvent[]
}

const currentYear = new Date().getFullYear()

/**
 * Era configurations with time ranges, colors, and key events.
 * Colors use Material 3 semantic tokens.
 */
const eraConfigs: EraConfig[] = [
  {
    name: 'Medieval',
    startYear: 500,
    endYear: 1400,
    color: '--md-primary',
    events: [
      { year: 600, title: 'Early Plainchant', description: 'Christian liturgical chant develops across Western Europe' },

      { year: 800, title: 'Gregorian Chant', description: 'A standardized tradition of Western liturgical chant becomes associated with the Roman Church' },

      { year: 850, title: 'Musical Notation', description: 'Early neumatic notation begins to preserve melodic contours in written form' },

      { year: 900, title: 'Aquitanian Notation', description: 'More precise notation allows melodies to be transmitted with increasing accuracy' },

      { year: 1025, title: 'Guido of Arezzo — Micrologus', description: 'Guido develops influential methods of music teaching and introduces the foundations of solmization' },

      { year: 1030, title: 'Staff Notation', description: 'The staff develops into a powerful system for representing musical pitch' },

      { year: 1100, title: 'Organum', description: 'Early polyphony develops from the addition of independent vocal lines to plainchant' },

      { year: 1150, title: 'Notre Dame School', description: 'Large-scale polyphony develops in Paris around the cathedral of Notre Dame' },

      { year: 1170, title: 'Leonin & Organum', description: 'Two-voice and multi-voice polyphony reaches new levels of rhythmic and structural organization' },

      { year: 1200, title: 'Ars Antiqua', description: 'Rhythmic notation and polyphonic composition become increasingly systematized' },

      { year: 1200, title: 'Troubadour Tradition', description: 'Secular song flourishes in southern France and spreads across European courts' },

      { year: 1250, title: 'Motet', description: 'The motet emerges as one of the most important forms of medieval polyphony' },

      { year: 1260, title: 'Franconian Notation', description: 'Rhythmic notation becomes more precise and systematic' },

      { year: 1300, title: 'Ars Nova', description: 'New systems of rhythmic notation enable greater complexity and independence between musical lines' },

      { year: 1320, title: 'Philippe de Vitry — Ars Nova', description: 'A new rhythmic language transforms the possibilities of polyphonic composition' },

      { year: 1340, title: 'Guillaume de Machaut', description: 'French polyphony reaches a major artistic and structural landmark' },

      { year: 1364, title: 'Machaut — Messe de Nostre Dame', description: 'One of the earliest complete settings of the Mass by a single known composer' },

      { year: 1377, title: 'Avignon Papacy Ends', description: 'The return of the papacy to Rome influences the political and cultural landscape of European music' },

      { year: 1400, title: 'International Gothic Style', description: 'French and Italian traditions converge into an increasingly international musical language' },

      { year: 1400, title: 'Transition to the Renaissance', description: 'Medieval polyphony gradually develops toward the smoother contrapuntal language of the Renaissance' }
    ]
  },
  {
    name: 'Renaissance',
    startYear: 1400,
    endYear: 1600,
    color: '--md-secondary',
    events: [
      { year: 1420, title: 'Burgundian School', description: 'A new international style of polyphony emerges in the courts of Burgundy' },
      { year: 1430, title: 'Dufay — Nuper rosarum flores', description: 'Isorhythmic and contrapuntal traditions merge with the emerging Renaissance style' },
      { year: 1450, title: 'Flemish Polyphony', description: 'Northern European composers establish increasingly sophisticated contrapuntal techniques' },
      { year: 1470, title: 'Music Printing', description: 'The spread of printing transforms the preservation and distribution of music' },
      { year: 1501, title: 'Petrucci — Harmonice Musices Odhecaton', description: 'The first substantial collection of polyphonic music printed from movable type is published' },
      { year: 1500, title: 'Josquin des Prez', description: 'Imitative counterpoint and expressive text setting reach a new level of sophistication' },
      { year: 1520, title: 'Madrigal', description: 'The Italian madrigal emerges as a major form of secular vocal music' },
      { year: 1527, title: 'Sack of Rome', description: 'The disruption of the Roman musical establishment contributes to the movement of composers across Europe' },
      { year: 1530, title: 'Reformation Music', description: 'The Protestant Reformation creates new traditions of congregational and sacred music' },
      { year: 1545, title: 'Council of Trent', description: 'Catholic reform prompts renewed attention to clarity and intelligibility in sacred music' },
      { year: 1562, title: 'Palestrina — Missa Papae Marcelli', description: 'A landmark of Renaissance sacred polyphony becomes associated with the ideals of Catholic musical reform' },
      { year: 1567, title: 'Palestrina — Canticum Canticorum', description: 'The mature Roman polyphonic style reaches an influential artistic form' },
      { year: 1570, title: 'Venetian Polychoral Style', description: 'Multiple choirs and spatial effects transform the sound of Renaissance sacred music' },
      { year: 1580, title: 'Madrigalism', description: 'Composers increasingly use musical figures to illustrate and intensify poetic texts' },
      { year: 1587, title: 'Gabrieli — Concerti', description: 'The Venetian school develops increasingly dramatic contrasts of choir, instruments and sonority' },
      { year: 1594, title: 'Palestrina — Death of a Generation', description: 'The high Renaissance polyphonic tradition reaches the end of its dominant period' },
      { year: 1600, title: 'Florentine Camerata', description: 'New ideas about monody, harmony and dramatic expression point toward the Baroque' }
    ]
  },
  {
    name: 'Baroque',
    startYear: 1600,
    endYear: 1750,
    color: '--md-tertiary',
    events: [
      { year: 1600, title: 'Florentine Camerata', description: 'New ideas about monody, harmony and dramatic expression point toward the Baroque' },
      { year: 1607, title: 'Monteverdi — L’Orfeo', description: 'One of the earliest masterpieces of opera establishes a new dramatic musical language' },
      { year: 1610, title: 'Monteverdi — Vespers', description: 'Sacred music combines Renaissance polyphony with emerging Baroque techniques' },
      { year: 1620, title: 'Monody & Basso Continuo', description: 'Solo vocal writing and figured bass become fundamental features of Baroque music' },
      { year: 1637, title: 'Public Opera in Venice', description: 'Opera moves from courtly entertainment toward a commercial public genre' },
      { year: 1640, title: 'Instrumental Sonata', description: 'The sonata develops into an important independent instrumental genre' },
      { year: 1650, title: 'Rise of the French Style', description: 'French court music develops distinctive traditions of dance, ornamentation and orchestral writing' },
      { year: 1660, title: 'Trio Sonata', description: 'The trio sonata becomes a central genre of Baroque chamber music' },
      { year: 1670, title: 'Lully & French Opera', description: 'Lully establishes a distinctive French operatic tradition at the court of Louis XIV' },
      { year: 1675, title: 'Corelli & the Roman School', description: 'Italian instrumental music establishes influential models for sonata and concerto writing' },
      { year: 1685, title: 'Bach, Handel & Scarlatti', description: 'A new generation of composers emerges at the height of the Baroque' },
      { year: 1690, title: 'Corelli — Op. 5', description: 'The violin sonata reaches a major stylistic landmark' },
      { year: 1697, title: 'Purcell — Dido and Aeneas', description: 'English opera reaches one of its defining early masterpieces' },
      { year: 1705, title: 'Vivaldi & the Concerto', description: 'The solo concerto develops into a major instrumental genre' },
      { year: 1711, title: 'Vivaldi — L’estro armonico', description: 'The concerto gains an influential model of contrast and virtuosity' },
      { year: 1717, title: 'Handel — Water Music', description: 'Orchestral music becomes an important part of courtly and public spectacle' },
      { year: 1722, title: 'Bach — The Well-Tempered Clavier', description: 'A landmark of tonal harmony, counterpoint and keyboard music' },
      { year: 1725, title: 'Vivaldi — The Four Seasons', description: 'Programmatic instrumental music reaches a landmark form' },
      { year: 1727, title: 'Handel — Messiah', description: 'The English oratorio reaches monumental scale' },
      { year: 1730, title: 'Opera Seria', description: 'Italian opera seria becomes the dominant international operatic model' },
      { year: 1734, title: 'Pergolesi — La serva padrona', description: 'Opera buffa gains wider influence and challenges the dominance of opera seria' },
      { year: 1735, title: 'Bach — Goldberg Variations', description: 'Variation technique and keyboard counterpoint reach extraordinary refinement' },
      { year: 1740, title: 'Galant Style', description: 'A lighter and more homophonic style begins to replace Baroque complexity' },
      { year: 1747, title: 'Bach — Musical Offering', description: 'Late Baroque contrapuntal technique reaches extraordinary refinement' },
      { year: 1750, title: 'End of the Baroque', description: 'Bach’s death marks the conventional end of the Baroque era' }
    ]
  },
  {
    name: 'Classical',
    startYear: 1750,
    endYear: 1820,
    color: '--md-primary',
    events: [
      { year: 1750, title: 'Emergence of the Classical Style', description: 'The Baroque style gives way to clearer textures, balanced phrases and new formal principles' },
      { year: 1756, title: 'Mannheim School', description: 'A new orchestral style develops with dynamic contrasts, crescendos and refined ensemble playing' },
      { year: 1761, title: 'Gluck — Opera Reform', description: 'Opera reform emphasizes dramatic clarity, natural expression and musical unity' },
      { year: 1765, title: 'Sonata Form', description: 'The sonata principle becomes a central structural model of Classical instrumental music' },
      { year: 1769, title: 'Sturm und Drang', description: 'A dramatic style marked by minor keys, strong contrasts and heightened emotional expression emerges' },
      { year: 1770, title: 'Haydn — String Quartets', description: 'The string quartet develops into one of the defining genres of Classical chamber music' },
      { year: 1772, title: 'Haydn — Op. 20', description: 'Haydn’s quartets establish important models for mature Classical chamber music' },
      { year: 1776, title: 'Classical Symphony', description: 'The four-movement symphonic model becomes increasingly standardized' },
      { year: 1781, title: 'Mozart — Idomeneo', description: 'Classical opera reaches new dramatic and orchestral sophistication' },
      { year: 1781, title: 'Mozart — Haydn Quartets', description: 'Mozart deepens the expressive and contrapuntal possibilities of the string quartet' },
      { year: 1786, title: 'Mozart — Le nozze di Figaro', description: 'Opera buffa reaches a new level of dramatic integration and ensemble writing' },
      { year: 1787, title: 'Mozart — Don Giovanni', description: 'Opera combines comic and tragic elements within an increasingly sophisticated Classical language' },
      { year: 1788, title: 'Mozart — Last Symphonies', description: 'The Classical symphony reaches extraordinary structural and expressive maturity' },
      { year: 1791, title: 'Mozart — Die Zauberflöte', description: 'German-language opera gains a major work combining popular and sophisticated traditions' },
      { year: 1795, title: 'Beethoven in Vienna', description: 'A new generation begins to transform the Classical style from within' },
      { year: 1797, title: 'Beethoven — Piano Sonatas', description: 'The piano sonata becomes an increasingly ambitious vehicle for personal expression' },
      { year: 1800, title: 'Beethoven — First Symphony', description: 'The Classical tradition begins to expand beyond the conventions of the eighteenth century' },
      { year: 1803, title: 'Beethoven — Eroica', description: 'The symphony expands dramatically in scale, ambition and expressive range' },
      { year: 1805, title: 'Beethoven — Fidelio', description: 'Opera becomes a vehicle for Beethoven’s ideals of freedom, heroism and human dignity' },
      { year: 1808, title: 'Beethoven — Fifth & Sixth Symphonies', description: 'Beethoven transforms the symphony through dramatic intensity and programmatic expression' },
      { year: 1810, title: 'Beethoven — Late Style', description: 'Classical forms are increasingly transformed by harmonic, structural and expressive experimentation' },
      { year: 1815, title: 'Schubert — The Erlkönig', description: 'The Romantic Lied emerges as a major genre' },
      { year: 1816, title: 'Rossini — Almaviva', description: 'Italian opera enters a new phase of virtuosity, melody and theatrical energy' },
      { year: 1819, title: 'Beethoven — Hammerklavier', description: 'The piano sonata reaches unprecedented technical, structural and expressive dimensions' },
      { year: 1820, title: 'End of the Classical Era', description: 'The Classical tradition gives way to the mature Romantic musical language' }
    ]
  },
  {
    name: 'Romantic',
    startYear: 1800,
    endYear: 1910,
    color: '--md-secondary',
    events: [
      { year: 1820, title: 'Rise of Romanticism', description: 'Individual expression, poetic imagination and expanded harmonic language become central to European music' },
      { year: 1824, title: 'Beethoven — Ninth Symphony', description: 'The symphony reaches an unprecedented dramatic and philosophical scale' },
      { year: 1825, title: 'Schubert — String Quartet No. 14', description: 'Schubert’s instrumental music reveals a new depth of Romantic expression' },
      { year: 1827, title: 'Schubert — Winterreise', description: 'The song cycle becomes a powerful vehicle for Romantic poetry and psychological expression' },
      { year: 1830, title: 'Berlioz — Symphonie fantastique', description: 'Program music and orchestral color become central Romantic ideals' },
      { year: 1830, title: 'Chopin — Piano Revolution', description: 'The piano becomes a central vehicle for Romantic expression and virtuosity' },
      { year: 1831, title: 'Bellini & Italian Bel Canto', description: 'Long melodic lines and vocal expressiveness become defining features of Romantic opera' },
      { year: 1834, title: 'Schumann — Neue Zeitschrift', description: 'Romantic musical criticism and aesthetics gain a powerful voice' },
      { year: 1836, title: 'Schumann — Fantasy in C', description: 'The piano becomes a medium for highly personal and poetic musical expression' },
      { year: 1842, title: 'Schumann — Symphony in B-flat', description: 'The symphony is renewed through Romantic orchestral color and thematic development' },
      { year: 1842, title: 'Verdi — Nabucco', description: 'Italian opera enters a new period of dramatic and national significance' },
      { year: 1845, title: 'Mendelssohn — Violin Concerto', description: 'The Romantic concerto combines lyrical melody with virtuoso writing and formal innovation' },
      { year: 1848, title: 'Revolutions of 1848', description: 'Political nationalism strengthens the cultural importance of national musical traditions' },
      { year: 1851, title: 'Liszt — Piano Sonata in B minor', description: 'The sonata form is transformed into a continuous Romantic structure' },
      { year: 1853, title: 'Liszt — Symphonic Poem', description: 'A new orchestral genre unites instrumental music with literary and narrative ideas' },
      { year: 1857, title: 'Wagner — Music Drama', description: 'Wagner develops a new conception of opera based on continuous music and dramatic unity' },
      { year: 1859, title: 'Wagner — Tristan und Isolde', description: 'Extreme chromaticism pushes traditional tonality toward its limits' },
      { year: 1865, title: 'Tristan und Isolde Premiere', description: 'Wagner’s harmonic language becomes a landmark in the transition toward modernism' },
      { year: 1867, title: 'National Schools', description: 'Distinctive Czech, Russian, Scandinavian and other national musical traditions gain prominence' },
      { year: 1874, title: 'Mussorgsky — Pictures at an Exhibition', description: 'Nationalism and unconventional harmonic language expand the possibilities of piano music' },
      { year: 1876, title: 'Bayreuth Festival', description: 'Wagner’s music drama becomes a major model for late Romantic musical culture' },
      { year: 1877, title: 'Brahms — Symphony No. 1', description: 'Brahms demonstrates that Classical forms can remain powerful within the Romantic era' },
      { year: 1882, title: 'Wagner — Parsifal', description: 'Late Wagnerian chromaticism and orchestral color reach a highly developed form' },
      { year: 1883, title: 'Brahms — Symphony No. 3', description: 'Romantic symphonic writing is combined with Classical formal discipline' },
      { year: 1889, title: 'Paris Exposition', description: 'Exposure to Javanese gamelan and other musical traditions influences emerging modernism' },
      { year: 1890, title: 'Mahler — Symphony No. 1', description: 'The symphony expands toward the enormous scale and expressive intensity of late Romanticism' },
      { year: 1894, title: 'Debussy — Prélude à l’après-midi d’un faune', description: 'A landmark in the emergence of musical Impressionism' },
      { year: 1896, title: 'Strauss — Also sprach Zarathustra', description: 'Late Romantic orchestration reaches extraordinary scale and harmonic intensity' },
      { year: 1900, title: 'End of Romanticism', description: 'Late Romantic harmony and orchestration approach the limits of traditional tonality' }
    ]
  },
  {
    name: 'Modernism',
    startYear: 1890,
    endYear: 1945,
    color: '--md-tertiary',
    events: [
      { year: 1890, title: 'Mahler & Late Romanticism', description: 'Symphonic expansion toward modernism' },
      { year: 1892, title: 'Debussy & Symbolism', description: 'New approaches to harmony, timbre and form' },
      { year: 1894, title: 'Debussy: Prélude à l’après-midi d’un faune', description: 'A landmark of musical modernism' },
      { year: 1896, title: 'Strauss: Also sprach Zarathustra', description: 'Radical orchestration and harmonic language' },
      { year: 1902, title: 'Debussy: Pelléas et Mélisande', description: 'New operatic language beyond Wagnerism' },
      { year: 1905, title: 'Schoenberg: Pelleas und Melisande', description: 'Late Romanticism approaching atonality' },
      { year: 1907, title: 'Schoenberg: Second String Quartet', description: 'Breakthrough toward atonality' },
      { year: 1908, title: 'Schoenberg: Das Buch der hängenden Gärten', description: 'Free atonality emerges' },
      { year: 1910, title: 'Stravinsky: The Firebird', description: 'Modernist rhythm and orchestral color' },
      { year: 1912, title: 'Schoenberg: Pierrot lunaire', description: 'Sprechstimme and radical chamber writing' },
      { year: 1913, title: 'Stravinsky: The Rite of Spring', description: 'Revolutionary rhythm, harmony and orchestration' },
      { year: 1914, title: 'Second Viennese School', description: 'Schoenberg, Berg and Webern develop atonal modernism' },
      { year: 1917, title: 'Stravinsky: L’histoire du soldat', description: 'Neoclassical tendencies and new instrumental colors' },
      { year: 1919, title: 'Bartók: Dance Suite', description: 'Modernism combined with folk-derived materials' },
      { year: 1921, title: 'Schoenberg: Twelve-Tone Method', description: 'Systematic organization of all twelve pitches' },
      { year: 1923, title: 'Varèse: Hyperprism', description: 'Sound masses and new concepts of orchestration' },
      { year: 1924, title: 'Gershwin: Rhapsody in Blue', description: 'Jazz enters the concert-music tradition' },
      { year: 1925, title: 'Berg: Wozzeck', description: 'Expressionism transformed into modern opera' },
      { year: 1928, title: 'Stravinsky: Apollon musagète', description: 'The rise of musical neoclassicism' },
      { year: 1930, title: 'Messiaen: Préludes', description: 'New harmonic language and rhythmic concepts' },
      { year: 1937, title: 'Shostakovich: Symphony No. 5', description: 'Modernism under Soviet cultural conditions' },
      { year: 1939, title: 'Bartók: Divertimento', description: 'Mature synthesis of modernism and folk music' },
      { year: 1944, title: 'Messiaen: Quatuor pour la fin du temps', description: 'A major work of wartime modernism' },
      { year: 1945, title: 'End of Early Modernism', description: 'Postwar avant-garde begins to reshape modern music' }
    ]
  },
  {
    name: 'Contemporary',
    startYear: 1945,
    endYear: null,
    color: '--md-primary',
    events: [
      { year: 1945, title: 'Postwar Avant-Garde', description: 'A new generation reshapes modern music after World War II' },
      { year: 1946, title: 'Messiaen: Turangalîla-Symphonie', description: 'New rhythmic, harmonic and timbral possibilities' },
      { year: 1948, title: 'Musique concrète', description: 'Recorded sound becomes raw musical material' },
      { year: 1950, title: 'Electronic Music', description: 'Electronic sound synthesis enters experimental composition' },
      { year: 1951, title: 'Darmstadt School', description: 'Postwar European avant-garde develops around serialism' },
      { year: 1952, title: 'Cage: 4′33″', description: 'Silence, chance and the concept of musical authorship are challenged' },
      { year: 1953, title: 'Stockhausen: Kontra-Punkte', description: 'A landmark in postwar total serialism' },
      { year: 1956, title: 'Stockhausen: Gesang der Jünglinge', description: 'Electronic and vocal sounds are integrated' },
      { year: 1957, title: 'Boulez: Structures', description: 'Total serialism applied to pitch, rhythm and dynamics' },
      { year: 1960, title: 'Aleatoric Music', description: 'Chance and performer choice become compositional elements' },
      { year: 1962, title: 'Ligeti: Atmosphères', description: 'Micropolyphony creates dense evolving sound masses' },
      { year: 1964, title: 'Minimalism', description: 'Repetition and gradual process emerge as major compositional strategies' },
      { year: 1965, title: 'Reich: It’s Gonna Rain', description: 'Phasing becomes a defining minimalist technique' },
      { year: 1966, title: 'Schnittke & Polystylism', description: 'Multiple historical styles are deliberately combined' },
      { year: 1969, title: 'New Complexity', description: 'Extreme rhythmic, notational and instrumental demands emerge' },
      { year: 1970, title: 'Spectral Music', description: 'Acoustic spectra become a basis for harmony and orchestration' },
      { year: 1976, title: 'Reich: Music for 18 Musicians', description: 'Minimalism expands into large-scale ensemble music' },
      { year: 1978, title: 'Grisey: Partiels', description: 'Spectral analysis shapes musical structure and timbre' },
      { year: 1980, title: 'New Simplicity', description: 'Renewed interest in clarity, consonance and direct expression' },
      { year: 1984, title: 'Digital Music', description: 'Digital technology transforms composition, recording and sound synthesis' },
      { year: 1987, title: 'Post-Minimalism', description: 'Minimalist processes merge with broader harmonic and expressive languages' },
      { year: 1990, title: 'New Instrumentalism', description: 'Extended techniques and timbral exploration become increasingly central' },
      { year: 1995, title: 'Live Electronics', description: 'Real-time electronic processing becomes integrated into performance' },
      { year: 2000, title: 'Global Contemporary Music', description: 'Composers increasingly combine diverse musical traditions and practices' },
      { year: 2010, title: 'Digital & Multimedia Composition', description: 'Interactive media, software and audiovisual art expand musical practice' },
      { year: 2020, title: 'Contemporary Sound Practices', description: 'Acoustic, electronic, digital and interdisciplinary approaches converge' }
    ]
  }
]

const totalComposers = computed(() => composers.length)

const eraCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const era of eras) {
    counts[era] = composers.filter(c => c.era === era).length
  }
  return counts
})

// Collapsed state
const expanded = ref(false)

// Selected eras (default: first 3)
const selectedEras = ref<string[]>(eras.slice(0, 3))

// Active node for click-to-pin tooltip
const activeNode = ref<{ eraName: string; eventIdx: number } | null>(null)

// Hover state for tooltip
const hoveredNode = ref<{ eraName: string; eventIdx: number } | null>(null)

function toggleEra(era: string) {
  const index = selectedEras.value.indexOf(era)
  if (index >= 0) {
    selectedEras.value.splice(index, 1)
  } else {
    selectedEras.value.push(era)
  }
}

function isEraSelected(era: string): boolean {
  return selectedEras.value.includes(era)
}

const visibleEras = computed(() => {
  return eraConfigs.filter(e => selectedEras.value.includes(e.name))
})

function getVisualEndYear(era: EraConfig): number {
  return era.endYear ?? currentYear
}

function getEventPosition(eventYear: number, era: EraConfig): number {
  const visualEnd = getVisualEndYear(era)
  const span = visualEnd - era.startYear
  if (span === 0) return 0
  const pos = ((eventYear - era.startYear) / span) * 100
  return Math.max(0, Math.min(100, pos))
}

function toggleExpanded() {
  expanded.value = !expanded.value
}

// Click handler for event nodes
function handleNodeClick(eraName: string, eventIdx: number, event: MouseEvent) {
  event.stopPropagation()
  if (activeNode.value?.eraName === eraName && activeNode.value?.eventIdx === eventIdx) {
    // Click active node again -> close
    activeNode.value = null
  } else {
    activeNode.value = { eraName, eventIdx }
  }
}

// Check if a node is active
function isNodeActive(eraName: string, eventIdx: number): boolean {
  return activeNode.value?.eraName === eraName && activeNode.value?.eventIdx === eventIdx
}

// Check if a node is hovered
function isNodeHovered(eraName: string, eventIdx: number): boolean {
  return hoveredNode.value?.eraName === eraName && hoveredNode.value?.eventIdx === eventIdx
}

// Show tooltip when hovered OR active
function shouldShowTooltip(eraName: string, eventIdx: number): boolean {
  return isNodeHovered(eraName, eventIdx) || isNodeActive(eraName, eventIdx)
}

// Close active node when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (!activeNode.value) return
  const target = event.target as Node
  const timelinesEl = document.querySelector('.era-timelines')
  if (timelinesEl && !timelinesEl.contains(target)) {
    activeNode.value = null
  }
}

// Close active node on Escape
function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && activeNode.value) {
    activeNode.value = null
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <div class="composer-overview" :class="{ collapsed: !expanded }">
    <!-- Header / Toggle -->
    <button
        class="overview-toggle"
        :aria-expanded="expanded ? 'true' : 'false'"
        @click="toggleExpanded"
    >
      <span class="overview-toggle-left">
        <span class="overview-icon" aria-hidden="true">
          <svg v-if="expanded" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 6l4 4 4-4"/></svg>
          <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 4l4 4-4 4"/></svg>
        </span>
        <span class="overview-title">Era Timeline</span>
      </span>
    </button>

    <!-- Expanded content -->
    <div v-if="expanded" class="overview-content">
      <!-- Era chips -->
      <div class="era-chips">
        <button
            v-for="era in eras"
            :key="era"
            class="era-chip"
            :class="{ active: isEraSelected(era) }"
            @click="toggleEra(era)"
        >
          {{ era }}
        </button>
      </div>

      <!-- Era timelines -->
      <div v-if="visibleEras.length" class="era-timelines">
        <div
            v-for="era in visibleEras"
            :key="era.name"
            class="era-timeline"
        >
          <div class="era-timeline-header">
            <span class="era-timeline-name">{{ era.name }}</span>
            <span class="era-timeline-range">
              {{ era.startYear }}–{{ era.endYear ?? 'present' }}
            </span>
          </div>
          <div class="era-timeline-track">
            <div
                class="era-timeline-line"
                :style="{ '--era-color': `var(${era.color})`, '--era-color-container': `var(${era.color}-container, var(--md-primary-container))` }"
            ></div>
            <div
                v-for="(event, idx) in era.events"
                :key="idx"
                class="era-timeline-node"
                :class="{ active: isNodeActive(era.name, idx) }"
                :style="{
                  left: getEventPosition(event.year, era) + '%',
                  '--era-color': `var(${era.color})`,
                  '--era-color-container': `var(${era.color}-container, var(--md-primary-container))`
                }"
                :data-position="getEventPosition(event.year, era) < 33 ? 'left' : getEventPosition(event.year, era) > 66 ? 'right' : 'center'"
                @pointerenter="hoveredNode = { eraName: era.name, eventIdx: idx }"
                @pointerleave="hoveredNode = null"
                @click="handleNodeClick(era.name, idx, $event)"
            >
              <div class="era-timeline-dot"></div>
              <div v-if="shouldShowTooltip(era.name, idx)" class="era-timeline-tooltip">
                <div class="era-timeline-tooltip-year">{{ event.year }}</div>
                <div class="era-timeline-tooltip-title">{{ event.title }}</div>
                <div class="era-timeline-tooltip-desc">{{ event.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state when no eras selected -->
      <p v-else class="overview-empty">Select an era above to view its timeline.</p>
    </div>
  </div>
</template>

<style scoped>
.composer-overview {
  margin-bottom: 20px;
  border-radius: var(--md-radius-md);
}

/* Expanded state has border */
.composer-overview:not(.collapsed) {
  border: 1px solid var(--md-outline-variant);
  background: var(--md-surface-container-lowest);
}

/* ---- Toggle button ---- */
.overview-toggle {
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
  padding: 0 14px;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-radius-md);
  background: var(--md-surface);
  color: var(--md-on-surface);
  font-family: var(--font-ui);
  font-size: 13px;
  cursor: pointer;
  transition: background var(--md-duration-fast) var(--md-ease),
              border-color var(--md-duration-fast) var(--md-ease);
}

.overview-toggle:hover {
  background: var(--md-surface-container-low);
  border-color: var(--md-primary);
}

/* Remove border from toggle when expanded (container has border) */
.composer-overview:not(.collapsed) .overview-toggle {
  border: 0;
  border-radius: var(--md-radius-md) var(--md-radius-md) 0 0;
}

.overview-toggle-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.overview-icon {
  display: flex;
  color: var(--md-on-surface-variant);
  transition: transform var(--md-duration-fast) var(--md-ease);
}

.overview-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--md-on-surface);
}

/* ---- Expanded content ---- */
.overview-content {
  padding: 0 14px 14px;
  animation: overview-expand 180ms var(--md-ease) both;
}

@keyframes overview-expand {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ---- Era chips ---- */
.era-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.era-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-radius-full);
  background: var(--md-surface-container-low);
  color: var(--md-on-surface-variant);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--md-duration-fast) var(--md-ease),
              border-color var(--md-duration-fast) var(--md-ease),
              color var(--md-duration-fast) var(--md-ease);
}

.era-chip:hover {
  border-color: var(--md-primary);
  color: var(--md-primary);
}

.era-chip.active {
  background: var(--md-primary-container);
  border-color: var(--md-primary-container);
  color: var(--md-on-primary-container);
}

/* ---- Era timelines ---- */
.era-timelines {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.era-timeline {
  position: relative;
}

.era-timeline-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 4px;
}

.era-timeline-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--md-on-surface);
}

.era-timeline-range {
  font-size: 11px;
  color: var(--md-outline);
}

.era-timeline-track {
  position: relative;
  height: 24px;
}

.era-timeline-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 1px;
  background: var(--era-color-container, var(--md-outline-variant));
  transform: translateY(-50%);
}

.era-timeline-node {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
}

.era-timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--era-color, var(--md-primary));
  border: 2px solid var(--md-surface-container-lowest);
  transition: transform var(--md-duration-fast) var(--md-ease),
              box-shadow var(--md-duration-fast) var(--md-ease);
}

.era-timeline-node:hover .era-timeline-dot {
  transform: scale(1.3);
}

.era-timeline-node.active .era-timeline-dot {
  transform: scale(1.2);
  box-shadow: 0 0 0 3px var(--era-color-container, var(--md-primary-container));
}

.era-timeline-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  min-width: 140px;
  max-width: 200px;
  padding: 8px 10px;
  border-radius: var(--md-radius-sm);
  background: var(--md-surface-container-high);
  border: 1px solid var(--md-outline-variant);
  box-shadow: var(--md-shadow-2);
  pointer-events: none;
  z-index: 100;
  animation: tooltip-appear 120ms var(--md-ease) both;
}

@keyframes tooltip-appear {
  from { opacity: 0; transform: translateY(2px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Center position (default) */
.era-timeline-node[data-position="center"] .era-timeline-tooltip {
  left: 50%;
  transform: translateX(-50%);
}

/* Left position - align tooltip left edge with node */
.era-timeline-node[data-position="left"] .era-timeline-tooltip {
  left: 0;
  transform: none;
}

/* Right position - align tooltip right edge with node */
.era-timeline-node[data-position="right"] .era-timeline-tooltip {
  left: auto;
  right: 0;
  transform: none;
}

.era-timeline-tooltip-year {
  font-size: 10px;
  font-weight: 600;
  color: var(--era-color, var(--md-primary));
}

.era-timeline-tooltip-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--md-on-surface);
  margin-top: 2px;
}

.era-timeline-tooltip-desc {
  font-size: 11px;
  color: var(--md-on-surface-variant);
  margin-top: 2px;
  line-height: 1.3;
}

/* ---- Empty state ---- */
.overview-empty {
  font-size: 12px;
  color: var(--md-outline);
  text-align: center;
  padding: 12px 0;
  margin: 0;
}

/* ---- Collapsed state ---- */
.composer-overview.collapsed {
  border-radius: var(--md-radius-md);
}

/* ---- Responsive ---- */
@media (max-width: 640px) {
  .era-timelines {
    gap: 8px;
  }

  .era-timeline-tooltip {
    min-width: 120px;
    max-width: 160px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .overview-content {
    animation: none;
  }

  .era-timeline-tooltip {
    animation: none;
  }

  .era-timeline-dot,
  .era-timeline-tooltip {
    transition: none;
  }
}
</style>