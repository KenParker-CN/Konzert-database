export const composerCatalogMap: Record<string, string> = {
  'johan-sebastian-bach': 'BWV',
  'wolfgang-amadeus-mozart': 'KV',
  'joseph-haydn': 'Hob',
  'george-federic-handel': 'HWV',
  'antonio-vivaldi': 'RV',
  'georg-philipp-telemann': 'TWV',
  'carl-philipp-emanuel-bach': 'CPE',
  'maurice-ravel': 'Marnat',
};

export function getCatalogForComposer(composerSlug: string): string | undefined {
  return composerCatalogMap[composerSlug];
}