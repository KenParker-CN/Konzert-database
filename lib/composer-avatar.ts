const composerAvatarFiles: Record<string, string> = {
    'antonio-vivaldi': 'vivaldi.png',
    'arcangelo-corelli': 'corelli.png',
    'dmitri-shostakovich': 'shostakovich.png',
    'felix-mendelssohn': 'mendelssohn.png',
    'george-frideric-handel': 'handel.png',
    'johann-sebastian-bach': 'jsbach.png',
    'jean-philippe-rameau': 'rameau.png',
    'joseph-haydn': 'haydn.png',
    'maurice-ravel': 'ravel.png',
    'pyotr-ilyich-tchaikovsky': 'tchaikovsky.png',
    'wolfgang-amadeus-mozart': 'mozart.png',
}

export function getComposerAvatarSource(slug: string): string | null {
    const fileName = composerAvatarFiles[slug]
    return fileName ? `/src/composer/${fileName}` : null
}
