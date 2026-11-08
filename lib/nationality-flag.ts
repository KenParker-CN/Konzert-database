export function nationalityFlagCode(code: string) {
    const normalized = code.trim().toLowerCase()
    return /^[a-z]{2}$/.test(normalized) ? normalized : null
}
