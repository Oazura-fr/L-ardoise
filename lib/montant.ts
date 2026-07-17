/** Formatage et conversion des montants pour L'Ardoise. Montants stockés en CENTIMES. */

export function euros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

/** Montant en toutes lettres (français). `n` est un nombre ENTIER (pas des centimes). */
export function enLettres(n: number): string {
  n = Math.floor(n);
  if (n === 0) return "zéro";
  const u = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
    "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
    "dix-sept", "dix-huit", "dix-neuf"];
  const t = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "", "quatre-vingt", ""];

  // `final` = rien ne suit ce groupe. « cent » et « quatre-vingt » ne prennent le
  // « s » QUE s'ils terminent le nombre : « quatre-vingts » mais « quatre-vingt
  // mille », « trois cents » mais « trois cent mille ».
  const b100 = (x: number, final: boolean): string => {
    if (x < 20) return u[x];
    const d = Math.floor(x / 10), r = x % 10;
    if (d === 7 || d === 9) {
      return (d === 7 ? "soixante" : "quatre-vingt") + (r === 1 && d === 7 ? "-et-" : "-") + u[10 + r];
    }
    const w = t[d];
    if (r === 0) return d === 8 ? (final ? "quatre-vingts" : "quatre-vingt") : w;
    if (r === 1 && d >= 2 && d <= 6) return w + "-et-un";
    return w + "-" + u[r];
  };

  const b1000 = (x: number, final: boolean): string => {
    const c = Math.floor(x / 100), r = x % 100;
    let s = "";
    if (c > 0) { s = c === 1 ? "cent" : u[c] + " cent"; if (r === 0 && c > 1 && final) s += "s"; }
    if (r > 0) s = (s ? s + " " : "") + b100(r, final);
    return s;
  };

  const out: string[] = [];
  const mi = Math.floor(n / 1_000_000); n %= 1_000_000;
  const k = Math.floor(n / 1000), r = n % 1000;
  if (mi > 0) out.push(mi === 1 ? "un million" : b1000(mi, false) + " millions");
  if (k > 0) out.push(k === 1 ? "mille" : b1000(k, false) + " mille");
  if (r > 0) out.push(b1000(r, true));
  return out.join(" ");
}

/**
 * Montant en toutes lettres à partir des CENTIMES, centimes compris.
 *
 * C'est CETTE fonction qu'il faut utiliser sur les documents : le PDF affirme
 * qu'en cas de différence, la somme en toutes lettres prévaut (art. 1376). Une
 * version qui tronque les centimes annule donc jusqu'à 0,99 € de la dette.
 */
export function enLettresEuros(cents: number): string {
  const e = Math.floor(cents / 100);
  const c = cents % 100;
  const partEuros = `${enLettres(e)} ${e > 1 ? "euros" : "euro"}`;
  if (c === 0) return partEuros;
  return `${partEuros} et ${enLettres(c)} ${c > 1 ? "centimes" : "centime"}`;
}

/** Seuil au-dessus duquel on incite fortement à la signature avancée eIDAS. */
export const SEUIL_SIGNATURE_AVANCEE_CENTS = 20000; // 200 €

/** Prix facturé pour une signature électronique avancée (eIDAS), ajouté à la dette.
 *  ~3× le coût de revient réel (~2 € chez Yousign) → marge. */
export const ADV_FEE_CENTS = 600; // 6 €

/** Bornes de montant autorisées. */
export const MIN_CENTS = 100; // 1 €
export const MAX_CENTS = 1_000_000_000; // 10 000 000 €
