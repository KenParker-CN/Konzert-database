/**
 * 调性（Key）归一化。
 *
 * 各目录 CSV 中的 Key 字段写法不一，除标准的英文键（如 `C major`、`F-sharp minor`）
 * 外，还混有：
 *   - 德文调性（Brahms/WAB）：`C-Dur`、`fis-Moll`、`H-Dur`
 *   - 缩写降号（Burghauser/Deutsch 等）：`Bb major`、`F# major`、`Eb minor`
 *   - 非标准连字符（Shostakovich）：`B‐sharp minor`（U+2010）
 *   - 教会调式：`Dorian`、`Phrygian`、`lydisch`、`a-aeolisch`、`e-phrygisch`
 *   - 转调 / 复合 / 不确定值：`D minor/F major`、`G minor-Bb major`、`G/F?`、
 *     `C/c`、`F-e-g`、`o` 等
 *
 * 策略：只把能明确归一到标准调性的写法统一（德文、缩写、连字符变体），
 * 教会调式与转调/复合/无意义标记一律**原样返回**，不强行猜测。
 * 该函数为纯 TS，无 server 依赖，可供 client 组件调用。
 */

/** 德文音名 → 英文音名。德文中 B = 降 B（B-flat），H = 自然 B。 */
const DE_PITCH: Record<string, string> = {
    C: 'C', Cis: 'C-sharp', Ces: 'C-flat',
    D: 'D', Dis: 'D-sharp', Des: 'D-flat',
    E: 'E', Eis: 'E-sharp', Es: 'E-flat',
    F: 'F', Fis: 'F-sharp', Fes: 'F-flat',
    G: 'G', Gis: 'G-sharp', Ges: 'G-flat',
    A: 'A', Ais: 'A-sharp', As: 'A-flat',
    B: 'B-flat', His: 'B-sharp', H: 'B',
}

const CHURCH_MODES: Record<string, string> = {
    Dorian: 'Dorian',
    Phrygian: 'Phrygian',
    Lydian: 'Lydian',
    Aeolian: 'Aeolian',
    lydisch: 'Lydian',
    phrygisch: 'Phrygian',
    aeolisch: 'Aeolian',
}

/** 小写键调式表，用于大小写不敏感匹配（如 `Phrygisch`、`Lydisch`）。 */
const CHURCH_MODES_LOWER: Record<string, string> = Object.fromEntries(
    Object.entries(CHURCH_MODES).map(([term, mode]) => [term.toLocaleLowerCase(), mode]),
)

/** 把任意 Unicode 连字符统一为普通连字符。 */
function unifyHyphens(value: string): string {
    return value.replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-')
}

function basePitchLetter(letter: string): string {
    return letter.toUpperCase()
}

/**
 * 归一化一个调性值。无法明确归一的（教会调式、转调、复合、无意义标记）
 * 原样返回。
 */
export function normalizeWorkKey(raw: string | null | undefined): string {
    if (typeof raw !== 'string') return ''
    const value = raw.trim()
    if (!value) return value

    const hyphenated = unifyHyphens(value)

    // 1) 德文调性：`C-Dur` / `fis-Moll` / `H-Dur` / `Es-dur`
    //    德文音名大小写均可（大调用大写、小调用小写，如 a-Moll、as-Moll），
    //    且含 H（德文 H = 自然 B，故范围到 A-H/a-h）；
    //    Dur/Moll 也大小写不敏感（KV 中有 `Es-dur`）。查表前把音名首字母大写。
    const german = /^([A-Ha-h][a-z]*)-?(Dur|Moll)$/i.exec(hyphenated)
    if (german) {
        const pitchKey = german[1][0].toUpperCase() + german[1].slice(1)
        const pitch = DE_PITCH[pitchKey]
        if (pitch) return `${pitch} ${german[2].toLowerCase() === 'dur' ? 'major' : 'minor'}`
    }

    // 2) 缩写升降号：`Bb major` / `F# minor` / `Ab major`
    const abbreviation = /^([A-Ga-g])([b#])\s+(major|minor)$/.exec(hyphenated)
    if (abbreviation) {
        const accidental = abbreviation[2] === 'b' ? 'flat' : 'sharp'
        return `${basePitchLetter(abbreviation[1])}-${accidental} ${abbreviation[3]}`
    }

    // 3) 已经是标准英文键：`C major` / `F-sharp minor` / `G-flat major`
    //    这里也负责把非标准连字符变体（如 Shostakovich 的 `D‐flat major`，U+2010）
    //    统一成普通连字符的标准写法。两分支统一为
    //    [letter, accidental-or-undefined, mode] 的结构。
    const standard = ((): [string, string | undefined, string] | null => {
        const withAccidental = /^([A-Ga-g])-(sharp|flat)\s+(major|minor)$/.exec(hyphenated)
        if (withAccidental) return [withAccidental[1], withAccidental[2], withAccidental[3]]
        const plain = /^([A-Ga-g])\s+(major|minor)$/.exec(hyphenated)
        if (plain) return [plain[1], undefined, plain[2]]
        return null
    })()
    if (standard) {
        const accidental = standard[1] ? `-${standard[1]}` : ''
        return `${basePitchLetter(standard[0])}${accidental} ${standard[2]}`
    }

    // 4) 教会调式：`a-aeolisch` / `e-phrygisch` / `lydisch` / `Dorian` / `Phrygisch`
    const modeWithPitch = /^([A-Ga-g])-?([A-Za-z]+)$/.exec(hyphenated)
    if (modeWithPitch) {
        const mode = CHURCH_MODES_LOWER[modeWithPitch[2].toLocaleLowerCase()]
        if (mode) return `${basePitchLetter(modeWithPitch[1])} ${mode}`
    }
    const bareMode = /^([A-Za-z]+)$/.exec(hyphenated)
    if (bareMode) {
        const mode = CHURCH_MODES_LOWER[bareMode[1].toLocaleLowerCase()]
        if (mode) return mode
    }

    // 5) 其余（转调、复合、不确定、无意义标记等）原样返回
    return value
}

// ---------------------------------------------------------------------------
// 调性排序（音高从低到高）
// ---------------------------------------------------------------------------

/** 半音阶音高表：音名 → 距 C 的半音数。升/降同音（enharmonic）记同一音高。 */
const PITCH_SEMITONES: Record<string, number> = {
    C: 0, 'C-sharp': 1, 'D-flat': 1,
    D: 2, 'D-sharp': 3, 'E-flat': 3,
    E: 4, 'F-flat': 4,
    F: 5, 'F-sharp': 6, 'G-flat': 6,
    G: 7, 'G-sharp': 8, 'A-flat': 8,
    A: 9, 'A-sharp': 10, 'B-flat': 10,
    B: 11, 'C-flat': 11,
}

/** 解析归一化键里的标准根音名（如 `C`、`F-sharp`、`B-flat`），失败返回 null。 */
function parsePitchName(normalized: string): string | null {
    const match = /^([A-G](?:-(?:sharp|flat))?)\s/.exec(normalized)
    return match?.[1] ?? null
}

/**
 * 计算一个归一化键的排序元组 [音高, 调式级, 名称]。
 *   - 标准大小调：音高取根音半音，调式级 大调=0 / 小调=1；
 *   - 带根音的教会调式：音高取根音半音，调式级=2（排在大小调之后）；
 *   - 无根音教会调式、转调、复合、不确定值：音高=99、调式级=99（排最后）。
 */
function workKeySortTuple(normalized: string): [number, number, string] {
    // 标准大小调：根音名（单一音名，不允许空格/斜杠/复合）+ 恰好 major|minor
    const majorMinor = /^([A-G](?:-(?:sharp|flat))?)\s+(major|minor)$/.exec(normalized)
    if (majorMinor) {
        const pitch = PITCH_SEMITONES[majorMinor[1]]
        if (pitch !== undefined) {
            return [pitch, majorMinor[2] === 'major' ? 0 : 1, normalized]
        }
    }
    // 带根音的教会调式
    const modeWithRoot = /^([A-G](?:-(?:sharp|flat))?)\s+(Dorian|Phrygian|Lydian|Aeolian)$/.exec(normalized)
    if (modeWithRoot) {
        const pitch = PITCH_SEMITONES[modeWithRoot[1]]
        if (pitch !== undefined) return [pitch, 2, normalized]
    }
    // 无根音教会调式、转调、复合、不确定值：排最后
    return [99, 99, normalized]
}

/** 按音高从低到高比较两个归一化调性键；音高相同时按名称稳定排序。 */
export function compareWorkKeys(left: string, right: string): number {
    const a = workKeySortTuple(left)
    const b = workKeySortTuple(right)
    if (a[0] !== b[0]) return a[0] - b[0]
    if (a[1] !== b[1]) return a[1] - b[1]
    return a[2].localeCompare(b[2], undefined, {sensitivity: 'base'})
}