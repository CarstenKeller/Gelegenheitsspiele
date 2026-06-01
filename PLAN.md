# PLAN.md – Iteration 1: Gelegenheitsspiele App

## Ziel

Eine Expo-React-Native-App mit nostalgischen Gelegenheitsspielen.
Iteration 1 enthält: **Space Invaders** mit Sound, Highscore und einem Hauptmenü.

---

## Tech-Stack

| Paket | Zweck |
|---|---|
| `expo` (blank template) | Basis-Framework, Expo Go kompatibel |
| `expo-av` | Sound-Wiedergabe |
| `@react-native-async-storage/async-storage` | Highscore + Settings speichern |
| `@react-navigation/native` + `native-stack` | Navigation zwischen Screens |
| `react-native-screens` + `react-native-safe-area-context` | Navigation-Abhängigkeiten |

---

## App-Struktur

```
GelegenheitsspielApp/
├── App.js                        ← Navigation-Root
├── app.json
├── package.json
├── screens/
│   ├── HomeScreen.js             ← Hauptmenü
│   └── SpaceInvadersScreen.js    ← Spielscreen
├── components/
│   └── GameController.js         ← Steuerung (Links/Rechts + Schießen)
├── utils/
│   └── storage.js                ← AsyncStorage-Hilfsfunktionen
└── assets/
    ├── images/
    │   ├── player.png             ← Spielerschiff-Sprite
    │   ├── invader1.png           ← Invader Typ 1
    │   ├── invader2.png           ← Invader Typ 2
    │   └── invader3.png           ← Invader Typ 3
    └── sounds/
        ├── shoot.wav
        ├── explosion.wav
        └── gameover.wav
```

---

## Screen-Beschreibungen

### HomeScreen

- **Spielerliste:** Kacheln mit Spielnamen und -vorschau; Space Invaders aktiv, weitere Spiele ausgegraut als „Bald verfügbar"
- **Settings-Bereich:** Spielername eingeben, Sound an/aus (Toggle), Schwierigkeitsgrad wählen (Easy / Normal / Hard)
- **Highscore-Anzeige:** Pro Spiel der gespeicherte Bestwert mit Spielernamen
- Tap auf Spielkachel → navigiert zum Spielscreen

### SpaceInvadersScreen

- **Spielfeld:** oberer Bereich, volle Bildschirmbreite
- **HUD:** Score (links), Leben als ♥-Icons (rechts), Pause-Button (Mitte)
- **Controller:** unteres Drittel des Bildschirms
  - Links-Pfeil, Rechts-Pfeil → Spieler bewegen
  - Schuss-Button (rechts) → schießen
- **Game-Over-Overlay:** Score, neuer Highscore-Hinweis, „Nochmal"-Button, „Menü"-Button

---

## Space Invaders – Spielmechanik

### Spieler
- Schiff unten mittig, bewegt sich horizontal
- Maximal 1 Schuss gleichzeitig aktiv
- 3 Leben

### Invaders
- 5×3 Grid (15 Invader)
- Bewegen sich im Block seitwärts; wenn Rand erreicht → 1 Reihe nach unten + Richtungswechsel
- Zufällig schießen die Invader nach unten (einer pro Intervall)
- Geschwindigkeit steigt mit weniger verbleibenden Invaders

### Kollisionserkennung
- Bounding-Box (einfaches Rechteck-Overlap)
- Spieler-Schuss trifft Invader → Invader entfernt, Score +10
- Invader-Schuss trifft Spieler → Leben -1, kurze Unverwundbarkeitszeit
- Invader erreicht untere Spielfeldhälfte → Game Over

### Schwierigkeitsgrade

| Stufe | Invader-Startgeschwindigkeit | Schussfrequenz Invader |
|---|---|---|
| Easy | langsam | selten |
| Normal | mittel | mittel |
| Hard | schnell | häufig |

Schwierigkeitsgrad wird im HomeScreen gewählt und per Navigation-Parameter übergeben.

### Gewinn / Verlust
- Alle Invader eliminiert → nächste Runde (schneller)
- 0 Leben → Game Over
- Highscore wird gespeichert wenn Score > alter Highscore

---

## Game-Loop-Design

- `useRef` hält den kompletten Spielzustand (keine Re-Render bei jedem Frame)
- `setInterval` mit ~16ms (≈60fps) als Haupt-Loop
- Separater Render-Trigger: `useState(renderTick)` wird jede Frame inkrementiert
- Touch-Events setzen Flags in einem `controlsRef` (kein State-Update)
- Beim Unmount: Loop stoppen + Sounds entladen

---

## Sound-Integration

- `expo-av`: Sounds werden beim Start des Spielscreens vorab geladen
- 3 Sounds: Schuss, Explosion (Invader), Game Over
- Globales Sound-Setting aus AsyncStorage; wenn aus → kein Sound abspielen
- Sounds: kurze, freie WAV-Dateien (werden mit ins Repo eingecheckt)

---

## Implementierungsschritte

- [x] **Schritt 1:** Expo-Projekt initialisieren (`create-expo-app`), Abhängigkeiten installieren
- [x] **Schritt 2:** Navigation einrichten (Stack: Home → SpaceInvaders)
- [x] **Schritt 3:** `storage.js` – AsyncStorage-Helper (Highscore lesen/schreiben, Settings)
- [x] **Schritt 4:** `HomeScreen.js` – Menü mit Spielkachel, Settings, Highscore-Anzeige
- [x] **Schritt 5:** `GameController.js` – Touch-Controller-Komponente
- [x] **Schritt 6:** `SpaceInvadersScreen.js` – Grundgerüst: Spielfeld, HUD, Game-Loop-Rahmen
- [x] **Schritt 7:** Space Invaders – Spielmechanik: Spieler, Invader-Grid, Bewegung
- [x] **Schritt 8:** Space Invaders – Schüsse + Kollisionserkennung + Leben/Game-Over
- [x] **Schritt 9:** Sound-Integration (expo-av)
- [x] **Schritt 10:** Highscore-Speicherung + Settings-Persistenz
- [x] **Schritt 11:** Styling & UI-Polishing (dunkles Retro-Theme)
- [~] **Schritt 12:** Commit & Push auf Feature-Branch

---

## Design-Richtlinien

- **Farben:** Schwarz/dunkelblau Hintergrund, neon-grüne und weiße Elemente (Retro-Look)
- **Schriftart:** Standard Monospace oder `Courier New` für Retro-Feeling
- **Spieler-Schiff:** einfaches PNG-Sprite in `assets/images/`
- **Invader:** 3 verschiedene Typen als PNG-Sprites in `assets/images/`
- Assets-Ordner: `assets/images/` für Sprites, `assets/sounds/` für WAV-Dateien

---

## Entschiedene Fragen

1. **Spielerschiff & Invaders:** Einfache PNG-Sprites in `assets/images/`
2. **Sound-Dateien:** Klassische WAV-Dateien in `assets/sounds/`
3. **Schwierigkeitsgrade:** Easy / Normal / Hard direkt in Iteration 1
4. **Weitere Spiele im Menü:** Ausgegraut als „Bald verfügbar" anzeigen
