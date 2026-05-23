# Installation de Mon Foyer

## Étape 1 — Installer Node.js

Téléchargez et installez Node.js LTS depuis : https://nodejs.org/fr/download

Vérifiez l'installation dans un nouveau terminal :
```
node --version   # doit afficher v18+ ou v20+
npm --version    # doit afficher v9+
```

## Étape 2 — Installer les dépendances

Ouvrez un terminal dans le dossier `mon-foyer` :

```bash
cd C:\Users\cap-v\mon-foyer
npm install
```

## Étape 3 — Initialiser la base de données avec les données démo

```bash
npm run seed
```

Vous devriez voir :
```
✅ Base de données initialisée avec les données démo !
   - 3 membres : José, Anaïs, Lucas
   - 2 comptes : LCL (2850€) et SG (1340€)
   - 17 transactions
   - 5 événements agenda
   - 10 articles courses
   - 6 tâches to-do
   - 4 canaux de chat avec historique
```

## Étape 4 — Démarrer l'application

```bash
npm run dev
```

Ouvrez http://localhost:5173 dans votre navigateur.

## En production

```bash
npm run build
npm start
```

L'application sera sur http://localhost:3001

## Icônes PWA

Créez ou placez deux icônes PNG dans `client/public/icons/` :
- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)

Vous pouvez utiliser n'importe quelle image de maison / foyer comme icône.

## Résolution de problèmes

### Erreur "better-sqlite3" sur Windows
Si l'installation de `better-sqlite3` échoue, installez les outils de build :
```bash
npm install --global windows-build-tools
```
Ou installez "Desktop development with C++" depuis Visual Studio.

### Port 3001 déjà utilisé
Changez le port dans un fichier `.env` à la racine du dossier `server` :
```
PORT=3002
```
