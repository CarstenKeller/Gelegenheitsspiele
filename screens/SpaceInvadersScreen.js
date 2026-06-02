import { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import GameController from '../components/GameController';
import Invader, { INVADER_W, INVADER_H, INVADER_POINTS } from '../components/Invader';
import PlayerShip, { PLAYER_W, PLAYER_H } from '../components/PlayerShip';
import Bunker, { BUNKER_W, BUNKER_H, BLOCK, buildBunker, hitBunker } from '../components/Bunker';
import Ufo, { UFO_W, UFO_H, UFO_POINTS } from '../components/Ufo';
import { getHighscore, saveHighscore } from '../utils/storage';
import { preloadSounds, playSound, unloadSounds } from '../utils/sounds';

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
const BUNKER_Y = FIELD_H - PLAYER_H - BUNKER_H - 28;
const UFO_Y = 10;
const UFO_SPEED = 2;

const MARCH_NOTES = ['march0', 'march1', 'march2', 'march3'];

const DIFFICULTY_PARAMS = {
  easy:   { playerSpeed: 5, invaderBaseInterval: 900, invaderShootInterval: 2400 },
  normal: { playerSpeed: 6, invaderBaseInterval: 600, invaderShootInterval: 1600 },
  hard:   { playerSpeed: 7, invaderBaseInterval: 350, invaderShootInterval: 900 },
};

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
  const spacing = Math.floor(SCREEN_W / (BUNKER_COUNT + 1));
  return Array.from({ length: BUNKER_COUNT }, (_, i) => ({
    id: i,
    x: spacing * (i + 1) - BUNKER_W / 2,
    y: BUNKER_Y,
    blocks: buildBunker(),
  }));
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
  const marchStepRef = useRef(0);
  const soundsReady = useRef(false);

  const [renderTick, setRenderTick] = useState(0);
  const [gamePhase, setGamePhase] = useState('loading');
  const [isNewHighscore, setIsNewHighscore] = useState(false);
  const [hiScore, setHiScore] = useState(0);

  const initState = useCallback((round = 1, score = 0, lives = 3) => {
    gs.current = {
      playerX: SCREEN_W / 2 - PLAYER_W / 2,
      playerY: FIELD_H - PLAYER_H - 6,
      lives,
      score,
      round,
      invaders: buildInvaders(),
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
    let cancelled = false;
    (async () => {
      const hs = await getHighscore();
      if (!cancelled) setHiScore(hs.score);

      initState(1);

      if (soundEnabled) {
        try { await preloadSounds(); } catch (_) {}
      }
      soundsReady.current = true;

      if (!cancelled) {
        setGamePhase('playing');
        startAll();
      }
    })();
    return () => {
      cancelled = true;
      stopAll();
      if (soundEnabled) unloadSounds();
    };
  }, []);

  function play(name) {
    if (soundEnabled && soundsReady.current) playSound(name);
  }

  function startAll() {
    startPlayerLoop();
    startInvaderMove();
    startInvaderShoot();
    startUfoTimer();
  }

  function stopAll() {
    if (loopRef.current) { clearInterval(loopRef.current); loopRef.current = null; }
    if (invaderShootRef.current) { clearInterval(invaderShootRef.current); invaderShootRef.current = null; }
    if (invaderMoveRef.current) { clearInterval(invaderMoveRef.current); invaderMoveRef.current = null; }
    if (ufoTimerRef.current) { clearTimeout(ufoTimerRef.current); ufoTimerRef.current = null; }
  }

  function startPlayerLoop() {
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = setInterval(playerTick, 16);
  }

  function getInvaderInterval() {
    const alive = gs.current ? gs.current.invaders.filter(i => i.alive).length : COLS * ROWS;
    return Math.max(80, params.invaderBaseInterval - (COLS * ROWS - alive) * 14);
  }

  function startInvaderMove() {
    if (invaderMoveRef.current) clearInterval(invaderMoveRef.current);
    invaderMoveRef.current = setInterval(invaderMoveTick, getInvaderInterval());
  }

  function startInvaderShoot() {
    if (invaderShootRef.current) clearInterval(invaderShootRef.current);
    invaderShootRef.current = setInterval(invaderShoot, params.invaderShootInterval);
  }

  function startUfoTimer() {
    if (ufoTimerRef.current) clearTimeout(ufoTimerRef.current);
    ufoTimerRef.current = setTimeout(spawnUfo, 15000 + Math.random() * 20000);
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
    // Only bottom-row invader per column fires
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

    // Play march note synced to movement
    play(MARCH_NOTES[marchStepRef.current % 4]);
    marchStepRef.current++;

    const leftmost = Math.min(...alive.map(i => i.x));
    const rightmost = Math.max(...alive.map(i => i.x + INVADER_W));

    if (state.invaderDirX === 1 && rightmost >= SCREEN_W - 2) {
      state.invaders = state.invaders.map(i => ({ ...i, y: i.y + 8 }));
      state.invaderDirX = -1;
    } else if (state.invaderDirX === -1 && leftmost <= 2) {
      state.invaders = state.invaders.map(i => ({ ...i, y: i.y + 8 }));
      state.invaderDirX = 1;
    } else {
      state.invaders = state.invaders.map(i => ({ ...i, x: i.x + state.invaderDirX * 4 }));
    }
    state.invaderPhase = (state.invaderPhase + 1) % 2;

    const lowestY = Math.max(...state.invaders.filter(i => i.alive).map(i => i.y + INVADER_H));
    if (lowestY >= state.playerY) {
      triggerGameOver();
      return;
    }

    // Restart with updated interval (speeds up as invaders die)
    startInvaderMove();
    setRenderTick(t => t + 1);
  }

  function playerTick() {
    const state = gs.current;
    if (!state) return;

    const now = Date.now();
    const ctrl = controlsRef.current;

    if (ctrl.left)  state.playerX = Math.max(0, state.playerX - params.playerSpeed);
    if (ctrl.right) state.playerX = Math.min(SCREEN_W - PLAYER_W, state.playerX + params.playerSpeed);

    // Fire
    if (ctrl.fire && !state.playerBullet && now - state.lastFireTime > 400) {
      state.playerBullet = {
        x: state.playerX + PLAYER_W / 2 - BULLET_W / 2,
        y: state.playerY,
      };
      state.lastFireTime = now;
      play('shoot');
    }

    // Move player bullet up
    if (state.playerBullet) {
      state.playerBullet.y -= 10;
      if (state.playerBullet.y < 0) state.playerBullet = null;
    }

    // Move invader bullets down
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

    // Player bullet collisions
    if (state.playerBullet) {
      let bulletConsumed = false;

      // vs invaders
      for (let i = 0; i < state.invaders.length && !bulletConsumed; i++) {
        const inv = state.invaders[i];
        if (!inv.alive) continue;
        if (overlap(state.playerBullet.x, state.playerBullet.y, BULLET_W, BULLET_H,
                    inv.x, inv.y, INVADER_W, INVADER_H)) {
          state.invaders[i] = { ...inv, alive: false };
          state.score += INVADER_POINTS[inv.type];
          state.playerBullet = null;
          bulletConsumed = true;
          play('explosion');
          startInvaderMove();
        }
      }

      // vs UFO
      if (!bulletConsumed && state.ufo) {
        if (overlap(state.playerBullet.x, state.playerBullet.y, BULLET_W, BULLET_H,
                    state.ufo.x, state.ufo.y, UFO_W, UFO_H)) {
          state.score += state.ufo.points;
          state.playerBullet = null;
          bulletConsumed = true;
          state.ufo = null;
          play('ufoHit');
          startUfoTimer();
        }
      }

      // vs bunkers (bullet comes from below → check bottom-up)
      if (!bulletConsumed && state.playerBullet) {
        for (const bunker of state.bunkers) {
          if (overlap(state.playerBullet.x, state.playerBullet.y, BULLET_W, BULLET_H,
                      bunker.x, bunker.y, BUNKER_W, BUNKER_H)) {
            const localX = state.playerBullet.x + BULLET_W / 2 - bunker.x;
            const localY = state.playerBullet.y - bunker.y;
            if (hitBunker(bunker, localX, localY)) {
              state.playerBullet = null;
              bulletConsumed = true;
            }
            break;
          }
        }
      }
    }

    // Invader bullets vs player
    if (now > state.invincibleUntil) {
      for (let i = state.invaderBullets.length - 1; i >= 0; i--) {
        const b = state.invaderBullets[i];
        if (overlap(b.x, b.y, BULLET_W, BULLET_H,
                    state.playerX, state.playerY, PLAYER_W, PLAYER_H)) {
          state.invaderBullets.splice(i, 1);
          state.lives -= 1;
          state.invincibleUntil = now + 1500;
          play('playerHit');
          if (state.lives <= 0) { triggerGameOver(); return; }
        }
      }
    }

    // Invader bullets vs bunkers
    for (let bi = state.invaderBullets.length - 1; bi >= 0; bi--) {
      const b = state.invaderBullets[bi];
      for (const bunker of state.bunkers) {
        if (overlap(b.x, b.y, BULLET_W, BULLET_H, bunker.x, bunker.y, BUNKER_W, BUNKER_H)) {
          const localX = b.x + BULLET_W / 2 - bunker.x;
          const localY = b.y - bunker.y;
          if (hitBunker(bunker, localX, localY)) {
            state.invaderBullets.splice(bi, 1);
          }
          break;
        }
      }
    }

    // Next round?
    if (state.invaders.filter(i => i.alive).length === 0) {
      const nextRound = state.round + 1;
      initState(nextRound, state.score, state.lives);
      startInvaderMove();
    }

    setRenderTick(t => t + 1);
  }

  async function triggerGameOver() {
    stopAll();
    play('gameover');
    const state = gs.current;
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

  function confirmQuit() {
    stopAll();
    navigation.navigate('Home');
  }

  function restart() {
    stopAll();
    setIsNewHighscore(false);
    marchStepRef.current = 0;
    initState(1);
    setGamePhase('playing');
    startAll();
  }

  const state = gs.current;
  if (!state || gamePhase === 'loading') {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.loadingCenter}>
          <Text style={s.hudLabel}>LADEN...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const invincible = Date.now() < state.invincibleUntil;

  return (
    <SafeAreaView style={s.root}>
      {/* HUD */}
      <View style={s.hud}>
        <View style={s.hudCol}>
          <Text style={s.hudLabel}>SCORE</Text>
          <Text style={s.hudValue}>{String(state.score).padStart(4, '0')}</Text>
        </View>
        <View style={s.hudCol}>
          <Text style={s.hudLabel}>HI-SCORE</Text>
          <Text style={s.hudValue}>{String(Math.max(hiScore, state.score)).padStart(4, '0')}</Text>
        </View>
        <View style={s.hudCol}>
          <Text style={s.hudLabel}>{'♥ '.repeat(state.lives).trim()}</Text>
          <Text style={s.hudValue}>RND {state.round}</Text>
        </View>
      </View>

      {/* Field */}
      <View style={s.field}>
        {state.ufo && (
          <View style={{ position: 'absolute', left: state.ufo.x, top: state.ufo.y }}>
            <Ufo />
          </View>
        )}

        {state.invaders.map(inv => inv.alive && (
          <View key={inv.id} style={{ position: 'absolute', left: inv.x, top: inv.y }}>
            <Invader type={inv.type} phase={state.invaderPhase} />
          </View>
        ))}

        {state.bunkers.map(bunker => (
          <View key={bunker.id} style={{ position: 'absolute', left: bunker.x, top: bunker.y }}>
            <Bunker blocks={bunker.blocks} />
          </View>
        ))}

        {state.playerBullet && (
          <View style={[s.bullet, s.playerBullet, { left: state.playerBullet.x, top: state.playerBullet.y }]} />
        )}

        {state.invaderBullets.map(b => (
          <View key={b.id} style={[s.bullet, s.invaderBullet, { left: b.x, top: b.y }]} />
        ))}

        <View style={{ position: 'absolute', left: state.playerX, top: state.playerY }}>
          <PlayerShip invincible={invincible} />
        </View>

        <View style={[s.groundLine, { top: state.playerY + PLAYER_H + 2 }]} />

        {gamePhase === 'paused' && (
          <View style={s.overlay}>
            <Text style={s.overlayTitle}>PAUSE</Text>
            <TouchableOpacity style={s.overlayBtn} onPress={togglePause}>
              <Text style={s.overlayBtnText}>WEITER</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.overlayBtn, s.menuBtn]} onPress={confirmQuit}>
              <Text style={[s.overlayBtnText, { color: '#aaa' }]}>MENÜ</Text>
            </TouchableOpacity>
          </View>
        )}

        {gamePhase === 'gameover' && (
          <View style={s.overlay}>
            <Text style={s.overlayTitle}>GAME OVER</Text>
            <Text style={s.overlayScore}>{state.score} PUNKTE</Text>
            {isNewHighscore && <Text style={s.newHighscore}>★ NEUER HIGHSCORE ★</Text>}
            <TouchableOpacity style={s.overlayBtn} onPress={restart}>
              <Text style={s.overlayBtnText}>NOCHMAL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.overlayBtn, s.menuBtn]} onPress={confirmQuit}>
              <Text style={[s.overlayBtnText, { color: '#aaa' }]}>MENÜ</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controller with pause & menu buttons */}
      <View style={s.controllerRow}>
        <View style={s.sideButtons}>
          <TouchableOpacity style={s.sideBtn} onPress={togglePause}>
            <Text style={s.sideBtnText}>{gamePhase === 'paused' ? '▶' : '⏸'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.sideBtn, s.exitBtn]} onPress={confirmQuit}>
            <Text style={[s.sideBtnText, { color: '#888' }]}>✕</Text>
          </TouchableOpacity>
        </View>
        <GameController controlsRef={controlsRef} handedness={handedness} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hud: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderColor: '#0a2a0a' },
  hudCol: { alignItems: 'center', flex: 1 },
  hudLabel: { color: '#0f0', fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 },
  hudValue: { color: '#fff', fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold' },

  field: { width: SCREEN_W, height: FIELD_H, overflow: 'hidden' },

  bullet: { position: 'absolute', width: BULLET_W, height: BULLET_H, borderRadius: 1 },
  playerBullet: { backgroundColor: '#ffffff' },
  invaderBullet: { backgroundColor: '#ff4444' },

  groundLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#00aa00' },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', gap: 16 },
  overlayTitle: { color: '#0f0', fontFamily: 'monospace', fontSize: 30, fontWeight: 'bold', letterSpacing: 4 },
  overlayScore: { color: '#fff', fontFamily: 'monospace', fontSize: 20 },
  newHighscore: { color: '#ff0', fontFamily: 'monospace', fontSize: 15, letterSpacing: 2 },
  overlayBtn: { borderWidth: 2, borderColor: '#0f0', borderRadius: 4, paddingHorizontal: 28, paddingVertical: 10 },
  menuBtn: { borderColor: '#444' },
  overlayBtnText: { color: '#0f0', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold' },

  controllerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#050505', borderTopWidth: 1, borderColor: '#0a2a0a' },
  sideButtons: { flexDirection: 'column', gap: 6, paddingLeft: 8, paddingVertical: 8 },
  sideBtn: { width: 36, height: 36, borderWidth: 1, borderColor: '#333', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  exitBtn: { borderColor: '#2a2a2a' },
  sideBtnText: { color: '#0f0', fontFamily: 'monospace', fontSize: 16 },
});
