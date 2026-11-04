# Les écoles

L'app reste d'abord un outil pour la maison : l'enfant s'entraîne quand il en a besoin, ou sur
la leçon du moment. Côté école, l'enseignant règle ce qui a été vu en classe, donne si besoin des
devoirs à faire à la maison, imprime des fiches (le papier reste la règle en classe) et suit ses
élèves.

## Qui fait quoi

| Compte                       | Il peut                                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Administrateur de l'instance | créer une école et obtenir le code de sa direction (espace parent, ou `cli.js school`)                           |
| Direction                    | inviter les enseignants, changer leur rôle, les retirer ; gérer toutes les classes et tous les élèves de l'école |
| Enseignant                   | créer ses classes, y ajouter ou retirer des élèves, régler les notions, donner des devoirs, imprimer, évaluer    |
| Parent                       | activer la fiche de son enfant, suivre sa progression, ses devoirs et l'avis de l'enseignant                     |

Un même compte (une adresse e-mail) peut être parent **et** enseignant : un parent déjà inscrit
utilise le code reçu avec « J'ai un code ». Un compte d'enseignant sans enfant n'a pas de famille ;
son espace école ne se verrouille pas (aucun enfant n'utilise son appareil). Un compte qui a aussi
des enfants garde le verrouillage de 10 minutes, pour l'espace parent comme pour l'espace école.

## Un seul profil par enfant

L'enseignant crée ses élèves (un prénom et une initiale suffisent : ni e-mail, ni date de
naissance) puis imprime les **fiches parents** (onglet Élèves) : une par élève, avec un QR code et
un code personnel valable jusqu'au 31 août.

- Le parent scanne le QR code et crée son compte : l'élève rejoint sa famille.
- S'il a déjà un compte (un autre enfant dans l'app), il choisit « J'ai déjà un compte » : l'élève
  rejoint la même famille. Si l'enfant avait déjà un profil à la maison, les deux sont **fusionnés**
  : on garde la progression de la maison, l'enfant entre dans la classe.
- Réimprimer une fiche donne un nouveau code ; l'ancien ne marche plus.

L'enfant a donc une seule progression : l'enseignant voit ce qu'il fait à la maison, le parent voit
les devoirs de la classe et les avis de l'enseignant. Les parents en sont prévenus sur la fiche et
à l'activation.

## Dans la classe

- **Notions** : ☑️ vue en classe (« Tout mélanger » et le défi du jour ne prennent qu'elles ; pour un
  élève inscrit, ce réglage remplace celui du parent) et 📌 en ce moment en classe (proposée en tête
  de la page de l'enfant, et en tête du bilan des parents).
- **Devoirs** : pour toute la classe ou quelques élèves ; le parent ne peut pas les supprimer.
- **Fiches** : une fiche commune au niveau attendu (en plusieurs versions), ou une fiche par élève,
  à son prénom et à son niveau dans l'app ; avec le corrigé ; gabarit entraînement ou évaluation.
- **Évaluations** : après une évaluation sur papier, l'enseignant reporte A / ECA / NA par élève et
  par notion. Le parent voit le dernier avis (🏫) à côté de l'acquisition mesurée dans l'app ;
  une notion ECA ou NA est proposée à l'enfant (« À retravailler ») pendant 6 semaines.
- **Suivi** : questions faites sur 7 jours, dernière activité, devoirs, erreurs à revoir et
  acquisition de la leçon en cours ; un clic ouvre le bilan de l'élève (le même que celui du parent).

## Quand un élève part

- Retiré de la classe (ou classe supprimée) : s'il a une famille, il lui reste, sans les devoirs de
  la classe pas encore faits ; sinon son profil est supprimé, avec sa progression.
- Supprimé par sa famille (ou famille supprimée) : il quitte la famille et reste élève ; l'école peut
  imprimer une nouvelle fiche.

## Plusieurs postes derrière la même adresse

Dans une école, tous les postes (et les parents sur le Wi-Fi d'une réunion) sortent souvent par la
même adresse IP. Les limites en tiennent compte : les essais de mot de passe sont comptés par
compte (`AUTH_ATTEMPTS`, 10 par quart d'heure), les requêtes de connexion et d'activation par
adresse ne sont plafonnées qu'à `AUTH_ATTEMPTS_PER_IP` (300 par quart d'heure), et le reste de
l'app compte par appareil connecté (`REQUESTS_PER_MINUTE`, 600 par minute). Derrière un reverse
proxy, `TRUST_PROXY` doit être réglé : sinon tout le monde a l'adresse du proxy.

## Données personnelles

Avant d'utiliser l'app avec une classe, la direction inscrit ce traitement au registre de l'école
(dans le public, avec l'aide du DPO académique) et informe les familles ; la fiche parent rappelle
ce que voit l'enseignant. L'app ne garde que le strict nécessaire (prénom et initiale, avatar,
classe, réponses aux exercices), sans publicité ni pisteur, sur le serveur de l'établissement.
