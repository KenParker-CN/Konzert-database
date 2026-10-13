import type {Locale} from '@/lib/i18n/config'

export type WorkTermKind = 'type' | 'key' | 'instrumentation'

type WorkTermLocale = Extract<Locale, 'zh' | 'fr' | 'de'>
type TermTranslations = Record<WorkTermLocale, Record<string, string>>

const translations: Record<WorkTermKind, TermTranslations> = {
    type: {
        zh: {
            "Symphony": "交响曲",
            "Concerto": "协奏曲",
            "Sonata": "奏鸣曲",
            "Sonatina": "小奏鸣曲",
            "Mass": "弥撒",
            "Requiem": "安魂曲",
            "Suite": "组曲",
            "Canon": "卡农",
            "Fugue": "赋格",
            "Prelude": "前奏曲",
            "Overture": "序曲",
            "Rhapsody": "狂想曲",
            "Fantasy": "幻想曲",
            "Fantasia": "幻想曲",
            "Toccata": "托卡塔",
            "Partita": "帕蒂塔",
            "Variation": "变奏曲",
            "Theme and Variations": "主题与变奏",
            "Etude": "练习曲",
            "Nocturne": "夜曲",
            "Impromptu": "即兴曲",
            "Caprice": "随想曲",
            "Capriccio": "随想曲",
            "Serenade": "小夜曲",
            "Divertimento": "嬉游曲",
            "Minuet": "小步舞曲",
            "Dance": "舞曲",
            "Polonaise": "波兰舞曲",
            "Waltz": "圆舞曲",
            "Mazurka": "玛祖卡",
            "Polka": "波尔卡",
            "March": "进行曲",
            "Elegy": "挽歌",
            "Intermezzo": "间奏曲",
            "Scherzo": "谐谑曲",
            "Adagio": "柔板",
            "Aria": "咏叹调",
            "Cantata": "康塔塔",
            "Oratorio": "神剧",
            "Motet": "经文歌",
            "Chorale": "众赞歌",
            "Hymn": "圣咏",
            "Stabat Mater": "圣母悼歌",
            "Te Deum": "赞美颂",
            "Miserere": "垂怜经",
            "Lamentation": "哀歌",
            "Opera": "歌剧",
            "Operetta": "轻歌剧",
            "Ouverture-Suite": "序曲组曲",
            "Solo": "独奏",
            "Menuet": "小步舞曲",
            "Ballet": "芭蕾",
            "Incidental Music": "戏剧配乐",
            "Film Music": "电影音乐",
            "Chamber Music": "室内乐",
            "String Quartet": "弦乐四重奏",
            "Piano Trio": "钢琴三重奏",
            "Duo": "二重奏",
            "Pasticcio": "拼贴作品",
            "Trio": "三重奏",
            "Quartet": "四重奏",
            "Quintet": "五重奏",
            "Sextet": "六重奏",
            "Octet": "八重奏",
            "Song": "歌曲",
            "Mélodie": "艺术歌曲",
            "Lied": "艺术歌曲",
            "Romance": "浪漫曲",
            "Ballade": "叙事曲",
            "Study": "练习曲",
            "Piece": "小品",
            "Pieces": "小品集",
            "Psalm": "诗篇",
            "Passion": "受难曲",
            "Choralvorspiel": "众赞歌前奏曲",
            "Choralpartita": "众赞歌帕蒂塔",
            "Invention": "创意曲",
            "Keyboard Variations":"键盘变奏曲",
        },

        fr: {
            "Symphony": "Symphonie",
            "Concerto": "Concerto",
            "Sonata": "Sonate",
            "Sonatine": "Sonatine",
            "Mass": "Messe",
            "Requiem": "Requiem",
            "Suite": "Suite",
            "Canon": "Canon",
            "Fugue": "Fugue",
            "Prelude": "Prélude",
            "Overture": "Ouverture",
            "Fantasy": "Fantaisie",
            "Fantasia": "Fantaisie",
            "Variation": "Variation",
            "Variations": "Variations",
            "Cantata": "Cantate",
            "Oratorio": "Oratorio",
            "Motet": "Motet",
            "Opera": "Opéra",
            "Ballet": "Ballet",
            "Chamber Music": "Musique de chambre",
            "Mélodie": "Mélodie",
            "Lied": "Lied",
            "Ballade": "Ballade",

        },

        de: {
            "Symphony": "Sinfonie",
            "Concerto": "Konzert",
            "Sonata": "Sonate",
            "Sonatine": "Sonatine",
            "Mass": "Messe",
            "Requiem": "Requiem",
            "Suite": "Suite",
            "Canon": "Kanon",
            "Fugue": "Fuge",
            "Prelude": "Präludium",
            "Overture": "Ouvertüre",
            "Fantasy": "Fantasie",
            "Variation": "Variation",
            "Cantata": "Kantate",
            "Oratorio": "Oratorium",
            "Motet": "Motette",
            "Opera": "Oper",
            "Ballet": "Ballett",
            "Chamber Music": "Kammermusik",
            "Lied": "Lied",
        },

    },
    key: {
        zh: {
            "C major": "C大调",
            "C minor": "c小调",
            "D major": "D大调",
            "D minor": "d小调",
            "E major": "E大调",
            "E minor": "e小调",
            "F major": "F大调",
            "F minor": "f小调",
            "G major": "G大调",
            "G minor": "g小调",
            "A major": "A大调",
            "A minor": "a小调",
            "B-flat major": "降B大调",
            "B-flat minor": "降b小调",
            "B major": "B大调",
            "B minor": "b小调",

            "D-flat major": "降D大调",
            "D-flat minor": "降d小调",
            "E-flat major": "降E大调",
            "E-flat minor": "降e小调",
            "F-sharp major": "升F大调",
            "F-sharp minor": "升f小调",
            "G-sharp minor": "升g小调",
            "A-flat major": "降A大调",
            "A-flat minor": "降a小调"
        },
        fr: {
            "C major": "Do majeur",
            "C minor": "do mineur",
            "D major": "Ré majeur",
            "D minor": "ré mineur",
            "E major": "Mi majeur",
            "E minor": "mi mineur",
            "F major": "Fa majeur",
            "F minor": "fa mineur",
            "G major": "Sol majeur",
            "G minor": "sol mineur",
            "A major": "La majeur",
            "A minor": "la mineur",
            "B-flat major": "Si bémol majeur",
            "B-flat minor": "si bémol mineur",
        },
        de: {
            "C major": "C-Dur",
            "C minor": "c-Moll",
            "D major": "D-Dur",
            "D minor": "d-Moll",
            "E major": "E-Dur",
            "E minor": "e-Moll",
            "F major": "F-Dur",
            "F minor": "f-Moll",
            "G major": "G-Dur",
            "G minor": "g-Moll",
            "A major": "A-Dur",
            "A minor": "a-Moll",
            "B-flat major": "B-Dur",
            "B-flat minor": "b-Moll",
        },
    },
    instrumentation: {
        zh: {
            "carillon": "铜钟琴",
            "Piano": "钢琴",
            "Keyboard": "键盘",
            "Organ": "管风琴",
            "Harpsichord": "羽管键琴",
            "Violin": "小提琴",
            "Violas da gamba": "维奥尔琴",
            "Viola": "中提琴",
            "Cello": "大提琴",
            "Double Bass": "低音提琴",
            "Transverse Flute": "横笛",
            "Theorbo": "西奥伯琴",
            "Flute": "长笛",
            "Oboe": "双簧管",
            "Bass Clarinet": "低音单簧管",
            "Clarinet": "单簧管",
            "Recorder":"竖笛",
            "Bassoon": "巴松管",
            "Horn": "圆号",
            "Trumpet": "小号",
            "Trombone": "长号",
            "Timpani": "定音鼓",
            "Harp": "竖琴",
            "Voice": "人声",
            "Triangle": "三角铁",
            "Choir": "合唱团",
            "Strings": "弦乐",
            "Orchestra": "管弦乐队",
            "Basso": "低音声部",
            "Basso Continuo": "通奏低音",
            "Contrebassoon": "倍低音巴松管"
        },
        fr: {
            "Piano": "Piano",
            "Organ": "Orgue",
            "Harpsichord": "Clavecin",
            "Violin": "Violon",
            "Viola": "Alto",
            "Cello": "Violoncelle",
            "Flute": "Flûte",
            "Oboe": "Hautbois",
            "Clarinet": "Clarinette",
            "Bassoon": "Basson",
            "Horn": "Cor",
            "Trumpet": "Trompette",
            "Strings": "Cordes",
            "Orchestra": "Orchestre",
            "Choir": "Chœur",
            "Basso continuo": "Basse continue",
        },
        de: {
            "Piano": "Klavier",
            "Organ": "Orgel",
            "Harpsichord": "Cembalo",
            "Violin": "Violine",
            "Viola": "Viola",
            "Cello": "Violoncello",
            "Flute": "Flöte",
            "Oboe": "Oboe",
            "Clarinet": "Klarinette",
            "Bassoon": "Fagott",
            "Horn": "Horn",
            "Trumpet": "Trompete",
            "Strings": "Streicher",
            "Orchestra": "Orchester",
            "Choir": "Chor",
            "Basso continuo": "Basso continuo"
        },
    },
}

const instrumentationPatterns: Partial<Record<WorkTermLocale, RegExp>> = {}

function getInstrumentationPattern(locale: WorkTermLocale): RegExp | null {
    if (!instrumentationPatterns[locale]) {
        const terms = Object.keys(translations.instrumentation[locale])
            .sort((left, right) => right.length - left.length)
        if (terms.length === 0) return null

        const alternatives = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
        instrumentationPatterns[locale] = new RegExp(
            `(^|[^\\p{L}\\p{N}])(${alternatives})(s?)(?=$|[^\\p{L}\\p{N}])`,
            'giu',
        )
    }
    return instrumentationPatterns[locale] ?? null
}

export function getLocalizedWorkTerm(value: string, kind: WorkTermKind, locale: Locale): string {
    if (locale !== 'zh' && locale !== 'fr' && locale !== 'de') return value
    const dictionary = translations[kind]?.[locale]
    if (!dictionary) return value

    const exactTranslation = dictionary[value.trim()]
    if (exactTranslation) return exactTranslation
    if (kind !== 'instrumentation') return value

    const pattern = getInstrumentationPattern(locale)
    if (!pattern) return value

    const translationsByTerm = new Map(
        Object.entries(dictionary).map(([term, translation]) => [term.toLocaleLowerCase(), translation]),
    )
    return value.replace(pattern, (match, prefix: string, term: string, plural: string) => {
        const translation = translationsByTerm.get(term.toLocaleLowerCase())
        if (!translation) return match
        return `${prefix}${translation}${locale === 'zh' ? '' : plural}`
    })
}
