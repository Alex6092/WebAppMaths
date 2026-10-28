# Ajouter un exercice

Un exercice est un **plugin** : un dossier avec un fichier `plugin.ts`, rangé selon son chemin
`packages/content/src/<matière>/<domaine>/<nom>/plugin.ts`. Le registre se régénère tout seul :
déposer le dossier suffit pour que l'exercice apparaisse dans l'app.

## Comment le contenu est organisé

```
Classe (CP, CE1…)
 └ Matière (maths, francais, qlm, anglais)          packages/content/src/catalog/subjects.ts
    └ Domaine (maths.calcul, francais.conjugaison)  packages/content/src/<matière>/domains.ts
       └ Notion : l'acquisition est suivie ici       packages/content/src/<matière>/domains.ts
          └ Type d'exercice (plugin) et ses niveaux  packages/content/src/<matière>/<domaine>/<nom>/plugin.ts
```

Une **notion** correspond à une ligne de compétence des évaluations (« Identifier le verbe conjugué
dans une phrase »). Plusieurs exercices peuvent entraîner la même notion.

## Les étapes

1. **Déclarer la notion** (si elle n'existe pas) dans `packages/content/src/<matière>/domains.ts` :

   ```ts
   {
     id: 'francais.conjugaison.infinitif',
     domain: 'francais.conjugaison',
     title: 'Distinguer infinitif et verbe conjugué',
     grades: ['CE1'],
     competence: 'Distinguer verbes à l’infinitif et verbes conjugués.',
     lesson: 'Le verbe à l’infinitif n’est pas conjugué : jouer, finir, prendre…',
   },
   ```

2. **Créer le squelette** :

   ```bash
   npm run new:exercise -- francais/conjugaison/infinitif-colorie --widget mcq --notion francais.conjugaison.infinitif --title "Colorie les verbes à l'infinitif"
   ```

3. **Écrire `generate` et `solve`**, puis ajuster les niveaux (voir le modèle ci-dessous).

4. **Tester** : `npm test`. Le _test de contrat_ génère 500 questions par niveau et vérifie que
   la bonne réponse est acceptée, qu'une réponse vide est refusée, que la génération est
   déterministe et assez variée, et que les contraintes du niveau (`invariants`) sont respectées.

5. **Relire à l'écran** : `npm run dev`, puis ouvrir `#/dev/gallery` (aussi disponible en
   production pour l'administrateur, depuis l'espace parent).

6. **Livrer** : pull request vers `main` → CI verte → fusion → déploiement automatique au lycée.

## Le contrat d'un plugin

```ts
import { defineLevels, definePlugin } from '@app/core';

interface Params {
  max: number;
}

export default definePlugin('number-input', {
  id: 'maths.calcul.calcul-mental', // = chemin du dossier avec des points ; ne change plus jamais
  version: 1, // +1 si le générateur change de sens
  title: 'Calcul mental',
  notions: ['maths.calcul.mental'],
  expectedLevel: 2, // niveau attendu en fin d'année
  levels: defineLevels<Params>([
    { label: 'Jusqu’à 10', grade: 'CP', params: { max: 10 } },
    { label: 'Jusqu’à 100', grade: 'CE1', params: { max: 100 } },
  ]),
  generate({ rng, params }) {
    // PUR : uniquement rng, jamais Math.random ni Date
    const a = rng.int(1, params.max);
    return {
      widget: 'number-input',
      instruction: 'CALCULE.',
      prompt: `${a} + 1 = {?}`,
      data: { expected: a + 1 },
    };
  },
  solve: (q) => ({ value: String(q.data.expected) }), // obligatoire
  explain: (q) => `Le nombre qui suit ${q.data.expected - 1} est ${q.data.expected}.`, // facultatif
  invariants: (q, { params }) => (q.data.expected > params.max + 1 ? 'trop grand' : undefined), // facultatif
});
```

- `data` contient les informations privées du plugin (la réponse attendue, les nombres tirés…).
  La question entière doit rester du JSON : elle est stockée, rejouée et recorrigée par le serveur.
- `check` est facultatif : par défaut, le widget compare la réponse donnée à celle de `solve`.
- La consigne reprend le verbe d'action en majuscules, comme à l'école : COLORIE, SOULIGNE,
  ENTOURE, COCHE, COMPLÈTE, CALCULE.
- Le niveau de départ d'un enfant est le premier niveau de sa classe (`grade`).

## Les widgets disponibles

| Widget          | Réponse                     | Pour quoi faire                                             |
| --------------- | --------------------------- | ----------------------------------------------------------- |
| `number-input`  | `{ value }`                 | réponse numérique ; `{?}` marque la case dans l'énoncé      |
| `mcq`           | `{ selected: [...] }`       | choix unique ou multiple, VRAI/FAUX ; `{?}` montre le choix |
| `column-op`     | `{ digits, carries }`       | opération posée avec retenues                               |
| `word-select`   | `{ picks: [...] }`          | COLORIE, SOULIGNE, ENTOURE des mots (grille ou phrase)      |
| `classify`      | `{ placed: [...] }`         | ranger des étiquettes en colonnes, ou COCHE en tableau      |
| `fill-blank`    | `{ values: [...] }`         | trous à étiquettes ou à taper (clavier AZERTY accentué)     |
| `geometry`      | `{ picked, drawn, placed }` | figure : ENTOURE, TRACE entre deux points, PLACE des points |
| `comprehension` | `{ selected: [...] }`       | une histoire à écouter, puis une réponse par question       |

Pour `fill-blank`, une réponse tapée est comptée fausse s'il manque un accent, mais l'enfant voit
« Attention aux accents » et garde ce qu'il a tapé pour le deuxième essai. Quand plusieurs réponses
conviennent, écris un `check` avec `compareBlanks(q, [[...réponses admises du trou 0], ...], answer)`.
Un trou `{ kind: 'text', digits: true }` attend un nombre, tapé au pavé numérique ; avec
`upper: true`, les lettres s'écrivent en capitales (noms de points). Les nombres en lettres
viennent de `lib/lettres.ts` (orthographe traditionnelle de la classe : deux cent trente et un).

Une **figure** de géométrie (`Figure` : points, segments, traits libres, longueurs écrites) se
décrit en centimètres. Elle s'affiche dans `geometry`, mais aussi au-dessus d'un `mcq`, d'un
`fill-blank` ou d'un `number-input` (champ `figure`). Avec `ruler: true`, l'enfant a une règle
graduée à déplacer et tourner ; son 0 et son bord s'aimantent sur les points. Pour `geometry`,
un point placé est juste à `tolerance` près (0,3 cm par défaut) ; quand plusieurs places
conviennent (« PLACE D aligné avec A et B »), écris un `check` avec
`checkGeometry(q, solve(q), answer, { placed: (p) => … })`. Les figures se fabriquent avec
`maths/lib/geometrie.ts`.

Les phrases de français se fabriquent avec `francais/lib/` : moteur de conjugaison (présent,
imparfait, futur), banques de verbes, de sujets, d'indicateurs de temps, et `buildSentence`.

Les widgets prévus ensuite : `order`, `number-line`, `clock`, `money`. Un nouveau
widget se crée en deux temps : sa logique dans `packages/core/src/widgets/` (réponse vide,
validation, correction), son affichage dans `apps/web/src/widgets/`.

## Ajouter une histoire à écouter

Les histoires de « Écoute une histoire » (Langage oral) sont dans
`packages/content/src/francais/lib/histoires/`, une par fichier, puis ajoutées à `STORIES` dans
`index.ts`. Une histoire a un niveau (1 et 2 au CP, 3 au CE1, 4 au CE2), ses paragraphes et une
liste de questions, dont l'exercice tire quelques-unes à chaque fois. « Lis et comprends »
(Lecture) reprend les mêmes histoires une classe plus tard (niveau 2 au CE1, 3 au CE2) ; au CP,
elle a ses propres petits textes, de niveau 0, dans `lecture-cp.ts`. Il faut au moins six
histoires par niveau :

```ts
{
  ask: 'Où vivent les trois ours ?',
  answer: '🌲 dans la forêt', // un emoji devant devient l'image du choix (obligatoire au niveau 1)
  wrong: ['🏖️ au bord de la mer', '🏙️ en ville'],
  proof: 'au milieu de la forêt', // un morceau de LA phrase qui donne la réponse
},
{ claim: 'Boucle d’or s’endort dans le grand lit.', truth: false, proof: 'le petit lit est juste' },
```

`why: true` marque un « pourquoi ? » ou un sentiment : il en faut au moins un à partir du CE1.
Après la correction, l'enfant relit l'histoire avec les phrases `proof` surlignées. Le test
`histoires.test.ts` vérifie la longueur de chaque niveau, que chaque `proof` ne se trouve que dans
une phrase et qu'aucune phrase ne dépasse ce que la voix dit d'un trait. Les contes doivent être
libres de droits (Grimm, Perrault, Andersen, contes traditionnels), racontés sans ce que les films
y ont ajouté.

Un exercice trop long pour un mélange (comme une histoire) déclare `inMix: false` : il ne vient
ni dans « Tout mélanger », ni dans le défi du jour, ni dans les révisions ; un devoir le garde.

## Un nouvel emoji ?

Les emoji sont embarqués dans l'app (police `apps/web/src/emoji/`) pour s'afficher pareil sur
toutes les tablettes, même anciennes. Après avoir utilisé un nouvel emoji, lance
`npm run gen:emoji` (il faut Python avec `pip install fonttools brotli`) et commite le résultat.
Le test `scripts/emoji.test.ts` le rappelle si on l'oublie.

## Quand incrémenter `version`

Si une même graine ne produit plus la même question (nouveau tirage, nouveaux paramètres),
incrémente `version`. Les tentatives passées restent comptées, mais ne sont plus rejouables à
l'identique. Ajouter un niveau à la fin ne demande pas de changer la version.
