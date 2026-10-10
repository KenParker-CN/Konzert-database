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
  'dmitri-shostakovich': 'shosta',
};

// Catalogues to hide from the catalogue directory page
export const hiddenCatalogues = new Set(['shosta']);

export function getCatalogForComposer(composerSlug: string): string | undefined {
  return composerCatalogMap[composerSlug];
}