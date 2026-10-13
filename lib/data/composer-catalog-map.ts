export const composerCatalogMap: Record<string, string> = {
  'johann-sebastian-bach': 'BWV',
  'wolfgang-amadeus-mozart': 'KV',
  'joseph-haydn': 'Hob',
  'george-frideric-handel': 'HWV',
  'antonio-vivaldi': 'RV',
  'georg-philipp-telemann': 'TWV',
  'carl-philipp-emanuel-bach': 'CPE',
  'maurice-ravel': 'Marnat',
  'jean-baptiste-lully': 'LWV',
  'arcangelo-corelli': 'Corelli',
  'dieterich-buxtehude': 'BuxWV',
  'franz-schubert': 'Deutsch',
  'jean-philippe-rameau': 'RCT',
  'felix-mendelssohn': 'MWV',
  'dmitri-shostakovich': 'Shostakovich',
  'pyotr-ilyich-tchaikovsky': 'Tchaikovsky',
};

export function getCatalogForComposer(composerSlug: string): string | undefined {
  return composerCatalogMap[composerSlug];
}