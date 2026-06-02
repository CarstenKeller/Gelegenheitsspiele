import { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView,
} from 'react-native';
import DKController from '../components/DKController';
import {
  SpriteView,
  MARIO_SPRITES, MARIO_PX, MARIO_W_PX, MARIO_H_PX,
  KONG_SPRITES,  KONG_PX,  KONG_W_PX,  KONG_H_PX,
  PRINCESS_SPRITES, PRINCESS_PX, PRINCESS_W_PX, PRINCESS_H_PX,
  BARREL_SPRITE, BARREL_PX, BARREL_W_PX, BARREL_H_PX,
} from '../components/DKSprites';
import {
  FIELD_H, PLAT_H, LADDER_W,
  MARIO_W, MARIO_H, BARREL_SIZE,
  GRAVITY, JUMP_VY, MAX_FALL, BARREL_FALL_SPD,
  PLATFORMS, LADDERS,
  KONG_X, KONG_Y, PRINCESS_X, PRINCESS_Y,
  MARIO_START_X, MARIO_START_Y,
  barrelSpeed, barrelInterval, ladderFallChance,
} from '../utils/dkLevel';
import { preloadDKSounds, playDKSound, unloadDKSounds } from '../utils/dkSounds';
import { getHighscore, saveHighscore } from '../utils/storage';

const { width: SCREEN_W } = Dimensions.get('window');
const ANIM_INTERVAL = 180; // ms between walk animation frames
const GIRDER_TOP    = '#ff7722';
const GIRDER_FRONT  = '#cc4400';
const GIRDER_SHADE  = '#882200';
const LADDER_RAIL   = '#ddbb00';
const LADDER_RUNG   = '#ffee44';
const PLATFORM_COUNT = PLATFORMS.length;

function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function landOnPlatform(mario) {
  for (const plat of PLATFORMS) {
    const onX = mario.x + MARIO_W > plat.x && mario.x < plat.x + plat.width;
    if (!onX) continue;
    const bottom = mario.y + MARIO_H;
    const prevBottom = bottom - mario.vy;
    if (mario.vy >= 0 && prevBottom <= plat.y + 1 && bottom >= plat.y) {
      return plat;
    }
  }
  return null;
}

function findLadder(mario) {
  const cx = mario.x + MARIO_W / 2;
  for (const lad of LADDERS) {
    const lx = lad.x + LADDER_W / 2;
    if (Math.abs(cx - lx) < LADDER_W * 0.9 &&
        mario.y + MARIO_H > lad.topY - 6 &&
        mario.y < lad.bottomY + 6) {
      return lad;
    }
  }
  return null;
}

function initMario() {
  return {
    x: MARIO_START_X, y: MARIO_START_Y,
    vx: 0, vy: 0,
    onGround: true, ladder: null,
    facing: 'right',
    state: 'idle',   // idle | walk | jump | climb | die
    animPhase: 0, animTimer: 0,
    invincibleUntil: 0,
    dieTimer: 0,
  };
}

function spawnBarrel(round) {
  return {
    id: Date.now() + Math.random(),
    x: KONG_X + KONG_W_PX / 2,
    y: KONG_Y,
    vx: barrelSpeed(round) * PLATFORMS[4].rollDir,
    vy: 0,
    onGround: false,
    platId: null,
    ladderFall: null,
    scored: false,
  };
}

export default function DonkeyKongScreen({ navigation, route }) {
  const { soundEnabled = true, playerName = '', handedness = 'right' } = route.params ?? {};

  // ── intro state ──────────────────────────────────────────────────────────
  // phases: loading → title → mariorun → climb → taunt → playing | gameover | win
  const [phase, setPhase] = useState('loading');
  const [kongIntroX, setKongIntroX] = useState(-KONG_W_PX);
  const [kongIntroY, setKongIntroY] = useState(FIELD_H - MARIO_H_PX - KONG_H_PX);
  const [kongIntroPhase, setKongIntroPhase] = useState(0);
  const [marioIntroX, setMarioIntroX] = useState(-MARIO_W_PX);
  const [marioIntroPhase, setMarioIntroPhase] = useState(0);
  const [princessVisible, setPrincessVisible] = useState(false);
  const [introText, setIntroText] = useState('');
  const [hiScore, setHiScore] = useState(0);
  const [isNewHS, setIsNewHS] = useState(false);
  const [renderTick, setRenderTick] = useState(0);

  // ── game state ────────────────────────────────────────────────────────────
  const gs = useRef(null);
  const ctrlRef = useRef({ left: false, right: false, up: false, down: false, jump: false });
  const jumpPressed = useRef(false);
  const loopRef = useRef(null);
  const barrelTimerRef = useRef(null);
  const soundReady = useRef(false);
  const kongAnimRef = useRef(null);

  // ── load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hs = await getHighscore('donkeykong');
      if (!cancelled) setHiScore(hs.score);
      if (soundEnabled) { try { await preloadDKSounds(); } catch (_) {} }
      soundReady.current = true;
      if (!cancelled) setPhase('title');
    })();
    return () => {
      cancelled = true;
      stopGame();
      if (soundEnabled) unloadDKSounds();
    };
  }, []);

  function play(name) { if (soundEnabled && soundReady.current) playDKSound(name); }

  // ── intro state machine ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'title') {
      play('dk_intro');
      const t = setTimeout(() => setPhase('mariorun'), 2000);
      return () => clearTimeout(t);
    }

    if (phase === 'mariorun') {
      // Mario runs in from left on bottom platform
      let mx = -MARIO_W_PX;
      let mph = 0;
      const marioTarget = MARIO_START_X + 20;
      const iv = setInterval(() => {
        mx += 3;
        mph = (mph + 1) % 2;
        setMarioIntroX(mx);
        setMarioIntroPhase(mph);
        if (mx >= marioTarget) {
          clearInterval(iv);
          setPhase('climb');
        }
      }, 40);
      return () => clearInterval(iv);
    }

    if (phase === 'climb') {
      // Kong runs in from left on bottom platform, then climbs to top
      let kx = -KONG_W_PX;
      let ky = PLATFORMS[0].y - KONG_H_PX;
      let kph = 0;
      const targetX = PLATFORMS[0].x + 10;
      // First: walk right
      const walkIv = setInterval(() => {
        kx += 4;
        kph = (kph + 1) % 2;
        setKongIntroX(kx);
        setKongIntroY(ky);
        setKongIntroPhase(kph);
        if (kx >= targetX) {
          clearInterval(walkIv);
          // Then: jump-climb up to top
          const climbIv = setInterval(() => {
            ky -= 6;
            kph = (kph + 1) % 2;
            setKongIntroY(ky);
            setKongIntroPhase(kph);
            if (ky <= KONG_Y) {
              clearInterval(climbIv);
              setKongIntroX(KONG_X);
              setKongIntroY(KONG_Y);
              setPrincessVisible(true);
              setPhase('taunt');
            }
          }, 30);
        }
      }, 40);
      return () => clearInterval(walkIv);
    }

    if (phase === 'taunt') {
      setIntroText('HELP!');
      let ph = 0;
      kongAnimRef.current = setInterval(() => {
        ph = (ph + 1) % 2;
        setKongIntroPhase(ph);
      }, 200);
      const t = setTimeout(() => {
        clearInterval(kongAnimRef.current);
        setIntroText('');
        startGame();
      }, 2500);
      return () => { clearTimeout(t); clearInterval(kongAnimRef.current); };
    }
  }, [phase]);

  // ── game start / stop ─────────────────────────────────────────────────────
  function startGame() {
    gs.current = {
      mario: initMario(),
      barrels: [],
      score: 0,
      lives: 3,
      round: 1,
      kongPhase: 0,
      kongThrowTimer: 0,
    };
    setPhase('playing');
    loopRef.current = setInterval(gameTick, 16);
    scheduleBarrel();
  }

  function stopGame() {
    if (loopRef.current) { clearInterval(loopRef.current); loopRef.current = null; }
    if (barrelTimerRef.current) { clearTimeout(barrelTimerRef.current); barrelTimerRef.current = null; }
  }

  function scheduleBarrel() {
    if (barrelTimerRef.current) clearTimeout(barrelTimerRef.current);
    const state = gs.current;
    if (!state) return;
    barrelTimerRef.current = setTimeout(() => {
      if (!gs.current) return;
      gs.current.barrels.push(spawnBarrel(gs.current.round));
      gs.current.kongPhase = 1; // throw pose
      play('dk_barrel');
      setTimeout(() => { if (gs.current) gs.current.kongPhase = 0; }, 400);
      scheduleBarrel();
    }, barrelInterval(state.round));
  }

  // ── game tick ─────────────────────────────────────────────────────────────
  function gameTick() {
    const state = gs.current;
    if (!state) return;
    const now = Date.now();
    const ctrl = ctrlRef.current;
    const mario = state.mario;

    if (mario.state === 'die') {
      mario.dieTimer--;
      if (mario.dieTimer <= 0) {
        state.lives--;
        if (state.lives <= 0) {
          triggerGameOver();
          return;
        }
        state.mario = initMario();
        state.barrels = [];
      }
      setRenderTick(t => t + 1);
      return;
    }

    // ── jump trigger (edge-detect) ──
    if (ctrl.jump && !jumpPressed.current) {
      jumpPressed.current = true;
      if ((mario.onGround || mario.ladder) && mario.state !== 'die') {
        mario.vy = JUMP_VY;
        mario.onGround = false;
        mario.ladder = null;
        mario.state = 'jump';
        play('dk_jump');
      }
    }
    if (!ctrl.jump) jumpPressed.current = false;

    // ── ladder logic ──
    const nearLadder = findLadder(mario);
    if (!mario.onGround && nearLadder) {
      if (ctrl.up && mario.y + MARIO_H > nearLadder.topY) {
        mario.ladder = nearLadder;
      }
      if (ctrl.down && mario.y < nearLadder.bottomY) {
        mario.ladder = nearLadder;
      }
    } else if (mario.onGround && nearLadder) {
      if (ctrl.up) {
        mario.ladder = nearLadder;
        mario.onGround = false;
      }
    }

    if (mario.ladder) {
      mario.vy = 0;
      mario.vx = 0;
      if (ctrl.up)   { mario.y -= 1.5; mario.state = 'climb'; }
      if (ctrl.down) { mario.y += 1.5; mario.state = 'climb'; }
      if (!ctrl.up && !ctrl.down) mario.state = 'climb';

      // Exit ladder at top/bottom
      if (mario.y + MARIO_H <= mario.ladder.topY) {
        mario.y = mario.ladder.topY - MARIO_H;
        mario.ladder = null; mario.onGround = true; mario.state = 'idle';
      } else if (mario.y + MARIO_H >= mario.ladder.bottomY + PLAT_H) {
        mario.ladder = null; mario.onGround = true; mario.state = 'idle';
      }
    } else {
      // ── horizontal movement ──
      if (!mario.onGround || mario.state !== 'climb') {
        if (ctrl.left)  { mario.vx = -2; mario.facing = 'left'; if (mario.onGround) mario.state = 'walk'; }
        else if (ctrl.right) { mario.vx = 2; mario.facing = 'right'; if (mario.onGround) mario.state = 'walk'; }
        else { mario.vx = 0; if (mario.onGround) mario.state = 'idle'; }
      }

      // ── gravity + vertical movement ──
      if (!mario.onGround) {
        mario.vy = Math.min(mario.vy + GRAVITY, MAX_FALL);
      }
      mario.x += mario.vx;
      mario.y += mario.vy;

      // ── clamp to screen ──
      mario.x = Math.max(0, Math.min(SCREEN_W - MARIO_W, mario.x));

      // ── platform landing ──
      const plat = landOnPlatform(mario);
      if (plat) {
        mario.y = plat.y - MARIO_H;
        mario.vy = 0;
        mario.onGround = true;
        if (mario.state === 'jump') { mario.state = ctrl.left || ctrl.right ? 'walk' : 'idle'; }
        play('dk_land');
      } else if (mario.vy > 0) {
        mario.onGround = false;
      }
    }

    // ── animation tick ──
    mario.animTimer += 16;
    if (mario.animTimer >= ANIM_INTERVAL) {
      mario.animPhase = (mario.animPhase + 1) % 2;
      mario.animTimer = 0;
    }

    // ── barrel updates ──
    const nextBarrels = [];
    for (const b of state.barrels) {
      updateBarrel(b, state.round);
      if (!b.remove) nextBarrels.push(b);
    }
    state.barrels = nextBarrels;

    // ── barrel vs mario collision ──
    if (now > mario.invincibleUntil && mario.state !== 'die') {
      for (const b of state.barrels) {
        if (overlap(mario.x, mario.y, MARIO_W, MARIO_H, b.x, b.y, BARREL_SIZE, BARREL_SIZE)) {
          mario.state = 'die';
          mario.dieTimer = 80;
          play('dk_death');
          state.barrels = [];
          break;
        }
      }
    }

    // ── barrel jump scoring ──
    for (const b of state.barrels) {
      if (!b.scored && mario.state === 'jump' && mario.vy < 0) {
        const bCX = b.x + BARREL_SIZE / 2;
        const mCX = mario.x + MARIO_W / 2;
        if (Math.abs(bCX - mCX) < MARIO_W && mario.y + MARIO_H < b.y + BARREL_SIZE) {
          b.scored = true;
          state.score += 100;
          play('dk_score');
        }
      }
    }

    // ── win condition ──
    if (mario.y <= PLATFORMS[4].y - MARIO_H + 4 &&
        mario.x + MARIO_W >= PRINCESS_X &&
        mario.x <= PRINCESS_X + PRINCESS_W_PX) {
      triggerWin();
      return;
    }

    setRenderTick(t => t + 1);
  }

  function updateBarrel(b, round) {
    // Falling through ladder
    if (b.ladderFall !== null) {
      b.y += BARREL_FALL_SPD;
      const lad = LADDERS.find(l => l.id === b.ladderFall);
      if (!lad) { b.remove = true; return; }
      const targetPlat = PLATFORMS.find(p => Math.abs(p.y - lad.bottomY) < 4);
      if (targetPlat && b.y + BARREL_SIZE >= targetPlat.y) {
        b.y = targetPlat.y - BARREL_SIZE;
        b.ladderFall = null;
        b.onGround = true;
        b.platId = targetPlat.id;
        b.vx = barrelSpeed(round) * targetPlat.rollDir;
      }
      return;
    }

    if (b.onGround) {
      b.x += b.vx;
      const plat = PLATFORMS.find(p => p.id === b.platId);
      if (!plat) { b.remove = true; return; }

      const offLeft  = b.x < plat.x;
      const offRight = b.x + BARREL_SIZE > plat.x + plat.width;

      if (offLeft || offRight) {
        // Check for ladder to fall through
        const barrelCX = b.x + BARREL_SIZE / 2;
        const nearLad = LADDERS.find(l => {
          const ladCX = l.x + LADDER_W / 2;
          return Math.abs(barrelCX - ladCX) < LADDER_W + 4 &&
                 Math.abs(l.bottomY - plat.y) < PLAT_H + 2;
        });

        if (nearLad && b.platId > 0 && Math.random() < ladderFallChance(round)) {
          b.x = nearLad.x + (LADDER_W - BARREL_SIZE) / 2;
          b.ladderFall = nearLad.id;
          b.onGround = false;
          b.platId = null;
          b.vx = 0;
        } else {
          // Fall off edge
          b.onGround = false;
          b.platId = null;
          b.vy = 0;
        }
      }
    } else {
      // In air – apply both gravity and horizontal momentum
      b.vy = Math.min(b.vy + GRAVITY, MAX_FALL);
      b.y += b.vy;
      b.x += b.vx;

      let landed = false;
      for (const plat of PLATFORMS) {
        if (b.x + BARREL_SIZE > plat.x && b.x < plat.x + plat.width) {
          const prev = b.y + BARREL_SIZE - b.vy;
          if (b.vy >= 0 && prev <= plat.y + 2 && b.y + BARREL_SIZE >= plat.y) {
            b.y = plat.y - BARREL_SIZE;
            b.vy = 0;
            b.onGround = true;
            b.platId = plat.id;
            b.vx = barrelSpeed(round) * plat.rollDir;
            landed = true;
            break;
          }
        }
      }

      if (!landed && b.y > FIELD_H + 40) b.remove = true;
    }
  }

  async function triggerGameOver() {
    stopGame();
    play('dk_death');
    const state = gs.current;
    const prev = await getHighscore('donkeykong');
    if (state.score > prev.score) {
      await saveHighscore(state.score, playerName || 'Unbekannt', 'donkeykong');
      setHiScore(state.score);
      setIsNewHS(true);
    }
    setPhase('gameover');
  }

  async function triggerWin() {
    stopGame();
    play('dk_win');
    const state = gs.current;
    const bonus = Math.max(300, 1000 - state.round * 50);
    state.score += bonus;
    // Next round
    state.round++;
    state.mario = initMario();
    state.barrels = [];
    const prev = await getHighscore('donkeykong');
    if (state.score > prev.score) {
      await saveHighscore(state.score, playerName || 'Unbekannt', 'donkeykong');
      setHiScore(state.score);
      setIsNewHS(true);
    }
    setPhase('win');
  }

  function restartAfterWin() {
    setIsNewHS(false);
    setPhase('playing');
    loopRef.current = setInterval(gameTick, 16);
    scheduleBarrel();
  }

  function restart() {
    stopGame();
    setIsNewHS(false);
    gs.current = {
      mario: initMario(), barrels: [], score: 0, lives: 3, round: 1,
      kongPhase: 0, kongThrowTimer: 0,
    };
    setPhase('playing');
    loopRef.current = setInterval(gameTick, 16);
    scheduleBarrel();
  }

  // ── render ────────────────────────────────────────────────────────────────
  const state = gs.current;

  function renderLevel() {
    return <>
      {PLATFORMS.map(plat => {
        const deg = plat.tiltDeg || 0;
        // Adjust top so visual slope center aligns with physics y
        const tiltOffset = Math.abs(deg) > 0 ? Math.round(plat.width * Math.sin(Math.abs(deg) * Math.PI / 180) / 2) : 0;
        const adjustedTop = deg > 0 ? plat.y - tiltOffset : deg < 0 ? plat.y + tiltOffset : plat.y;
        return (
          <View key={plat.id} style={{
            position: 'absolute', left: plat.x, top: adjustedTop,
            width: plat.width, height: PLAT_H + 4,
            transform: deg !== 0 ? [{ rotate: `${deg}deg` }] : undefined,
          }}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: GIRDER_TOP }} />
            <View style={{ position: 'absolute', top: 2, left: 0, right: 0, bottom: 2, backgroundColor: GIRDER_FRONT }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: GIRDER_SHADE }} />
          </View>
        );
      })}
      {LADDERS.map(lad => {
        const h = lad.bottomY - lad.topY;
        const rungs = Math.floor(h / 9);
        return (
          <View key={lad.id} style={{ position: 'absolute', left: lad.x, top: lad.topY, width: LADDER_W, height: h }}>
            <View style={{ position: 'absolute', top: 0, left: 2, width: 2, bottom: 0, backgroundColor: LADDER_RAIL }} />
            <View style={{ position: 'absolute', top: 0, right: 2, width: 2, bottom: 0, backgroundColor: LADDER_RAIL }} />
            {Array.from({ length: rungs }).map((_, i) => (
              <View key={i} style={{ position: 'absolute', top: i * 9 + 4, left: 2, right: 2, height: 2, backgroundColor: LADDER_RUNG }} />
            ))}
          </View>
        );
      })}
    </>;
  }

  // Loading screen
  if (phase === 'loading') {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.center}><Text style={s.titleText}>LADEN...</Text></View>
      </SafeAreaView>
    );
  }

  // Intro screens
  if (phase === 'title' || phase === 'mariorun' || phase === 'climb' || phase === 'taunt') {
    const introMarioSprite = marioIntroPhase === 0 ? MARIO_SPRITES.walkA : MARIO_SPRITES.walkB;
    const introKongSprite  = KONG_SPRITES[kongIntroPhase === 0 ? 'idle' : 'throw'];
    const marioFloorY = PLATFORMS[0].y - MARIO_H_PX;
    return (
      <SafeAreaView style={s.root}>
        <TouchableOpacity style={s.fullField} activeOpacity={1} onPress={() => { stopGame(); startGame(); }}>
          <View style={[s.field, { height: FIELD_H }]}>
            {renderLevel()}

            {/* Mario intro – runs in from left */}
            {(phase === 'mariorun' || phase === 'climb' || phase === 'taunt') && (
              <View style={{ position: 'absolute', left: phase === 'mariorun' ? marioIntroX : MARIO_START_X + 20, top: marioFloorY }}>
                <SpriteView pixels={introMarioSprite}
                  pixelSize={MARIO_PX} width={MARIO_W_PX} height={MARIO_H_PX} />
              </View>
            )}

            {/* Kong intro – walks in, then climbs */}
            {(phase === 'climb' || phase === 'taunt') && (
              <View style={{ position: 'absolute', left: kongIntroX, top: kongIntroY }}>
                <SpriteView pixels={introKongSprite}
                  pixelSize={KONG_PX} width={KONG_W_PX} height={KONG_H_PX} />
              </View>
            )}

            {/* Princess appears after Kong reaches top */}
            {princessVisible && (
              <View style={{ position: 'absolute', left: PRINCESS_X, top: PRINCESS_Y }}>
                <SpriteView pixels={PRINCESS_SPRITES.wave0}
                  pixelSize={PRINCESS_PX} width={PRINCESS_W_PX} height={PRINCESS_H_PX} />
              </View>
            )}

            {introText !== '' && (
              <View style={[s.introTextBox, { top: KONG_Y - 28, left: KONG_X + KONG_W_PX + 4 }]}>
                <Text style={s.helpText}>{introText}</Text>
              </View>
            )}

            {phase === 'title' && (
              <View style={s.titleOverlay}>
                <Text style={s.titleText}>DONKEY KONG</Text>
                <Text style={s.subText}>── HOW HIGH CAN YOU GET? ──</Text>
                <Text style={[s.subText, { marginTop: 20 }]}>Tippen zum Überspringen</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Playing / Win / Gameover
  const mario = state?.mario;
  const marioSprite = mario?.state === 'jump'  ? MARIO_SPRITES.jump
    : mario?.state === 'climb' ? MARIO_SPRITES[mario.animPhase === 0 ? 'climbA' : 'climbB']
    : mario?.state === 'die'   ? MARIO_SPRITES.die
    : mario?.animPhase === 0   ? MARIO_SPRITES.walkA
    :                            MARIO_SPRITES.walkB;

  return (
    <SafeAreaView style={s.root}>
      {/* HUD */}
      <View style={s.hud}>
        <View style={s.hudCol}>
          <Text style={s.hudLabel}>SCORE</Text>
          <Text style={s.hudValue}>{String(state?.score ?? 0).padStart(5, '0')}</Text>
        </View>
        <View style={s.hudCol}>
          <Text style={s.hudLabel}>HI</Text>
          <Text style={s.hudValue}>{String(Math.max(hiScore, state?.score ?? 0)).padStart(5, '0')}</Text>
        </View>
        <View style={s.hudCol}>
          <Text style={s.hudLabel}>{'♥ '.repeat(state?.lives ?? 0).trim()}</Text>
          <Text style={s.hudValue}>RND {state?.round ?? 1}</Text>
        </View>
      </View>

      {/* Field */}
      <View style={[s.field, { height: FIELD_H }]}>
        {renderLevel()}

        {/* Kong */}
        <View style={{ position: 'absolute', left: KONG_X, top: KONG_Y }}>
          <SpriteView pixels={KONG_SPRITES[state?.kongPhase === 1 ? 'throw' : 'idle']}
            pixelSize={KONG_PX} width={KONG_W_PX} height={KONG_H_PX} />
        </View>

        {/* Princess */}
        <View style={{ position: 'absolute', left: PRINCESS_X, top: PRINCESS_Y }}>
          <SpriteView pixels={PRINCESS_SPRITES[renderTick % 60 < 30 ? 'wave0' : 'wave1']}
            pixelSize={PRINCESS_PX} width={PRINCESS_W_PX} height={PRINCESS_H_PX} />
        </View>

        {/* Barrels */}
        {state?.barrels.map(b => (
          <View key={b.id} style={{ position: 'absolute', left: b.x, top: b.y }}>
            <SpriteView pixels={BARREL_SPRITE} pixelSize={BARREL_PX}
              width={BARREL_W_PX} height={BARREL_H_PX} />
          </View>
        ))}

        {/* Mario */}
        {mario && (
          <View style={{ position: 'absolute', left: mario.x, top: mario.y }}>
            <SpriteView pixels={marioSprite} pixelSize={MARIO_PX}
              width={MARIO_W_PX} height={MARIO_H_PX}
              flipX={mario.facing === 'left'} />
          </View>
        )}

        {/* Win overlay */}
        {phase === 'win' && (
          <View style={s.overlay}>
            <Text style={[s.overlayTitle, { color: '#ffaa00' }]}>RESCUED!</Text>
            <Text style={s.overlayScore}>{state?.score} PUNKTE</Text>
            {isNewHS && <Text style={s.newHS}>★ NEUER HIGHSCORE ★</Text>}
            <TouchableOpacity style={s.overlayBtn} onPress={restartAfterWin}>
              <Text style={s.overlayBtnText}>WEITER</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.overlayBtn, s.menuBtn]} onPress={() => navigation.navigate('Home')}>
              <Text style={[s.overlayBtnText, { color: '#aaa' }]}>MENÜ</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Game Over overlay */}
        {phase === 'gameover' && (
          <View style={s.overlay}>
            <Text style={s.overlayTitle}>GAME OVER</Text>
            <Text style={s.overlayScore}>{state?.score} PUNKTE</Text>
            {isNewHS && <Text style={s.newHS}>★ NEUER HIGHSCORE ★</Text>}
            <TouchableOpacity style={s.overlayBtn} onPress={restart}>
              <Text style={s.overlayBtnText}>NOCHMAL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.overlayBtn, s.menuBtn]} onPress={() => navigation.navigate('Home')}>
              <Text style={[s.overlayBtnText, { color: '#aaa' }]}>MENÜ</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Action bar */}
      <View style={s.actionBar}>
        <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={[s.actionBtnText, { color: '#666' }]}>✕ MENÜ</Text>
        </TouchableOpacity>
      </View>

      <DKController ctrlRef={ctrlRef} handedness={handedness} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fullField: { flex: 1 },

  hud: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 5, borderBottomWidth: 1, borderColor: '#1a0800' },
  hudCol: { alignItems: 'center', flex: 1 },
  hudLabel: { color: '#ffaa00', fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 },
  hudValue: { color: '#fff', fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold' },

  field: { width: SCREEN_W, overflow: 'hidden' },

  titleOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', gap: 12 },
  titleText: { color: '#ffaa00', fontFamily: 'monospace', fontSize: 28, fontWeight: 'bold', letterSpacing: 4 },
  subText: { color: '#888', fontFamily: 'monospace', fontSize: 12 },
  introTextBox: { position: 'absolute' },
  helpText: { color: '#ff88aa', fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold' },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', gap: 14 },
  overlayTitle: { color: '#ffaa00', fontFamily: 'monospace', fontSize: 28, fontWeight: 'bold', letterSpacing: 3 },
  overlayScore: { color: '#fff', fontFamily: 'monospace', fontSize: 18 },
  newHS: { color: '#ff0', fontFamily: 'monospace', fontSize: 13, letterSpacing: 2 },
  overlayBtn: { borderWidth: 2, borderColor: '#ffaa00', borderRadius: 4, paddingHorizontal: 28, paddingVertical: 10 },
  menuBtn: { borderColor: '#444' },
  overlayBtnText: { color: '#ffaa00', fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' },

  actionBar: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 5, backgroundColor: '#050505', borderTopWidth: 1, borderColor: '#1a0800' },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 3, borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 4 },
  actionBtnText: { color: '#ffaa00', fontFamily: 'monospace', fontSize: 12 },
});
