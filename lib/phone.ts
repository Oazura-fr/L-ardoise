/**
 * Clé de comparaison d'un numéro français.
 * On garde les 9 derniers chiffres : « 06 17 97 89 01 », « 0617978901 » et
 * « +33 6 17 97 89 01 » donnent tous « 617978901 ». Sans ça, deux écritures du
 * même numéro ne se reconnaissent jamais.
 */
export function phoneKey(p?: string | null): string | null {
  if (!p) return null;
  const d = p.replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : null;
}
