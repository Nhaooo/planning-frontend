# Guide de Déploiement Frontend - GitHub Pages

Ce guide vous accompagne pas-à-pas pour déployer le frontend React sur GitHub Pages avec déploiement automatique.

## 📋 Prérequis

- Repository GitHub avec le code frontend
- GitHub Actions activées
- Backend déployé sur Render (voir guide backend)

## 🚀 Étape 1 : Préparation du Repository

### 1.1 Structure requise

Assurez-vous que votre repository contient :
```
planning-frontend/
├── src/                    # Code source React
├── public/                 # Assets statiques
├── .github/workflows/      # GitHub Actions
├── package.json           # Dépendances Node.js
├── vite.config.ts         # Configuration Vite
├── tailwind.config.js     # Configuration Tailwind
└── README.md              # Documentation
```

### 1.2 Configuration Vite pour GitHub Pages

Vérifiez que `vite.config.ts` contient :
```typescript
export default defineConfig({
  plugins: [react()],
  base: './', // Important pour GitHub Pages
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

## ⚙️ Étape 2 : Configuration GitHub Pages

### 2.1 Activer GitHub Pages

1. Allez dans votre repository GitHub
2. **Settings** → **Pages**
3. **Source** : Sélectionnez **"GitHub Actions"**
4. Cliquez sur **"Save"**

### 2.2 Configurer les variables d'environnement

1. **Settings** → **Secrets and variables** → **Actions**
2. Onglet **"Variables"**
3. Ajoutez :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `VITE_API_BASE_URL` | `https://planning-backend-xxxx.onrender.com/api/v1` | URL de votre backend |
| `VITE_APP_TITLE` | `Planning Hebdomadaire` | Titre de l'application |
| `VITE_DEFAULT_OPENING_HOUR` | `9` | Heure d'ouverture par défaut |
| `VITE_DEFAULT_CLOSING_HOUR` | `22` | Heure de fermeture par défaut |

## 🔧 Étape 3 : GitHub Actions

### 3.1 Workflow de déploiement

Le fichier `.github/workflows/deploy.yml` est déjà configuré pour :
- ✅ Installer les dépendances
- ✅ Lancer les tests
- ✅ Lancer le linter
- ✅ Builder l'application
- ✅ Déployer sur GitHub Pages

### 3.2 Permissions requises

Vérifiez que le workflow a les bonnes permissions :
```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

## 🚀 Étape 4 : Premier Déploiement

### 4.1 Déclencher le déploiement

1. Commitez et poussez vos changements sur `main` :
   ```bash
   git add .
   git commit -m "Initial deployment setup"
   git push origin main
   ```

2. Le déploiement se lance automatiquement

### 4.2 Suivre le déploiement

1. Allez dans **Actions** de votre repository
2. Cliquez sur le workflow **"Deploy to GitHub Pages"**
3. Suivez les étapes en temps réel

### 4.3 Vérifier le déploiement

Une fois terminé, votre site sera accessible à :
```
https://yourusername.github.io/planning-frontend
```

Ou si c'est votre repository principal :
```
https://yourusername.github.io
```

## 🌐 Étape 5 : Configuration du Domaine (Optionnel)

### 5.1 Domaine personnalisé

1. **Settings** → **Pages**
2. **Custom domain** : Entrez votre domaine
3. Cochez **"Enforce HTTPS"**

### 5.2 Configuration DNS

Ajoutez ces enregistrements DNS :
```
Type: CNAME
Name: www
Value: yourusername.github.io

Type: A
Name: @
Value: 185.199.108.153
Value: 185.199.109.153
Value: 185.199.110.153
Value: 185.199.111.153
```

## 🔄 Étape 6 : Déploiement Automatique

### 6.1 Déploiement sur push

Le déploiement se fait automatiquement à chaque push sur `main`.

### 6.2 Déploiement sur Pull Request

Les PR déclenchent aussi le build (sans déploiement) pour vérifier que tout fonctionne.

### 6.3 Déploiement manuel

Pour déclencher manuellement :
1. **Actions** → **Deploy to GitHub Pages**
2. **Run workflow** → **Run workflow**

## 📊 Étape 7 : Monitoring et Analytics

### 7.1 GitHub Insights

Consultez les statistiques dans :
- **Insights** → **Traffic** : Visiteurs et pages vues
- **Insights** → **Actions** : Historique des déploiements

### 7.2 Google Analytics (Optionnel)

Ajoutez Google Analytics dans `index.html` :
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🔐 Étape 8 : Sécurité et Performance

### 8.1 HTTPS

GitHub Pages force automatiquement HTTPS.

### 8.2 Headers de sécurité

Ajoutez un fichier `public/_headers` :
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 8.3 Cache et Performance

Optimisations automatiques :
- ✅ Compression Gzip
- ✅ Cache des assets
- ✅ CDN global GitHub

## 🚨 Dépannage

### Problème : Build échoue

**Vérifiez :**
1. Les logs dans Actions
2. La syntaxe de `package.json`
3. Les variables d'environnement

**Solutions courantes :**
```bash
# Localement, testez le build
npm run build

# Vérifiez les dépendances
npm ci
npm audit fix
```

### Problème : Page blanche

**Causes possibles :**
1. Erreur JavaScript (vérifiez la console)
2. Mauvaise configuration de `base` dans Vite
3. Ressources non trouvées

**Solution :**
```typescript
// vite.config.ts
export default defineConfig({
  base: './', // ou '/repository-name/' si sous-dossier
})
```

### Problème : API non accessible

**Vérifiez :**
1. L'URL de l'API dans les variables d'environnement
2. Les CORS côté backend
3. Que le backend Render est actif

**Test :**
```bash
# Testez l'API directement
curl https://planning-backend-xxxx.onrender.com/api/v1/health
```

### Problème : Déploiement lent

**Causes :**
1. Cache npm non utilisé
2. Dépendances lourdes
3. Build non optimisé

**Optimisations :**
```yaml
# Dans le workflow
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

## 📈 Optimisations Avancées

### Performance

1. **Code splitting** : Déjà configuré avec Vite
2. **Lazy loading** : Implémentez pour les routes
3. **Service Worker** : Pour le cache offline

### SEO

1. **Meta tags** : Ajoutez dans `index.html`
2. **Sitemap** : Générez automatiquement
3. **Robots.txt** : Configurez dans `public/`

### Monitoring

1. **Sentry** : Pour le tracking d'erreurs
2. **Lighthouse CI** : Pour les audits automatiques
3. **Bundle analyzer** : Pour optimiser la taille

## 🔄 Workflow de Développement

### Développement local

```bash
# Installation
npm install

# Développement
npm run dev

# Tests
npm run test

# Build local
npm run build
npm run preview
```

### Branches et déploiement

1. **`develop`** : Développement en cours
2. **`main`** : Production (déploiement automatique)
3. **Feature branches** : Nouvelles fonctionnalités

### Pull Requests

1. Créez une PR vers `main`
2. Les tests s'exécutent automatiquement
3. Review et merge
4. Déploiement automatique

## 📞 Support et Ressources

- **GitHub Pages** : https://docs.github.com/pages
- **GitHub Actions** : https://docs.github.com/actions
- **Vite** : https://vitejs.dev/guide/
- **React** : https://react.dev/

## 🎯 Checklist de Déploiement

- [ ] Repository configuré avec le code frontend
- [ ] GitHub Pages activé avec source "GitHub Actions"
- [ ] Variables d'environnement configurées
- [ ] Workflow GitHub Actions fonctionnel
- [ ] Premier déploiement réussi
- [ ] Site accessible et fonctionnel
- [ ] API backend connectée
- [ ] Tests passent en CI/CD
- [ ] Monitoring configuré (optionnel)
- [ ] Domaine personnalisé configuré (optionnel)

---

✅ **Votre frontend est maintenant déployé et accessible !**

URL de votre application : `https://yourusername.github.io/planning-frontend`

## 🔄 Prochaines Étapes

1. Testez toutes les fonctionnalités
2. Configurez le monitoring
3. Ajoutez des tests E2E
4. Optimisez les performances
5. Configurez un domaine personnalisé