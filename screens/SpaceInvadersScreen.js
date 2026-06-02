import { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView } from 'react-native';
import GameController from '../components/GameController';
import Invader, { INVADER_W, INVADER_H, INVADER_POINTS } from '../components/Invader';
import PlayerShip, { PLAYER_W, PLAYER_H } from '../components/PlayerShip';
import Bunker, { BUNKER_W, BUNKER_H, buildBunker } from '../components/Bunker';
import Ufo, { UFO_W, UFO_H, UFO_POINTS } from '../components/Ufo';
import { getHighscore, saveHighscore } from '../utils/storage';
import { preloadSounds, playSound, unloadSounds, startMarch, stopMarch, updateMarch } from '../utils/sounds';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const FIELD_H = Math.round(SCREEN_H * 0.60);

const BULLET_W = 3;
const BULLET_H = 12;

const COLS = 5;
const ROWS = 3;
const H_GAP = Math.floor((SCREEN_W - COLS * INVADER_W) / (COLS + 1));
const V_GAP = 14;
const INVADER_TOP = 36;

const BUNKER_COUNT = 4;
const BUNKER_Y = FIELD_H - PLAYER_H - BUNKER_H - 24;
const UFO_Y = 14;
const UFO_SPEED = 2;

const DIFFICULTY_PARAMS = {
  easy:   { playerSpeed: 5, invaderBaseInterval: 900, invaderShootInterval: 2400 },
  normal: { playerSpeed: 6, invaderBaseInterval: 600, invaderShootInterval: 1600 },
  hard:   { playerSpeed: 7, invaderBaseInterval: 350, invaderShootInterval: 900 },
};

// Score row type: row 0 (top) = type 2, rows 1-2 = type 1, row 3+ = type 0 (but we have 3 rows)
function rowToType(row) {
  if (row === 0) return 2;
  if (row === 1) return 1;
  return 0;
}

function buildInvaders() {
  const grid = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      grid.push({
        id: `${row}-${col}`,
        row, col,
        x: H_GAP + col * (INVADER_W + H_GAP),
        y: INVADER_TOP + row * (INVADER_H + V_GAP),
        type: rowToType(row),
        alive: true,
      });
    }
  }
  return grid;
}

function buildBunkers() {
  const bunkers = [];
  const spacing = Math.floor(SCREEN_W / (BUNKER_COUNT + 1));
  for (let i = 0; i < BUNKER_COUNT; i++) {
    bunkers.push({
      id: i,
      x: spacing * (i + 1) - BUNKER_W / 2,
      y: BUNKER_Y,
      blocks: buildBunker(),
    });
  }
  return bunkers;
}

function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export default function SpaceInvadersScreen({ navigation, route }) {
  const { difficulty = 'normal', soundEnabled = true, playerName = '', handedness = 'right' } = route.params ?? {};
  const params = DIFFICULTY_PARAMS[difficulty];

  const controlsRef = useRef({ left: false, right: false, fire: false });
  const gs = useRef(null);
  const loopRef = useRef(null);
  const invaderShootRef = useRef(null);
  const invaderMoveRef = useRef(null);
  const ufoTimerRef = useRef(null);
  const marchIntervalRef = useRef(null);

  const [renderTick, setRenderTick] = useState(0);
  const [gamePhase, setGamePhase] = useState('playing');
  const [isNewHighscore, setIsNewHighscore] = useState(false);
  const [hiScore, setHiScore] = useState(0);

  const initState = useCallback((round = 1, score = 0, lives = 3) => {
    const invaders = buildInvaders();
    gs.current = {
      playerX: SCREEN_W / 2 - PLAYER_W / 2,
      playerY: FIELD_H - PLAYER_H - 6,
      lives,
      score,
      round,
      invaders,
      invaderDirX: 1,
      invaderPhase: 0,
      playerBullet: null,
      invaderBullets: [],
      invincibleUntil: 0,
      lastFireTime: 0,
      ufo: null,
      bunkers: buildBunkers(),
    };
  }, []);

  useEffect(() => {
    (async () => {
      const hs = await getHighscore();
      setHiScore(hs.score);
    })();
    initState(1);
    if (soundEnabled) preloadSounds();
    startAll();
    return () => stopAll();
  }, []);

  function startAll() {
    startPlayerLoop();
    startInvaderMove();
    startInvaderShoot();
    startUfoTimer();
  }

  function stopAll() {
    stopMarch();
    if (loopRef.current) clearInterval(loopRef.current);
    if (invaderShootRef.current) clearInterval(invaderShootRef.current);
    if (invaderMoveRef.current) clearInterval(invaderMoveRef.current);
    if (ufoTimerRef.current) clearTimeout(ufoTimerRef.current);
    if (soundEnabled) unloadSounds();
  }

  function startPlayerLoop() {
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = setInterval(playerTick, 16);
  }

  function startInvaderMove() {
    if (invaderMoveRef.current) clearInterval(invaderMoveRef.current);
    const state = gs.current;
    const alive = state ? state.invaders.filter(i => i.alive).length : COLS * ROWS;
    const interval = Math.max(80, params.invaderBaseInterval - (COLS * ROWS - alive) * 15);
    invaderMoveRef.current = setInterval(invaderMoveTick, interval);

    if (soundEnabled) {
      const marchMs = updateMarch(alive, soundEnabled);
      startMarch(marchMs, soundEnabled);
    }
  }

  function restartInvaderMove() {
    if (invaderMoveRef.current) clearInterval(invaderMoveRef.current);
    const alive = gs.current ? gs.current.invaders.filter(i => i.alive).length : 1;
    const interval = Math.max(80, params.invaderBaseInterval - (COLS * ROWS - alive) * 15);
    invaderMoveRef.current = setInterval(invaderMoveTick, interval);
    if (soundEnabled) {
      stopMarch();
      startMarch(updateMarch(alive, soundEnabled), soundEnabled);
    }
  }

  function startInvaderShoot() {
    if (invaderShootRef.current) clearInterval(invaderShootRef.current);
    invaderShootRef.current = setInterval(invaderShoot, params.invaderShootInterval);
  }

  function startUfoTimer() {
    const delay = 15000 + Math.random() * 20000;
    ufoTimerRef.current = setTimeout(spawnUfo, delay);
  }

  function spawnUfo() {
    if (!gs.current) return;
    const dir = Math.random() > 0.5 ? 1 : -1;
    gs.current.ufo = {
      x: dir === 1 ? -UFO_W : SCREEN_W,
      y: UFO_Y,
      dirX: dir,
      points: UFO_POINTS[Math.floor(Math.random() * UFO_POINTS.length)],
    };
  }

  function invaderShoot() {
    const state = gs.current;
    if (!state) return;
    const alive = state.invaders.filter(i => i.alive);
    if (alive.length === 0) return;
    // prefer bottom-row invaders in each column
    const byCol = {};
    for (const inv of alive) {
      if (!byCol[inv.col] || inv.row > byCol[inv.col].row) byCol[inv.col] = inv;
    }
    const shooters = Object.values(byCol);
    const shooter = shooters[Math.floor(Math.random() * shooters.length)];
    state.invaderBullets.push({
      id: Date.now() + Math.random(),
      x: shooter.x + INVADER_W / 2 - BULLET_W / 2,
      y: shooter.y + INVADER_H,
    });
  }

  function invaderMoveTick() {
    const state = gs.current;
    if (!state) return;

    const alive = state.invaders.filter(i => i.alive);
    if (alive.length === 0) return;

    const leftmost = Math.min(...alive.map(i => i.x));
    const rightmost = Math.max(...alive.map(i => i.x + INVADER_W));

    let stepped = false;
    if (state.invaderDirX === 1 && rightmost >= SCREEN_W - 4) {
      state.invaders = state.invaders.map(i => ({ ...i, y: i.y + 8 }));
      state.invaderDirX = -1;
      stepped = true;
    } else if (state.invaderDirX === -1 && leftmost <= 4) {
      state.invaders = state.invaders.map(i => ({ ...i, y: i.y + 8 }));
      state.invaderDirX = 1;
      stepped = true;
    }

    if (!stepped) {
      const dx = state.invaderDirX * 4;
      state.invaders = state.invaders.map(i => ({ ...i, x: i.x + dx }));
    }
    state.invaderPhase = (state.invaderPhase + 1) % 2;

    // Game over if invaders reach player
    const lowestY = Math.max(...state.invaders.filter(i => i.alive).map(i => i.y + INVADER_H));
    if (lowestY >= state.playerY) {
      triggerGameOver();
      return;
    }

    restartInvaderMove();
    setRenderTick(t => t + 1);
  }

  function playerTick() {
    const state = gs.current;
    if (!state) return;

    const now = Date.now();
    const ctrl = controlsRef.current;

    if (ctrl.left) state.playerX = Math.max(0, state.playerX - params.playerSpeed);
    if (ctrl.right) state.playerX = Math.min(SCREEN_W - PLAYER_W, state.playerX + params.playerSpeed);

    // Fire
    if (ctrl.fire && !state.playerBullet && now - state.lastFireTime > 400) {
      state.playerBullet = {
        x: state.playerX + PLAYER_W / 2 - BULLET_W / 2,
        y: state.playerY,
      };
      state.lastFireTime = now;
      if (soundEnabled) playSound('shoot');
    }

    // Move player bullet
    if (state.playerBullet) {
      state.playerBullet.y -= 10;
      if (state.playerBullet.y < 0) state.playerBullet = null;
    }

    // Move invader bullets
    state.invaderBullets = state.invaderBullets
      .map(b => ({ ...b, y: b.y + 4 }))
      .filter(b => b.y < FIELD_H);

    // Move UFO
    if (state.ufo) {
      state.ufo.x += UFO_SPEED * state.ufo.dirX;
      if (state.ufo.x > SCREEN_W + UFO_W || state.ufo.x < -UFO_W * 2) {
        state.ufo = null;
        startUfoTimer();
      }
    }

    // Collisions: player bullet vs invaders
    if (state.playerBullet) {
      let hit = false;
      for (let i = 0; i < state.invaders.length; i++) {
        const inv = state.invaders[i];
        if (!inv.alive) continue;
        if (overlap(state.playerBullet.x, state.playerBullet.y, BULLET_W, BULLET_H,
                    inv.x, inv.y, INVADER_W, INVADER_H)) {
          state.invaders[i] = { ...inv, alive: false };
          state.score += INVADER_POINTS[inv.type];
          state.playerBullet = null;
          if (soundEnabled) playSound('explosion');
          restartInvaderMove();
          hit = true;
          break;
        }
      }

      // Player bullet vs UFO
      if (!hit && state.ufo && state.playerBullet) {
        if (overlap(state.playerBullet.x, state.playerBullet.y, BULLET_W, BULLET_H,
                    state.ufo.x, state.ufo.y, UFO_W, UFO_H)) {
          state.score += state.ufo.points;
          state.playerBullet = null;
          state.ufo = null;
          if (soundEnabled) playSound('ufoHit');
          startUfoTimer();
        }
      }

      // Player bullet vs bunkers
      if (state.playerBullet) {
        for (const bunker of state.bunkers) {
          if (overlap(state.playerBullet.x, state.playerBullet.y, BULLET_W, BULLET_H,
                      bunker.x, bunker.y, BUNKER_W, BUNKER_H)) {
            hitBunker(bunker, state.playerBullet.x - bunker.x, state.playerBullet.y - bunker.y);
            state.playerBullet = null;
            break;
          }
        }
      }
    }

    // Invader bullets vs player
    if (now > state.invincibleUntil) {
      for (let i = state.invaderBullets.length - 1; i >= 0; i--) {
        const b = state.invaderBullets[i];
        if (overlap(b.x, b.y, BULLET_W, BULLET_H, state.playerX, state.playerY, PLAYER_W, PLAYER_H)) {
          state.invaderBullets.splice(i, 1);
          state.lives -= 1;
          state.invincibleUntil = now + 1500;
          if (soundEnabled) playSound('playerHit');
          if (state.lives <= 0) { triggerGameOver(); return; }
        }
      }
    }

    // Invader bullets vs bunkers
    for (let bi = state.invaderBullets.length - 1; bi >= 0; bi--) {
      const b = state.invaderBullets[bi];
      for (const bunker of state.bunkers) {
        if (overlap(b.x, b.y, BULLET_W, BULLET_H, bunker.x, bunker.y, BUNKER_W, BUNKER_H)) {
          hitBunker(bunker, b.x - bunker.x, b.y - bunker.y);
          state.invaderBullets.splice(bi, 1);
          break;
        }
      }
    }

    // Next round?
    if (state.invaders.filter(i => i.alive).length === 0) {
      const nextRound = state.round + 1;
      initState(nextRound, state.score, state.lives);
      restartInvaderMove();
    }

    setRenderTick(t => t + 1);
  }

  function hitBunker(bunker, localX, localY) {
    const BLOCK = 6;
    const col = Math.floor(localX / BLOCK);
    const row = Math.floor(localY / BLOCK);
    // destroy hit block + adjacent blocks randomly for erosion effect
    const toDestroy = [`${row}-${col}`, `${row - 1}-${col}`, `${row}-${col - 1}`, `${row}-${col + 1}`];
    for (const key of toDestroy) {
      if (bunker.blocks[key]) {
        if (Math.random() > 0.4) bunker.blocks[key] = false;
      }
    }
  }

  async function triggerGameOver() {
    stopAll();
    const state = gs.current;
    if (soundEnabled) playSound('gameover');
    const prev = await getHighscore();
    if (state.score > prev.score) {
      await saveHighscore(state.score, playerName || 'Unbekannt');
      setHiScore(state.score);
      setIsNewHighscore(true);
    }
    setGamePhase('gameover');
  }

  function togglePause() {
    if (gamePhase === 'playing') {
      stopAll();
      setGamePhase('paused');
    } else if (gamePhase === 'paused') {
      startAll();
      setGamePhase('playing');
    }
  }

  function restart() {
    stopAll();
    setIsNewHighscore(false);
    initState(1);
    setGamePhase('playing');
    startAll();
  }

  const state = gs.current;
  if (!state) return null;

  const invincible = Date.now() < state.invincibleUntil;
  const aliveCount = state.invaders.filter(i => i.alive).length;

  return (
    <SafeAreaView style={s.root}>
      {/* HUD top */}
      <View style={s.hud}>
        <View style={s.hudCol}>
          <Text style={s.hudLabel}>SCORE</Text>
          <Text style={s.hudValue}>{String(state.score).padStart(4, '0')}</Text>
        </View>
        <View style={s.hudCol}>
          <Text style={s.hudLabel}>HI-SCORE</Text>
          <Text style={s.hudValue}>{String(Math.max(hiScore, state.score)).padStart(4, '0')}</Text>
        </View>
        <TouchableOpacity onPress={togglePause} style={s.hudCol}>
          <Text style={s.hudLabel}>RUNDE {state.round}</Text>
          <Text style={s.hudValue}>{gamePhase === 'paused' ? '▶ WEITER' : '⏸ PAUSE'}</Text>
        </TouchableOpacity>
      </View>

      {/* Field */}
      <View style={s.field}>
        {/* UFO */}
        {state.ufo && (
          <View style={{ position: 'absolute', left: state.ufo.x, top: state.ufo.y }}>
            <Ufo />
          </View>
        )}

        {/* Invaders */}
        {state.invaders.map(inv => inv.alive && (
          <View key={inv.id} style={{ position: 'absolute', left: inv.x, top: inv.y }}>
            <Invader type={inv.type} phase={state.invaderPhase} />
          </View>
        ))}

        {/* Bunkers */}
        {state.bunkers.map(bunker => (
          <View key={bunker.id} style={{ position: 'absolute', left: bunker.x, top: bunker.y }}>
            <Bunker blocks={bunker.blocks} />
          </View>
        ))}

        {/* Player bullet */}
        {state.playerBullet && (
          <View style={[s.bullet, s.playerBullet, { left: state.playerBullet.x, top: state.playerBullet.y }]} />
        )}

        {/* Invader bullets */}
        {state.invaderBullets.map(b => (
          <View key={b.id} style={[s.bullet, s.invaderBullet, { left: b.x, top: b.y }]} />
        ))}

        {/* Player */}
        <View style={{ position: 'absolute', left: state.playerX, top: state.playerY }}>
          <PlayerShip invincible={invincible} />
        </View>

        {/* Ground line */}
        <View style={[s.groundLine, { top: state.playerY + PLAYER_H + 2 }]} />

        {/* HUD bottom: lives */}
        <View style={[s.livesRow, { top: state.playerY + PLAYER_H + 6 }]}>
          <Text style={s.livesLabel}>{state.lives} </Text>
          {Array.from({ length: state.lives }).map((_, i) => (
            <View key={i} style={s.lifeIcon} />
          ))}
        </View>

        {/* Pause overlay */}
        {gamePhase === 'paused' && (
          <View style={s.overlay}>
            <Text style={s.overlayTitle}>PAUSE</Text>
          </View>
        )}

        {/* Game Over overlay */}
        {gamePhase === 'gameover' && (
          <View style={s.overlay}>
            <Text style={s.overlayTitle}>GAME OVER</Text>
            <Text style={s.overlayScore}>{state.score} PUNKTE</Text>
            {isNewHighscore && <Text style={s.newHighscore}>★ NEUER HIGHSCORE ★</Text>}
            <TouchableOpacity style={s.overlayBtn} onPress={restart}>
              <Text style={s.overlayBtnText}>NOCHMAL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.overlayBtn, s.menuBtn]} onPress={() => navigation.navigate('Home')}>
              <Text style={[s.overlayBtnText, { color: '#aaa' }]}>MENÜ</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <GameController controlsRef={controlsRef} handedness={handedness} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  hud: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderColor: '#0a2a0a' },
  hudCol: { alignItems: 'center', flex: 1 },
  hudLabel: { color: '#0f0', fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 },
  hudValue: { color: '#fff', fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' },

  field: { width: SCREEN_W, height: FIELD_H, overflow: 'hidden' },

  bullet: { position: 'absolute', width: BULLET_W, height: BULLET_H, borderRadius: 1 },
  playerBullet: { backgroundColor: '#ffffff' },
  invaderBullet: { backgroundColor: '#ff4444' },

  groundLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#00aa00' },
  livesRow: { position: 'absolute', left: 8, flexDirection: 'row', alignItems: 'center' },
  livesLabel: { color: '#0f0', fontFamily: 'monospace', fontSize: 12 },
  lifeIcon: { width: 16, height: 10, backgroundColor: '#00ff00', borderRadius: 2, marginRight: 4 },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', gap: 16 },
  overlayTitle: { color: '#0f0', fontFamily: 'monospace', fontSize: 30, fontWeight: 'bold', letterSpacing: 4 },
  overlayScore: { color: '#fff', fontFamily: 'monospace', fontSize: 20 },
  newHighscore: { color: '#ff0', fontFamily: 'monospace', fontSize: 15, letterSpacing: 2 },
  overlayBtn: { borderWidth: 2, borderColor: '#0f0', borderRadius: 4, paddingHorizontal: 28, paddingVertical: 10 },
  menuBtn: { borderColor: '#444' },
  overlayBtnText: { color: '#0f0', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold' },
});
