import { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView, Image,
} from 'react-native';
import GameController from '../components/GameController';
import { getHighscore, saveHighscore } from '../utils/storage';

const { width: SCREEN_W } = Dimensions.get('window');
const FIELD_H = Math.round(Dimensions.get('window').height * 0.58);

const PLAYER_W = 48;
const PLAYER_H = 32;
const INVADER_W = 36;
const INVADER_H = 28;
const BULLET_W = 4;
const BULLET_H = 14;

const COLS = 5;
const ROWS = 3;
const H_GAP = Math.floor((SCREEN_W - COLS * INVADER_W) / (COLS + 1));
const V_GAP = 12;
const INVADER_TOP = 40;

const DIFFICULTY_PARAMS = {
  easy:   { playerSpeed: 5, invaderBaseSpeed: 0.6, invaderShootInterval: 2200 },
  normal: { playerSpeed: 6, invaderBaseSpeed: 1.0, invaderShootInterval: 1500 },
  hard:   { playerSpeed: 7, invaderBaseSpeed: 1.5, invaderShootInterval: 900 },
};

function buildInvaders() {
  const grid = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      grid.push({
        id: `${row}-${col}`,
        x: H_GAP + col * (INVADER_W + H_GAP),
        y: INVADER_TOP + row * (INVADER_H + V_GAP),
        type: row,
        alive: true,
      });
    }
  }
  return grid;
}

function overlap(a, b, aw, ah, bw, bh) {
  return a.x < b.x + bw && a.x + aw > b.x && a.y < b.y + bh && a.y + ah > b.y;
}

const INVADER_COLORS = ['#f0f', '#0ff', '#ff0'];

export default function SpaceInvadersScreen({ navigation, route }) {
  const { difficulty = 'normal', soundEnabled = true, playerName = '' } = route.params ?? {};
  const params = DIFFICULTY_PARAMS[difficulty];

  const controlsRef = useRef({ left: false, right: false, fire: false });
  const stateRef = useRef(null);
  const loopRef = useRef(null);
  const invaderShootTimerRef = useRef(null);
  const soundsRef = useRef({});
  const [renderTick, setRenderTick] = useState(0);
  const [gamePhase, setGamePhase] = useState('playing'); // 'playing' | 'paused' | 'gameover'
  const [isNewHighscore, setIsNewHighscore] = useState(false);

  const initState = useCallback((round = 1) => {
    stateRef.current = {
      playerX: SCREEN_W / 2 - PLAYER_W / 2,
      playerY: FIELD_H - PLAYER_H - 10,
      lives: 3,
      score: 0,
      round,
      invaders: buildInvaders(),
      invaderDirX: 1,
      invaderSpeed: params.invaderBaseSpeed * (1 + (round - 1) * 0.2),
      playerBullet: null,
      invaderBullets: [],
      invincibleUntil: 0,
      lastFireTime: 0,
    };
  }, [params]);

  useEffect(() => {
    initState(1);
    loadSounds();
    startLoop();
    startInvaderShooting();
    return () => {
      stopLoop();
      stopInvaderShooting();
      unloadSounds();
    };
  }, []);

  async function loadSounds() {
    if (!soundEnabled) return;
    try {
      const { Audio } = await import('expo-av');
      const [shoot, explosion, gameover] = await Promise.all([
        Audio.Sound.createAsync(require('../assets/sounds/shoot.wav')),
        Audio.Sound.createAsync(require('../assets/sounds/explosion.wav')),
        Audio.Sound.createAsync(require('../assets/sounds/gameover.wav')),
      ]);
      soundsRef.current = {
        shoot: shoot.sound,
        explosion: explosion.sound,
        gameover: gameover.sound,
      };
    } catch (_) {}
  }

  async function playSound(name) {
    try {
      const snd = soundsRef.current[name];
      if (snd) {
        await snd.replayAsync();
      }
    } catch (_) {}
  }

  async function unloadSounds() {
    for (const snd of Object.values(soundsRef.current)) {
      try { await snd.unloadAsync(); } catch (_) {}
    }
    soundsRef.current = {};
  }

  function startLoop() {
    loopRef.current = setInterval(tick, 16);
  }

  function stopLoop() {
    if (loopRef.current) clearInterval(loopRef.current);
  }

  function startInvaderShooting() {
    invaderShootTimerRef.current = setInterval(invaderShoot, params.invaderShootInterval);
  }

  function stopInvaderShooting() {
    if (invaderShootTimerRef.current) clearInterval(invaderShootTimerRef.current);
  }

  function invaderShoot() {
    const gs = stateRef.current;
    if (!gs) return;
    const alive = gs.invaders.filter(inv => inv.alive);
    if (alive.length === 0) return;
    const shooter = alive[Math.floor(Math.random() * alive.length)];
    gs.invaderBullets.push({
      id: Date.now() + Math.random(),
      x: shooter.x + INVADER_W / 2 - BULLET_W / 2,
      y: shooter.y + INVADER_H,
    });
  }

  function tick() {
    const gs = stateRef.current;
    if (!gs) return;

    const now = Date.now();
    const ctrl = controlsRef.current;

    // Move player
    if (ctrl.left) gs.playerX = Math.max(0, gs.playerX - params.playerSpeed);
    if (ctrl.right) gs.playerX = Math.min(SCREEN_W - PLAYER_W, gs.playerX + params.playerSpeed);

    // Fire
    if (ctrl.fire && !gs.playerBullet && now - gs.lastFireTime > 300) {
      gs.playerBullet = {
        x: gs.playerX + PLAYER_W / 2 - BULLET_W / 2,
        y: gs.playerY,
      };
      gs.lastFireTime = now;
      playSound('shoot');
    }

    // Move player bullet
    if (gs.playerBullet) {
      gs.playerBullet.y -= 10;
      if (gs.playerBullet.y < 0) gs.playerBullet = null;
    }

    // Move invader bullets
    gs.invaderBullets = gs.invaderBullets
      .map(b => ({ ...b, y: b.y + 5 }))
      .filter(b => b.y < FIELD_H);

    // Move invaders
    const alive = gs.invaders.filter(i => i.alive);
    if (alive.length === 0) {
      // Next round
      const nextRound = gs.round + 1;
      const currentScore = gs.score;
      initState(nextRound);
      stateRef.current.score = currentScore;
      stateRef.current.lives = gs.lives;
      stateRef.current.invaderSpeed = params.invaderBaseSpeed * (1 + (nextRound - 1) * 0.2);
      setRenderTick(t => t + 1);
      return;
    }

    const leftmost = Math.min(...alive.map(i => i.x));
    const rightmost = Math.max(...alive.map(i => i.x + INVADER_W));
    let hitWall = false;
    if (gs.invaderDirX === 1 && rightmost + gs.invaderSpeed > SCREEN_W) hitWall = true;
    if (gs.invaderDirX === -1 && leftmost - gs.invaderSpeed < 0) hitWall = true;

    if (hitWall) {
      gs.invaders = gs.invaders.map(i => ({ ...i, y: i.y + 8 }));
      gs.invaderDirX *= -1;
    } else {
      gs.invaders = gs.invaders.map(i => ({ ...i, x: i.x + gs.invaderSpeed * gs.invaderDirX }));
    }

    // Check invader reached player level → Game Over
    const lowestYAfterMove = Math.max(...gs.invaders.filter(i => i.alive).map(i => i.y + INVADER_H));
    if (lowestYAfterMove >= gs.playerY) {
      endGame();
      return;
    }

    // Collisions: player bullet vs invaders
    if (gs.playerBullet) {
      for (let i = 0; i < gs.invaders.length; i++) {
        const inv = gs.invaders[i];
        if (!inv.alive) continue;
        if (overlap(gs.playerBullet, inv, BULLET_W, BULLET_H, INVADER_W, INVADER_H)) {
          gs.invaders[i] = { ...inv, alive: false };
          gs.playerBullet = null;
          gs.score += 10;
          playSound('explosion');
          break;
        }
      }
    }

    // Collisions: invader bullets vs player
    if (now > gs.invincibleUntil) {
      for (let i = gs.invaderBullets.length - 1; i >= 0; i--) {
        const b = gs.invaderBullets[i];
        if (overlap(b, { x: gs.playerX, y: gs.playerY }, BULLET_W, BULLET_H, PLAYER_W, PLAYER_H)) {
          gs.invaderBullets.splice(i, 1);
          gs.lives -= 1;
          gs.invincibleUntil = now + 1500;
          if (gs.lives <= 0) {
            endGame();
            return;
          }
        }
      }
    }

    setRenderTick(t => t + 1);
  }

  async function endGame() {
    stopLoop();
    stopInvaderShooting();
    playSound('gameover');
    const gs = stateRef.current;
    const prev = await getHighscore();
    if (gs.score > prev.score) {
      await saveHighscore(gs.score, playerName || 'Unbekannt');
      setIsNewHighscore(true);
    }
    setGamePhase('gameover');
  }

  function togglePause() {
    if (gamePhase === 'playing') {
      stopLoop();
      stopInvaderShooting();
      setGamePhase('paused');
    } else if (gamePhase === 'paused') {
      startLoop();
      startInvaderShooting();
      setGamePhase('playing');
    }
  }

  function restart() {
    stopLoop();
    stopInvaderShooting();
    setIsNewHighscore(false);
    initState(1);
    setGamePhase('playing');
    startLoop();
    startInvaderShooting();
  }

  const gs = stateRef.current;
  if (!gs) return null;

  const invincible = Date.now() < gs.invincibleUntil;

  return (
    <SafeAreaView style={s.root}>
      {/* HUD */}
      <View style={s.hud}>
        <Text style={s.hudText}>SCORE {gs.score}</Text>
        <TouchableOpacity onPress={togglePause} style={s.pauseBtn}>
          <Text style={s.pauseBtnText}>{gamePhase === 'paused' ? '▶' : '⏸'}</Text>
        </TouchableOpacity>
        <Text style={s.hudText}>
          {Array.from({ length: gs.lives }).map(() => '♥').join(' ')}
        </Text>
      </View>

      {/* Field */}
      <View style={s.field}>
        {/* Invaders */}
        {gs.invaders.map(inv => inv.alive && (
          <View
            key={inv.id}
            style={[s.invader, { left: inv.x, top: inv.y, borderColor: INVADER_COLORS[inv.type] }]}
          />
        ))}

        {/* Player bullet */}
        {gs.playerBullet && (
          <View style={[s.bullet, s.playerBullet, { left: gs.playerBullet.x, top: gs.playerBullet.y }]} />
        )}

        {/* Invader bullets */}
        {gs.invaderBullets.map(b => (
          <View key={b.id} style={[s.bullet, s.invaderBullet, { left: b.x, top: b.y }]} />
        ))}

        {/* Player */}
        <View style={[s.player, invincible && s.playerInvincible, { left: gs.playerX, top: gs.playerY }]} />

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
            <Text style={s.overlayScore}>{gs.score} Punkte</Text>
            {isNewHighscore && <Text style={s.newHighscore}>★ NEUER HIGHSCORE ★</Text>}
            <TouchableOpacity style={s.overlayBtn} onPress={restart}>
              <Text style={s.overlayBtnText}>NOCHMAL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.overlayBtn, s.menuBtn]} onPress={() => navigation.navigate('Home')}>
              <Text style={s.overlayBtnText}>MENÜ</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controller */}
      <GameController controlsRef={controlsRef} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  hud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#1a3a1a' },
  hudText: { color: '#0f0', fontFamily: 'monospace', fontSize: 14, minWidth: 80 },
  pauseBtn: { padding: 4 },
  pauseBtnText: { color: '#0f0', fontSize: 18 },

  field: { width: SCREEN_W, height: FIELD_H, overflow: 'hidden', position: 'relative' },

  invader: { position: 'absolute', width: INVADER_W, height: INVADER_H, borderWidth: 2, borderRadius: 3, backgroundColor: '#050505' },
  player: { position: 'absolute', width: PLAYER_W, height: PLAYER_H, backgroundColor: '#0f0', borderRadius: 4 },
  playerInvincible: { opacity: 0.3 },

  bullet: { position: 'absolute', width: BULLET_W, height: BULLET_H, borderRadius: 2 },
  playerBullet: { backgroundColor: '#ff0' },
  invaderBullet: { backgroundColor: '#f00' },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.82)', alignItems: 'center', justifyContent: 'center', gap: 14 },
  overlayTitle: { color: '#0f0', fontFamily: 'monospace', fontSize: 32, fontWeight: 'bold', letterSpacing: 4 },
  overlayScore: { color: '#fff', fontFamily: 'monospace', fontSize: 20 },
  newHighscore: { color: '#ff0', fontFamily: 'monospace', fontSize: 16, letterSpacing: 2 },
  overlayBtn: { borderWidth: 2, borderColor: '#0f0', borderRadius: 6, paddingHorizontal: 32, paddingVertical: 12 },
  menuBtn: { borderColor: '#555' },
  overlayBtnText: { color: '#0f0', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold' },
});
