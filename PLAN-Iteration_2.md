# PLAN-Iteration_2.md – Atari-Fidelity & UX-Verbesserungen

## Ziel

Space Invaders soll optisch, akustisch und im Spielgefühl dem Atari-Original so nahe wie möglich kommen. Zusätzlich wird der Controller für Links- und Rechtshänder konfigurierbar.

---

## Änderungen im Überblick

### 1. Grafik – Pixel-Art Invader & Spielerschiff

**Invader (3 Typen, je aus zusammengesetzten Views gebaut):**

| Typ | Reihe | Original-Vorlage |
|---|---|---|
| Oktopus | Reihe 1 (unten) | breite, runde Form, 10 Pkt |
| Krabbe | Reihe 2–3 (Mitte) | Scheren-Form, 20 Pkt |
| Tintenfisch | Reihe 4–5 (oben) | schmale, hohe Form, 30 Pkt |

- Jeder Invader hat **2 Animationsphasen** (wechselt bei jedem Bewegungsschritt)
- Farbe pro Typ: Oktopus = Magenta, Krabbe = Cyan, Tintenfisch = Weiß

**Spielerschiff:**
- Klassische Kanonenform: breite Basis + schmaler Turm, als View-Komposition
- Farbe: Neon-Grün

**UFO (Bonusraumschiff):**
- Erscheint gelegentlich oben quer über das Spielfeld
- Gibt zufällig 50–300 Punkte bei Abschuss
- Klassisches flaches Tablett-Shape

### 2. Grafik – Schutzwälle (Bunker)

- 4 Bunker gleichmäßig über die Breite verteilt, oberhalb des Spielers
- Jeder Bunker besteht aus einem 6×4 Grid von kleinen Blöcken
- Blöcke werden einzeln zerstört wenn ein Schuss (Spieler oder Invader) trifft
- Komplett zerstörter Bunker verschwindet

### 3. Sound – Atari-authentisch

**Marschrhythmus:**
- 4 alternierende Töne (dun-dun-dun-dun), Loop
- Tempo steigt mit sinkender Invader-Anzahl (je weniger Invader, desto schneller)
- Implementierung: `expo-av` mit kurzen synthetischen Tönen (Base64-WAV inline, kein externes File nötig)

**Effekte:**
- Schuss: kurzer hoher Piepton
- Invader-Treffer: kurzes Rauschen / Knacksen
- Spieler-Treffer: tiefes Explosionsgeräusch
- UFO-Treffer: aufsteigender Ton
- Game Over: absteigende Tonfolge
- Alle Sounds als inline Base64-WAV (kein `assets/sounds/`-Ordner mehr nötig)

### 4. Spielgefühl – Bewegungslogik

**Invader-Bewegung wie im Original:**
- Invader bewegen sich **Spalte für Spalte**, nicht alle auf einmal
- Erst wenn alle Invader einmal dran waren, beginnt die nächste Runde
- → Gibt das charakteristische „Roboter-Stampfen"-Gefühl

**Score-System wie Original:**
- Oktopus (unterste Reihe): 10 Pkt
- Krabbe (mittlere Reihen): 20 Pkt
- Tintenfisch (oberste Reihen): 30 Pkt
- UFO: 50 / 100 / 150 / 200 / 250 / 300 Pkt (zufällig)

**HUD-Layout wie Original:**
- `SCORE<1>` links, `HI-SCORE` mittig, `SCORE<2>` rechts (SCORE<2> vorerst leer)
- Runden-Nummer unten links
- Leben als kleine Spielerschiff-Icons unten rechts

### 5. Controller – Links-/Rechtshänder-Modus

**Einstellung im HomeScreen (Settings-Bereich):**
- Toggle: `Rechtshänder` (Standard) / `Linkshänder`
- Wird in AsyncStorage gespeichert und über Navigation-Parameter übergeben

**Rechtshänder (Standard):**
```
[◀]  [▶]          [FIRE]
```

**Linkshänder:**
```
[FIRE]          [◀]  [▶]
```

---

## Neue / geänderte Dateien

| Datei | Änderung |
|---|---|
| `components/GameController.js` | Links-/Rechtshänder-Layout |
| `components/Invader.js` | Pixel-Art-Komponente mit 2 Animationsphasen |
| `components/PlayerShip.js` | Kanonenform als View-Komposition |
| `components/Bunker.js` | Bunker-Grid mit Einzelblock-Zerstörung |
| `components/Ufo.js` | UFO-Komponente mit Bewegungslogik |
| `screens/SpaceInvadersScreen.js` | Überarbeitete Game-Loop, UFO, Bunker, Score |
| `screens/HomeScreen.js` | Händigkeit-Toggle in Settings |
| `utils/storage.js` | `handedness`-Setting |
| `utils/sounds.js` | Inline-Base64-Sounds + Marschrhythmus-Engine |

---

## Implementierungsschritte

- [x] **Schritt 1:** `utils/sounds.js` – Marschrhythmus-Engine + alle Sounds als Base64-WAV inline
- [x] **Schritt 2:** `components/Invader.js` – 3 Typen, 2 Animationsphasen, korrekte Punktewerte
- [x] **Schritt 3:** `components/PlayerShip.js` – Kanonenform als View-Komposition
- [x] **Schritt 4:** `components/Bunker.js` – 6×4 Block-Grid, Einzelblock-Zerstörung
- [x] **Schritt 5:** `components/Ufo.js` – UFO-Bewegung + zufällige Punktewerte
- [x] **Schritt 6:** `screens/SpaceInvadersScreen.js` – Neue Grafik einbauen, Bunker-Kollision, UFO-Logik, Original-Bewegungslogik, HUD-Überarbeitung
- [x] **Schritt 7:** `components/GameController.js` – Händigkeit-Layout
- [x] **Schritt 8:** `screens/HomeScreen.js` + `utils/storage.js` – Händigkeit-Setting
- [~] **Schritt 9:** Commit & Push

---

## Nicht in Iteration 2 (Ausblick)

- Multiplayer / zweiter Spieler
- Weitere Spiele (Breakout, Snake)
- Leaderboard mit mehreren Einträgen
