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

| Widget         | Réponse               | Pour quoi faire                                        |
| -------------- | --------------------- | ------------------------------------------------------ |
| `number-input` | `{ value }`           | réponse numérique ; `{?}` marque la case dans l'énoncé |
| `mcq`          | `{ selected: [...] }` | choix unique ou multiple, VRAI/FAUX, signes <, >, =    |
| `column-op`    | `{ digits, carries }` | opération posée avec retenues                          |

Les widgets prévus ensuite : `word-select` (souligner, entourer, colorier des mots), `text-input`
(clavier avec accents), `classify` (glisser-déposer), `fill-blank`, `order`, `geometry`,
`number-line`, `clock`, `money`. Un nouveau widget se crée en deux temps : sa logique dans
`packages/core/src/widgets/` (réponse vide, validation, correction), son affichage dans
`apps/web/src/widgets/`.

## Quand incrémenter `version`

Si une même graine ne produit plus la même question (nouveau tirage, nouveaux paramètres),
incrémente `version`. Les tentatives passées restent comptées, mais ne sont plus rejouables à
l'identique. Ajouter un niveau à la fin ne demande pas de changer la version.
