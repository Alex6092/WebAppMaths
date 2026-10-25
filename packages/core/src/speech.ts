/**
 * Transforme une écriture mathématique en phrase à lire à voix haute :
 * « 7 + {?} = 10 » → « 7 plus combien égale 10 ».
 * Les traits d'union des mots (« dix-sept ») sont conservés.
 */
export function mathToSpeech(text: string): string {
  return text
    .replace(/\{\?\}/g, ' combien ')
    .replace(/\s*\+\s*/g, ' plus ')
    .replace(/(\d)\s*[−-]\s*(\d)/g, '$1 moins $2')
    .replace(/\s+[−-]\s+/g, ' moins ')
    .replace(/\s*×\s*/g, ' fois ')
    .replace(/\s*=\s*/g, ' égale ')
    .replace(/\s*<\s*/g, ' est plus petit que ')
    .replace(/\s*>\s*/g, ' est plus grand que ')
    .replace(/…|\.\.\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
