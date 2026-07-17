/**
 * Assainit un texte avant de le dessiner avec les polices standard de pdf-lib.
 *
 * POURQUOI : les StandardFonts utilisent l'encodage WinAnsi, qui ne code qu'un
 * jeu restreint de caracteres. Tout caractere hors jeu fait LEVER une exception
 * a drawText -> la route PDF renvoie 500 et le document n'existe pas du tout.
 *
 * Deux pieges rencontres en production :
 *  1. euros() (toLocaleString fr-FR) separe les milliers par U+202F, une espace
 *     fine insecable -> TOUTE somme >= 1 000 EUR faisait planter la generation.
 *  2. Les champs libres (motif, prenom, adresse) contiennent n'importe quoi :
 *     emoji, cyrillique, turc... -> plantage aussi.
 *
 * REGLE ABSOLUE : jamais de caractere special ecrit en clair dans ce fichier,
 * uniquement des echappements. La premiere version les listait en litteral ;
 * ils ont ete ecrases en espaces normales lors d'une reecriture du fichier, et
 * le garde-fou ne servait plus a rien, sans aucun signal.
 *
 * On ne convertit pas que les cas connus (liste toujours incomplete) : on RETIRE
 * tout ce qui reste hors WinAnsi.
 */

// Espaces exotiques. U+202F = separateur de milliers du format fr-FR.
const ESPACES = /[\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u200B\u202F\u205F\u3000\u2060\u2011\uFEFF]/g;

// Caracteres codables par WinAnsi en plus de l'ASCII et du Latin-1.
const WINANSI_EXTRAS = "\u20AC\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178";

const HORS_WINANSI = new RegExp(
  "[^\\u0020-\\u007E\\u00A0-\\u00FF" + WINANSI_EXTRAS + "]",
  "g"
);

export function cleanPdfText(s: string): string {
  return (s ?? "")
    .normalize("NFC")
    .replace(ESPACES, " ")
    .replace(/[\u2018\u2019\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201F\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\u2026/g, "...")
    // Hors WinAnsi : on tente d abord une translitteration (I turc -> I, s
    // polonais -> s...). Effacer le nom d une partie d un acte serait pire que tout.
    .replace(HORS_WINANSI, (ch) => {
      const base = ch.normalize("NFD").replace(/[\u0300-\u036F]/g, "");
      return /^[\u0020-\u007E\u00A0-\u00FF]*$/.test(base) ? base : "";
    })
    .replace(/ {2,}/g, " ")
    .trim();
}
