# Planning Frontend

Interface utilisateur React pour l'application de planning hebdomadaire par quarts d'heure.

## 🚀 Technologies

- **React 18** - Bibliothèque UI moderne
- **TypeScript** - Typage statique
- **Vite** - Build tool rapide
- **Tailwind CSS** - Framework CSS utilitaire
- **Zustand** - Gestion d'état simple et performante
- **TanStack Query** - Gestion des données serveur
- **React DnD** - Drag & drop natif
- **React Hook Form** - Gestion des formulaires
- **Day.js** - Manipulation des dates
- **Vitest** - Tests unitaires

## 📋 Fonctionnalités

- ✅ Interface de planning par grille hebdomadaire
- ✅ Créneaux par quarts d'heure (15 min)
- ✅ Drag & drop pour déplacer les créneaux
- ✅ Création/édition de créneaux par modal
- ✅ Calculs automatiques des totaux
- ✅ Répartition par catégories avec graphiques
- ✅ Sauvegarde automatique avec indicateur
- ✅ Undo/Redo (10 niveaux)
- ✅ Responsive design
- ✅ Accessibilité (ARIA)
- ✅ Gestion des erreurs et états de chargement

## 🏗️ Structure du projet

```
planning-frontend/
├── src/
│   ├── components/          # Composants React
│   │   ├── Header.tsx       # En-tête avec sélecteurs
│   │   ├── PlanningGrid.tsx # Grille principale
│   │   ├── Sidebar.tsx      # Panneau latéral
│   │   └── ...
│   ├── store/              # Store Zustand
│   ├── services/           # Services API
│   ├── utils/              # Utilitaires
│   ├── types/              # Types TypeScript
│   └── test/               # Tests
├── public/                 # Assets statiques
└── dist/                   # Build de production
```

## 🛠️ Installation locale

### Prérequis

- Node.js 18+
- npm ou yarn

### Étapes

1. **Cloner le repository**
```bash
git clone <repo-url>
cd planning-frontend
```

2. **Installer les dépendances**
```bash
npm install
# ou
yarn install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec l'URL de votre API
```

4. **Lancer le serveur de développement**
```bash
npm run dev
# ou
yarn dev
```

L'application sera accessible sur http://localhost:5173

## 🎨 Interface utilisateur

### En-tête
- **Sélecteur d'employé** : Choix parmi les employés actifs
- **Sélecteur de vue** : Semaine type, actuelle, suivante, vacances
- **Sélecteur de période** : Toussaint, Noël, Pâques, Été (pour les vacances)
- **Actions** : Dupliquer, Exporter, Undo/Redo
- **Indicateur de sauvegarde** : État en temps réel

### Grille de planning
- **7 colonnes** : Lundi à Dimanche avec dates
- **Lignes par quarts d'heure** : 9h-22h par défaut (configurable)
- **Créneaux colorés** : Par catégorie avec bordure gauche
- **Drag & drop** : Déplacement intuitif
- **Clic pour créer** : Nouveau créneau sur cellule vide
- **Double-clic pour éditer** : Modal de modification

### Panneau latéral
- **Totaux** : Par jour et semaine, indéterminé
- **Répartition** : Graphiques par catégorie avec %
- **Notes** : Commentaires éditables
- **Légende** : Catégories avec couleurs

## 🎯 Utilisation

### Créer un créneau
1. Sélectionner un employé
2. Cliquer sur une cellule vide de la grille
3. Remplir le formulaire (titre, catégorie, durée, commentaire)
4. Valider

### Modifier un créneau
1. Double-cliquer sur un créneau existant
2. Modifier les informations
3. Valider ou supprimer

### Déplacer un créneau
1. Glisser-déposer le créneau vers une nouvelle position
2. La sauvegarde est automatique

### Navigation
- **Undo/Redo** : Ctrl+Z / Ctrl+Y ou boutons en-tête
- **Changement de vue** : Sélecteurs en en-tête
- **Changement d'employé** : Réinitialise la vue

## 🎨 Catégories et couleurs

| Code | Catégorie | Couleur | Usage |
|------|-----------|---------|-------|
| a | Administratif/gestion | Vert | Tâches administratives |
| p | Prestation/événement | Cyan | Cours, événements |
| e | École d'escalade | Violet | Cours enfants/ados |
| c | Groupes compétition | Rose | Entraînements compétition |
| o | Ouverture | Rouge | Ouverture/fermeture salle |
| l | Loisir | Jaune | Escalade libre |
| m | Mise en place/Rangement | Orange | Préparation matériel |
| s | Santé Adulte/Enfant | Ambre | Escalade thérapeutique |

## 🧪 Tests

```bash
# Lancer tous les tests
npm run test

# Tests en mode watch
npm run test:watch

# Tests avec interface
npm run test:ui

# Coverage
npm run test:coverage
```

## 🏗️ Build et déploiement

```bash
# Build de production
npm run build

# Prévisualiser le build
npm run preview

# Linter
npm run lint
```

Le build génère des fichiers statiques dans `dist/` prêts pour le déploiement.

## 📱 Responsive Design

- **Desktop** : Grille complète avec sidebar
- **Tablet** : Grille adaptée, sidebar en bas
- **Mobile** : Vue simplifiée, navigation par onglets

## ♿ Accessibilité

- **Navigation clavier** : Tab, Enter, Espace
- **Lecteurs d'écran** : ARIA labels et descriptions
- **Contrastes** : Conformité WCAG 2.1 AA
- **Focus visible** : Indicateurs clairs

## 🔧 Configuration

### Variables d'environnement

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_TITLE=Planning Hebdomadaire
VITE_DEFAULT_OPENING_HOUR=9
VITE_DEFAULT_CLOSING_HOUR=22
```

### Personnalisation Tailwind

Modifiez `tailwind.config.js` pour :
- Couleurs des catégories
- Espacements de grille
- Breakpoints responsive

## 🚀 Déploiement GitHub Pages

Voir [GUIDE_DEPLOIEMENT.md](./GUIDE_DEPLOIEMENT.md) pour les instructions détaillées.

## 🔄 Intégration API

L'application communique avec le backend via :
- **REST API** : Endpoints CRUD standard
- **Gestion d'erreurs** : Retry automatique et fallbacks
- **Cache intelligent** : TanStack Query avec invalidation
- **Optimistic updates** : Mise à jour immédiate de l'UI

## 🎯 Performances

- **Code splitting** : Chargement à la demande
- **Lazy loading** : Composants et images
- **Memoization** : React.memo et useMemo
- **Virtualisation** : Pour les grandes listes (si nécessaire)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT."trigger $(date)" 
