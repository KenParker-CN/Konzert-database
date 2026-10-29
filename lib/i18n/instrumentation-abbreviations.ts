/**
 * Boosey & Hawkes 标准配器缩写（Standard Scoring Abbreviations）。
 * 数据来源：Boosey & Hawkes「BH_StandardAbbreviations_New」官方表
 *   https://www.boosey.com/downloads/BH_StandardAbbreviations_New.pdf
 *
 * 结构：按 B&H 惯例分为 木管 / 铜管 / 打击乐 / 其他 / 人声 / 弦乐 六组。
 * 每组含 四语名称（en/zh/fr/de），组内每条缩写给出对应乐器的四语全称：
 *   - en / fr / de 直接采用 B&H 官方表对应语种栏目
 *   - zh 为本项目补译（B&H 官方表无中文栏）
 * 未收录进标准表的乐器，按 B&H 规则以完整名称写全，不设缩写。
 */

export type InstrumentationAbbrev = {
    abbrev: string
    en: string
    zh: string
    fr: string
    de: string
}

export type InstrumentationAbbrevGroup = {
    key: string
    en: string
    zh: string
    fr: string
    de: string
    items: InstrumentationAbbrev[]
}

export const INSTRUMENTATION_ABBREVIATIONS: InstrumentationAbbrevGroup[] = [
    {
        key: 'woodwind',
        en: 'Woodwind',
        zh: '木管',
        fr: 'Bois',
        de: 'Holzbläser',
        items: [
            {abbrev: 'picc', en: 'Piccolo', zh: '短笛', fr: 'Petite flûte', de: 'Piccoloflöte'},
            {abbrev: 'fl', en: 'Flute', zh: '长笛', fr: 'Grande flûte', de: 'Flöte'},
            {abbrev: 'afl', en: 'Alto flute', zh: '中音长笛', fr: 'Flûte alto', de: 'Altflöte'},
            {abbrev: 'bfl', en: 'Bass flute', zh: '低音长笛', fr: 'Flûte basse', de: 'Bassflöte'},
            {abbrev: 'rec', en: 'Recorder', zh: '竖笛', fr: 'Flûte à bec', de: 'Blockflöte'},
            {abbrev: 'ob', en: 'Oboe', zh: '双簧管', fr: 'Hautbois', de: 'Oboe'},
            {abbrev: 'corA', en: 'Cor anglais', zh: '英国管', fr: 'Cor anglais', de: 'Englischhorn'},
            {abbrev: 'cl', en: 'Clarinet', zh: '单簧管', fr: 'Clarinette', de: 'Klarinette'},
            {abbrev: 'Ebcl', en: 'Clarinet in Eb', zh: '降E调单簧管', fr: 'Petite clarinette en mi bémol', de: 'Es-Klarinette'},
            {abbrev: 'bcl', en: 'Bass clarinet', zh: '低音单簧管', fr: 'Clarinette basse', de: 'Bassklarinette'},
            {abbrev: 'dbcl', en: 'Double bass clarinet', zh: '倍低音单簧管', fr: 'Clarinette contrebasse', de: 'Kontrabassklarinette'},
            {abbrev: 'bhn', en: 'Basset horn', zh: '巴塞特管', fr: 'Cor de basset', de: 'Bassetthorn'},
            {abbrev: 'ssax', en: 'Soprano saxophone', zh: '高音萨克斯管', fr: 'Saxophone soprano', de: 'Sopransaxophon'},
            {abbrev: 'asax', en: 'Alto saxophone', zh: '中音萨克斯管', fr: 'Saxophone alto', de: 'Altsaxophon'},
            {abbrev: 'tsax', en: 'Tenor saxophone', zh: '次中音萨克斯管', fr: 'Saxophone ténor', de: 'Tenorsaxophon'},
            {abbrev: 'barsax', en: 'Baritone saxophone', zh: '上低音萨克斯管', fr: 'Saxophone baryton', de: 'Baritonsaxophon'},
            {abbrev: 'bn', en: 'Bassoon', zh: '巴松管', fr: 'Basson', de: 'Fagott'},
            {abbrev: 'dbn', en: 'Contrabassoon', zh: '倍低音巴松管', fr: 'Contrebasson', de: 'Kontrafagott'},
        ],
    },
    {
        key: 'brass',
        en: 'Brass',
        zh: '铜管',
        fr: 'Cuivres',
        de: 'Blechbläser',
        items: [
            {abbrev: 'hn', en: 'Horn', zh: '圆号', fr: 'Cor', de: 'Horn'},
            {abbrev: 'thn', en: 'Tenor horn', zh: '次中音号', fr: 'Cor ténor', de: 'Tenorhorn'},
            {abbrev: 'crt', en: 'Cornet', zh: '短号', fr: 'Cornet', de: 'Kornett'},
            {abbrev: 'flgn', en: 'Flugelhorn', zh: '富鲁格号', fr: 'Bugle', de: 'Flügelhorn'},
            {abbrev: 'tpt', en: 'Trumpet', zh: '小号', fr: 'Trompette', de: 'Trompete'},
            {abbrev: 'picc.tpt', en: 'Piccolo trumpet', zh: '高音小号', fr: 'Trompette piccolo', de: 'Piccolotrompete'},
            {abbrev: 'atpt', en: 'Alto trumpet', zh: '中音小号', fr: 'Trompette alto', de: 'Altrompete'},
            {abbrev: 'btpt', en: 'Bass trumpet', zh: '低音小号', fr: 'Trompette basse', de: 'Basstrompete'},
            {abbrev: 'trbn', en: 'Trombone', zh: '长号', fr: 'Trombone', de: 'Posaune'},
            {abbrev: 'atrbn', en: 'Alto trombone', zh: '中音长号', fr: 'Trombone alto', de: 'Altposaune'},
            {abbrev: 'ttrbn', en: 'Tenor trombone', zh: '次中音长号', fr: 'Trombone ténor', de: 'Tenorposaune'},
            {abbrev: 'btrbn', en: 'Bass trombone', zh: '低音长号', fr: 'Trombone basse', de: 'Bassposaune'},
            {abbrev: 'euph', en: 'Euphonium', zh: '上低音号', fr: 'Euphonium', de: 'Euphonium'},
            {abbrev: 'ttuba', en: 'Tenor tuba', zh: '次中音大号', fr: 'Tuba ténor', de: 'Tenortuba'},
        ],
    },
    {
        key: 'percussion',
        en: 'Percussion',
        zh: '打击乐',
        fr: 'Percussion',
        de: 'Schlagwerk',
        items: [
            {abbrev: 'perc', en: 'Percussion', zh: '打击乐', fr: 'Percussion', de: 'Schlagwerk'},
            {abbrev: 'BD', en: 'Bass drum', zh: '大鼓', fr: 'Grosse caisse', de: 'Große Trommel'},
            {abbrev: 'bl', en: 'Block', zh: '木鱼', fr: 'Block', de: 'Block'},
            {abbrev: 'cast', en: 'Castanets', zh: '响板', fr: 'Castagnettes', de: 'Kastagnetten'},
            {abbrev: 'Chin.bl', en: 'Chinese block', zh: '中国木鱼', fr: 'Bloc chinois', de: 'Chinesischer Block'},
            {abbrev: 'crot', en: 'Crotales', zh: '古钹', fr: 'Crotales', de: 'Crotales'},
            {abbrev: 'cyms', en: 'Cymbals (clashed)', zh: '铜钹', fr: 'Cymbales', de: 'Becken'},
            {abbrev: 'dr', en: 'Drum', zh: '鼓', fr: 'Tambour', de: 'Trommel/Drum'},
            {abbrev: 'flex', en: 'Flexatone', zh: '音叉琴', fr: 'Flexatone', de: 'Flexaton'},
            {abbrev: 'glsp', en: 'Glockenspiel', zh: '钢片琴', fr: 'Glockenspiel', de: 'Glockenspiel'},
            {abbrev: 'h.bells', en: 'Hand bells', zh: '手铃', fr: 'Clochette', de: 'Handglocken'},
            {abbrev: 'SD', en: 'Side drum', zh: '小军鼓', fr: 'Caisse claire', de: 'Kleine Trommel'},
            {abbrev: 'susp.cym', en: 'Suspended cymbal', zh: '吊钹', fr: 'Cymbale suspendue', de: 'Hängendes Becken'},
            {abbrev: 'tamb', en: 'Tambourine', zh: '铃鼓', fr: 'Tambour de basque', de: 'Tamburin'},
            {abbrev: 'tam-t', en: 'Tam-tam', zh: '锣', fr: 'Tam-tam', de: 'Tamtam'},
            {abbrev: 't.bells', en: 'Tubular bells', zh: '管钟', fr: 'Cloches tubulaires', de: 'Röhrenglocken'},
            {abbrev: 'TD', en: 'Tenor drum', zh: '中音鼓', fr: 'Caisse roulante', de: 'Wirbeltrommel'},
            {abbrev: 'tgl', en: 'Triangle', zh: '三角铁', fr: 'Triangle', de: 'Triangel'},
            {abbrev: 'timp', en: 'Timpani', zh: '定音鼓', fr: 'Timbales', de: 'Pauken'},
            {abbrev: 'tom-t', en: 'Tom-toms', zh: '嗵嗵鼓', fr: 'Tom-toms', de: 'Tomtoms'},
            {abbrev: 'tpl.bl', en: 'Temple block', zh: '木鱼', fr: 'Temple block', de: 'Tempelblock'},
            {abbrev: 'vib', en: 'Vibraphone', zh: '颤音琴', fr: 'Vibraphone', de: 'Vibraphon'},
            {abbrev: 'wdbl', en: 'Wood block', zh: '木鱼', fr: 'Woodblock', de: 'Holzblock'},
            {abbrev: 'xyl', en: 'Xylophone', zh: '木琴', fr: 'Xylophone', de: 'Xylophon'},
        ],
    },
    {
        key: 'others',
        en: 'Others',
        zh: '其他',
        fr: 'Divers',
        de: 'Sonstiges',
        items: [
            {abbrev: 'ampl', en: 'Amplified', zh: '扩音', fr: 'Amplifié', de: 'Verstärkt'},
            {abbrev: 'cel', en: 'Celesta', zh: '钢片琴', fr: 'Célesta', de: 'Celesta'},
            {abbrev: 'elec', en: 'Electric (e.g. guitar)', zh: '电声（如电吉他）', fr: 'Électrique', de: 'Elektrisch'},
            {abbrev: 'gtr', en: 'Guitar', zh: '吉他', fr: 'Guitare', de: 'Gitarre'},
            {abbrev: 'harm', en: 'Harmonium', zh: '簧风琴', fr: 'Harmonium', de: 'Harmonium'},
            {abbrev: 'hpd', en: 'Harpsichord', zh: '羽管键琴', fr: 'Clavecin', de: 'Cembalo'},
            {abbrev: 'kbd', en: 'Keyboard', zh: '键盘', fr: 'Keyboard', de: 'Keyboard'},
            {abbrev: 'mand', en: 'Mandolin', zh: '曼陀铃', fr: 'Mandoline', de: 'Mandoline'},
            {abbrev: 'org', en: 'Organ', zh: '管风琴', fr: 'Orgue', de: 'Orgel'},
            {abbrev: 'pft', en: 'Piano', zh: '钢琴', fr: 'Piano', de: 'Klavier'},
            {abbrev: 'synth', en: 'Synthesiser', zh: '合成器', fr: 'Synthétiseur', de: 'Synthesizer'},
        ],
    },
    {
        key: 'voices',
        en: 'Voices',
        zh: '人声',
        fr: 'Voix',
        de: 'Stimmen',
        items: [
            {abbrev: 'S', en: 'Soprano', zh: '女高音', fr: 'Soprano', de: 'Sopran'},
            {abbrev: 'colS', en: 'Coloratura soprano', zh: '花腔女高音', fr: 'Soprano léger', de: 'Koloratursopran'},
            {abbrev: 'dramS', en: 'Dramatic soprano', zh: '戏剧女高音', fr: 'Soprano dramatique', de: 'Dramatischer Sopran'},
            {abbrev: 'hS', en: 'High soprano', zh: '高音女高音', fr: 'Soprano aigu', de: 'Hoher Sopran'},
            {abbrev: 'lyrS', en: 'Lyric soprano', zh: '抒情女高音', fr: 'Soprano lyrique', de: 'Lyrischer Sopran'},
            {abbrev: 'M', en: 'Mezzo-soprano', zh: '女中音', fr: 'Mezzo-soprano', de: 'Mezzosopran'},
            {abbrev: 'A', en: 'Alto/contralto', zh: '女低音', fr: 'Alto', de: 'Alt'},
            {abbrev: 'CT', en: 'Countertenor', zh: '假声男高音', fr: 'Contreténor', de: 'Countertenor'},
            {abbrev: 'T', en: 'Tenor', zh: '男高音', fr: 'Ténor', de: 'Tenor'},
            {abbrev: 'Bar', en: 'Baritone', zh: '男中音', fr: 'Baryton', de: 'Bariton'},
            {abbrev: 'B', en: 'Bass', zh: '男低音', fr: 'Basse', de: 'Bass'},
        ],
    },
    {
        key: 'strings',
        en: 'Strings',
        zh: '弦乐',
        fr: 'Cordes',
        de: 'Streichinstrumente',
        items: [
            {abbrev: 'vln', en: 'Violin', zh: '小提琴', fr: 'Violon', de: 'Violine'},
            {abbrev: 'vla', en: 'Viola', zh: '中提琴', fr: 'Alto', de: 'Viola'},
            {abbrev: 'vlc', en: 'Cello', zh: '大提琴', fr: 'Violoncelle', de: 'Violoncello'},
            {abbrev: 'db', en: 'Double bass', zh: '低音提琴', fr: 'Contrebasse', de: 'Kontrabass'},
        ],
    },
]
