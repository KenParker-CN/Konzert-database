export function getGenreV2Slug(name: string) {
    return name.toLocaleLowerCase('en').replace(/\s+/g, '-')
}
