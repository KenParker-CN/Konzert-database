export function nationalityFlag(code: string) {
    const normalized = code.trim().toUpperCase()
    if (!/^[A-Z]{2}$/.test(normalized)) return ''
    return String.fromCodePoint(...[...normalized].map(char => 0x1f1e6 + char.charCodeAt(0) - 65))
}
