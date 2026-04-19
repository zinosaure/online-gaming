# Retro Gaming Console 🎮

Un système d'émulation rétro avec interface web simple, construit avec FastAPI et Docker.

## Structure du Projet

```
.
├── docker-compose.yml     # Configuration Docker
├── launch.sh             # Script de lancement
├── CONTROLS.md          # Documentation des contrôles
├── examples/            # Exemples HTML de référence
└── src/
    ├── Dockerfile
    ├── requirements.txt
    ├── main.py          # Serveur FastAPI
    └── app/
        ├── mapping.json      # Configuration des émulateurs
        ├── html/            # Templates Jinja2
        │   ├── index.html
        │   ├── games.html
        │   ├── player.html
        │   └── error.html
        └── public/
            └── css-js/      # Fichiers JS/CSS des émulateurs
```

## Fonctionnalités

- 🎯 Liste des émulateurs disponibles avec images et descriptions
- 🎲 Browse des ROMs par émulateur (avec support des sous-dossiers)
- 🕹️ Player plein écran avec menu push intégré
- ⌨️ Contrôles clavier configurés pour 2 joueurs
- 📂 Support des fichiers ZIP (extraction automatique en mémoire)
- 🔊 Contrôle de volume dans le menu
- 💾 Sauvegarde/chargement d'états
- ⛶ Mode plein écran
- ❌ Gestion des erreurs de chargement
- 🔄 Hot reload (modifications détectées automatiquement)
- 📱 Support mobile avec contrôles tactiles

## Émulateurs Supportés

- 🎮 Nintendo (NES)
- 🕹️ Super Nintendo (SNES)
- 🎯 Nintendo 64
- 📱 Game Boy / Game Boy Color
- 🎲 Game Boy Advance
- ⚡ Sega Genesis / Mega Drive

**Émulateurs désactivés** (peuvent être activés dans `mapping.json`) :
- 💻 MS-DOS
- 🎰 MAME Arcade

## Installation

1. Assurez-vous que le réseau Docker existe :
```bash
docker network create skinoapp_network
```

2. Créez un fichier `.env` à la racine :
```env
PUID=1000
PGID=1000
TIMEZONE=Europe/Paris
```

3. Build et démarrez le container :
```bash
docker-compose up --build
```

## Utilisation

1. Accédez à http://localhost:13001
2. Sélectionnez un émulateur
3. Choisissez un jeu
4. Jouez avec les contrôles clavier ! (voir [CONTROLS.md](CONTROLS.md))
5. Ajustez le volume avec le slider en haut à droite

## Hot Reload

L'application se recharge automatiquement quand vous modifiez les fichiers dans `./src/app`.

## Organisation des ROMs

Les ROMs doivent être organisées selon la structure définie dans `mapping.json` :

```
/mnt/media/roms/
├── nes/      # ROMs Nintendo (.nes)
├── snes/     # ROMs Super Nintendo (.snes)
├── n64/      # ROMs Nintendo 64 (.n64)
├── gbc/      # ROMs Game Boy (.gb, .gbc)
├── gba/      # ROMs Game Boy Advance (.gba)
├── genesis/  # ROMs Sega Genesis (.gen, .smd, .bin)
├── dos/      # Jeux DOS (.dos, .iso, .img)
└── mame/     # ROMs MAME (.zip)
```

## Configuration

Le fichier `mapping.json` définit pour chaque émulateur :
- `activated` : Active ou désactive l'émulateur (true/false)
- `name` : Nom complet affiché dans l'interface
- `description` : Description de la console
- `image` : Emoji représentant la console
- `emulator` : Fichier JS de l'émulateur
- `roms` : Chemin relatif vers les ROMs
- `extensions` : Extensions de fichiers acceptées

Pour activer/désactiver un émulateur, modifiez le champ `activated` dans `mapping.json`.

## Développement

Le serveur FastAPI tourne avec `--reload` donc vos modifications sont automatiquement prises en compte.

Pour voir les logs :
```bash
docker-compose logs -f online-gaming
```

Pour rebuild :
```bash
docker-compose up --build -d
```

## Crédits

Émulateurs basés sur [Emulatrix](https://github.com/lrusso/Emulatrix)

## Etat d'Avancement (Session du 2026-04-19)

### Ce qui a ete fait

- Refonte de la logique manette dans le player :
    - detection avant lancement du jeu
    - ecran de demarrage avec bouton Play
    - fullscreen declenche via interaction utilisateur
    - activation/desactivation des controles tactiles selon presence manette
- Ajout d'un modal de demarrage avec navigation manette :
    - boutons `Retour` + `Play`
    - focus visuel et fleche de selection
    - validation via bouton A, retour via bouton B
- Amelioration du menu pause en jeu :
    - ajout du bouton `Reprendre`
    - navigation manette dans le menu (gauche/droite + A/B)
- Ajout de la navigation manette globale hors player :
    - navigation entre cartes de jeux/emulateurs
    - navigation de la barre de recherche et du bouton scan
- Ajout de la navigation manette sur l'ecran d'erreur de chargement
    - bouton retour selectionnable
    - action A/B pour revenir a la liste
- Nettoyage des anciens logs de debug visibles dans l'UI
- Mise en place PWA :
    - manifest web app
    - service worker (cache shell + assets statiques)
    - icon PWA
    - enregistrement automatique du service worker
    - routes FastAPI pour `manifest.webmanifest` et `sw.js`

### Ce qu'il reste a faire

- Validation complete sur appareils Android reels (plusieurs manettes et navigateurs)
- Ajouter un bouton explicite `Installer l'app` (workflow `beforeinstallprompt`)
- Ajouter une vraie page offline (actuellement fallback basique)
- Ameliorer la strategie de versionnement du cache PWA (invalidation automatique par version)
- Ajouter des tests manuels de regression pour :
    - navigation manette (index, games, modal play, menu pause, ecran erreur)
    - compatibilite D-pad via boutons et via axes (6/7)
    - coexistence manette + tactile sur mobile
- Nettoyage technique optionnel :
    - retirer les imports Python non utilises dans `src/main.py`
    - harmoniser les textes FR (accents/capitalisation)

### Notes

- Le service worker fonctionne en contexte securise (HTTPS) ou localhost.
- En acces HTTP non securise sur IP locale mobile, l'installation PWA peut ne pas apparaitre selon le navigateur.
