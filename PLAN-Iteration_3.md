# PLAN-Iteration_3.md – Donkey Kong

## Ziel

Zweites Spiel in der Arcade Games App: klassisches Donkey Kong mit animierter Introszene, einem vollständigen Plattformer-Level, Physik (Schwerkraft, Sprünge, Leiterklimmen) und dynamischer Schwierigkeit.

---

## Entschiedene Konzeptfragen

| Thema | Entscheidung |
|---|---|
| Introszene | Animiert: Kong läuft rein, klettert hoch, schnappt Prinzessin |
| Steuerung | ◀ ▶ ▲ ▼ D-Pad + JUMP-Button |
| Spielziel | Prinzessin oben erreichen → Siegesszene → nächste Runde |
| Schwierigkeit | Dynamisch: mehr Fässer, höhere Geschwindigkeit je Runde |

---

## Spielbeschreibung

### Introszene (Ablauf)
1. Schwarzer Bildschirm, Titel „DONKEY KONG" eingeblendet
2. Prinzessin erscheint oben auf dem Gerüst
3. Kong läuft von links ins Bild
4. Kong klettert die Leitern hoch, nimmt Prinzessin mit
5. Kong oben: haut auf die Brust, „HELP!" erscheint
6. Kurze Pause → Spielstart

### Stage: 25m (der Klassiker)

```
[Prinzessin][KONG]
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   ← Plattform 4 (oben)
         H
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← Plattform 3
H
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    ← Plattform 2
               H
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← Plattform 1
H
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← Boden (Mario-Start links)
```
- 5 Plattformen, leicht geneigt (Fässer rollen von selbst)
- 4 Leitern, abwechselnd links/rechts positioniert
- Fässer fallen vom Ende jeder Plattform zur nächsten

### Steuerung (DKController)

```
Linkshänder-Modus:        Rechtshänder-Modus (Standard):
[JUMP]   [▲]              [▲]       [JUMP]
     [◀][▼][▶]         [◀][▼][▶]
```

D-Pad verhält sich kontextsensitiv:
- Am Boden: ◀ ▶ = laufen, ▲ = Leiter betreten (wenn nah)
- An Leiter: ▲ ▼ = klettern, ◀ ▶ = Leiter verlassen
- In der Luft: ◀ ▶ = Richtung beeinflussen (minimal)

### Mario-Zustände

| Zustand | Beschreibung |
|---|---|
| idle | steht still |
| walkL / walkR | läuft, 2 Animationsphasen |
| jump | springt (Bogen) |
| climbUp / climbDown | klettert Leiter |
| die | Sterbeanimation (dreht sich, fällt) |

### Donkey Kong

- Sitzt oben links neben Prinzessin
- Haut alle N Sekunden ein Fass auf die Plattform
- 2 Animationsphasen: Ruhehaltung / Wurf

### Fässer

- Spawn oben, rollen in Richtung der Plattformneigung
- An Plattformkante: fallen auf die nächste Ebene
- 35 % Chance: rollen eine Leiter hinunter
- Kollidieren mit Mario → Leben -1, Sterbeanimation
- Sprung über Fass (Barrel innerhalb von 2 Frames übersprungen): +100 Punkte

### Physik

- Schwerkraft: Mario fällt wenn nicht auf Plattform oder Leiter
- Sprung: initiale Aufwärtsgeschwindigkeit, durch Schwerkraft gebremst
- Plattform-Kollision: Landung auf Oberkante (nur wenn Mario sich nach unten bewegt)
- Leiter: Eintritt nur von bestimmten Plattformhöhen, Verlassen nur an Plattformhöhe

### Score-System

| Ereignis | Punkte |
|---|---|
| Fass überspringen | 100 |
| Prinzessin erreichen (Basis) | 1000 |
| Prinzessin-Bonus (Zeitbonus) | 0–500 (je schneller) |

### Schwierigkeit (dynamisch)

| Runde | Fass-Intervall | Fass-Geschwindigkeit | Leiter-Chance |
|---|---|---|---|
| 1 | 3,0 s | 1,5 px/tick | 25 % |
| 2 | 2,5 s | 1,8 px/tick | 30 % |
| 3 | 2,0 s | 2,2 px/tick | 35 % |
| 4+ | min. 1,5 s | max. 3,0 px/tick | 40 % |

### Lives & Game Over

- 3 Leben (gleiche Anzeige wie Space Invaders: ♥ ♥ ♥)
- Game Over wenn 0 Leben
- Highscore separat von Space Invaders gespeichert

---

## Neue / geänderte Dateien

| Datei | Änderung |
|---|---|
| `screens/DonkeyKongScreen.js` | Introszene + Spielschleife + Physik |
| `components/DKController.js` | 4-Richtungs-D-Pad + JUMP |
| `components/DKMario.js` | Pixel-Art, alle Zustände |
| `components/DKKong.js` | Pixel-Art, 2 Animationsphasen |
| `components/DKBarrel.js` | Rollende Fass-Komponente |
| `components/DKPrincess.js` | Prinzessin-Pixel-Art |
| `utils/dkLevel.js` | Level-Daten (Plattformen, Leitern) |
| `utils/dkSounds.js` | Sounds: Sprung, Treffer, Tod, Sieg, Intro |
| `utils/storage.js` | `highscore_donkeykong` Key ergänzen |
| `screens/HomeScreen.js` | Donkey Kong Kachel aktivieren |
| `App.js` | `DonkeyKong` Screen zur Navigation hinzufügen |

---

## Implementierungsschritte

- [ ] **Schritt 1:** `utils/dkLevel.js` – Plattform- und Leiter-Koordinaten als Daten
- [ ] **Schritt 2:** `utils/dkSounds.js` – Sounds (Sprung, Barrel, Tod, Sieg, Intro-Jingle)
- [ ] **Schritt 3:** `components/DKMario.js` – Pixel-Art alle Zustände
- [ ] **Schritt 4:** `components/DKKong.js` + `DKPrincess.js` + `DKBarrel.js`
- [ ] **Schritt 5:** `components/DKController.js` – 4-Richtungs-D-Pad + JUMP
- [ ] **Schritt 6:** `screens/DonkeyKongScreen.js` – Introszene (State Machine)
- [ ] **Schritt 7:** `screens/DonkeyKongScreen.js` – Spielschleife, Physik, Kollisionen
- [ ] **Schritt 8:** `screens/DonkeyKongScreen.js` – Barrel-Logik, Score, Leben, Game Over
- [ ] **Schritt 9:** `utils/storage.js` + `screens/HomeScreen.js` + `App.js` – Integration
- [ ] **Schritt 10:** Commit & Push

---

## Nicht in Iteration 3 (Ausblick)

- Nieten-Stage (zweite Stage, Nieten entfernen = Kong fällt)
- Feuer-Enemies (die Mario verfolgen)
- Bonus-Items (Hut, Schirm, Handtasche)
- Cutscenes zwischen Stages
