'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  GameState,
  BuildSummary,
  ToastItem,
  PhaseId,
  CapturedImage,
} from '../lib/types';
import {
  createDefaultState,
  SLOTS,
  LAUNCHERS,
  PHASES,
} from '../lib/constants';
import { Physics } from '../lib/physics';
import { playSoundEffect, playTone, isSoundEnabled, setSoundEnabled } from '../lib/audio';

const STORAGE_KEY = 'mars-orbital-mission-v2';
const CHECKPOINT_KEY = 'mars-mission-v3-checkpoint';

export interface GameContextValue {
  state: GameState;
  build: BuildSummary;
  toasts: ToastItem[];
  hasSavedGame: boolean;
  soundOn: boolean;
  activeModal: 'none' | 'intro' | 'help' | 'confirm-restart' | 'end-report';
  setActiveModal: (m: 'none' | 'intro' | 'help' | 'confirm-restart' | 'end-report') => void;
  toggleSound: () => void;
  startMission: () => void;
  continueMission: () => void;
  resetMission: () => void;
  retryStage: () => void;
  setBuildTab: (tab: 'component' | 'rocket' | 'test') => void;
  setSlotFocus: (idx: number) => void;
  setSlotChoice: (slotIdx: number, choiceIdx: number) => void;
  setLauncher: (idx: number) => void;
  updateRange: (id: string, value: number) => void;
  executeAction: (action: string) => void;
  addToast: (msg: string, kind?: 'good' | 'warn' | 'bad') => void;
  addLog: (msg: string, kind?: 'info' | 'good' | 'warn') => void;
  usedMemory: () => number;
  availablePower: () => number;
  powerDraw: () => number;
  powerFraction: () => number;
  cruiseTarget: () => { along: number; lateral: number };
  targetTrim: () => number;
  requiredPasses: () => number;
  photoCapacity: () => { imageSize: number; memory: number; maxPhotos: number; targetPhotos: number };
  motionTimes: React.MutableRefObject<Record<string, number>>;
  launchFX: React.MutableRefObject<Record<string, number>>;
}

const GameContext = createContext<GameContextValue | null>(null);

function cap(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function clone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

function jitter(value: number, min: number, max: number, step: number, lower?: number): number {
  let n = value;
  for (let i = 0; i < 10 && Math.abs(n - value) < (lower || step); i++) {
    n = cap(
      value + Math.round(((Math.random() * 2 - 1) * Math.max(step * 4, (max - min) * 0.2)) / step) * step,
      min,
      max
    );
  }
  return n;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(() => createDefaultState());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [activeModal, setActiveModal] = useState<'none' | 'intro' | 'help' | 'confirm-restart' | 'end-report'>('intro');

  const motionTimes = useRef<Record<string, number>>({});
  const launchFX = useRef<Record<string, number>>({
    ignition: 0,
    stage: 0,
    fairing: 0,
    detach: 0,
    solar: 0,
    antenna: 0,
  });

  const checkpointRef = useRef<{ phase: PhaseId; state: GameState } | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const build = Physics.loadout(
    state.slot.map((idx, i) => SLOTS[i].opts[idx]),
    LAUNCHERS[state.launcher],
    state.budget
  );

  // Check saved game on mount
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (p && p.started && p.phase && p.mission) {
        setHasSavedGame(true);
      }
      const cp = JSON.parse(localStorage.getItem(CHECKPOINT_KEY) || 'null');
      if (cp) {
        checkpointRef.current = cp;
      }
    } catch {
      // ignore
    }
  }, []);

  const addToast = useCallback((msg: string, kind: 'good' | 'warn' | 'bad' = 'good') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [{ id, msg, kind }, ...prev.slice(0, 3)]);
    playTone(kind === 'bad' ? 270 : kind === 'warn' ? 440 : 690, kind === 'bad' ? 0.35 : 0.12);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4400);
  }, []);

  const addLog = useCallback((msg: string, kind: 'info' | 'good' | 'warn' = 'info') => {
    setState((prev) => {
      const time = prev.elapsed.toFixed(0).padStart(3, '0');
      const logs = [{ time, msg, kind }, ...prev.logs.slice(0, 11)];
      return { ...prev, logs };
    });
  }, []);

  const saveToStorage = useCallback((s: GameState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      if (checkpointRef.current) {
        localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpointRef.current));
      }
    } catch {
      // ignore
    }
  }, []);

  const randomizeSliders = useCallback((p: PhaseId, draft: GameState) => {
    const l = draft.launch;
    const o = draft.orbit;
    const t = draft.tmi;
    const c = draft.capture;
    const cr = draft.cruise;
    const d = l.deviation;
    const a = t.angle;
    const target = {
      along: Math.round(12 + d * 0.23),
      lateral: Math.round(-4 + a * 0.7 + d * 0.13),
    };

    if (p === 'launch') {
      l.throttle = jitter(88, 65, 100, 1, 5);
      l.guidance = jitter(0, -25, 25, 1, 4);
      l.roll = jitter(0, -20, 20, 1, 3);
    } else if (p === 'parking') {
      o.burn = jitter(335, 250, 420, 1, 12);
      o.angle = jitter(0, -15, 15, 1, 3);
    } else if (p === 'tmi') {
      t.burn = jitter(3150, 2920, 3380, 10, 40);
      t.angle = jitter(0, -12, 12, 1, 3);
    } else if (p === 'cruise') {
      cr.along = jitter(target.along, -25, 35, 1, 7);
      cr.lateral = jitter(target.lateral, -20, 20, 1, 5);
    } else if (p === 'capture') {
      c.burn = jitter(940, 760, 1130, 5, 25);
      c.angle = jitter(0, -12, 12, 1, 3);
      c.peri = jitter(150, 115, 200, 1, 10);
      c.trim = jitter(280, 160, 400, 1, 15);
      c.incl = jitter(93, 86, 100, 1, 2);
    }
  }, []);

  const makeCheckpoint = useCallback((s: GameState) => {
    if (s.phase === 'end') return;
    const snapshot = clone(s);
    checkpointRef.current = { phase: s.phase, state: snapshot };
    try {
      localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpointRef.current));
    } catch {
      // ignore
    }
  }, []);

  const setPhase = useCallback(
    (next: PhaseId, msg?: string) => {
      setState((prev) => {
        const nextState = clone(prev);
        nextState.phase = next;
        if (msg) {
          const time = nextState.elapsed.toFixed(0).padStart(3, '0');
          nextState.logs = [{ time, msg, kind: 'good' }, ...nextState.logs.slice(0, 11)];
        }
        if (next !== 'end') {
          randomizeSliders(next, nextState);
          motionTimes.current[next] = 0;
          makeCheckpoint(nextState);
        }
        saveToStorage(nextState);
        return nextState;
      });
    },
    [makeCheckpoint, randomizeSliders, saveToStorage]
  );

  const fail = useCallback(
    (reason: string) => {
      setState((prev) => {
        if (prev.mission.result) return prev;
        const next = clone(prev);
        const p = next.phase;
        next.v3attempts[p] = (next.v3attempts[p] || 0) + 1;
        next.phase = 'end';
        next.mission.result = 'failure';
        next.mission.reason = reason;
        next.mission.failurePhase = p;

        const time = next.elapsed.toFixed(0).padStart(3, '0');
        next.logs = [{ time, msg: 'NHIỆM VỤ THẤT BẠI — ' + reason, kind: 'warn' }, ...next.logs.slice(0, 11)];
        saveToStorage(next);
        return next;
      });
      addToast(reason, 'bad');
      setActiveModal('end-report');
    },
    [addToast, saveToStorage]
  );

  const success = useCallback(() => {
    setState((prev) => {
      if (prev.mission.result) return prev;
      const next = clone(prev);
      next.phase = 'end';
      next.mission.result = 'success';
      const orbitErr = Math.abs(next.capture.finalAlt - 300);
      let baseScore = Math.round(
        cap(
          100 -
            0.7 * orbitErr -
            2 * next.launch.deviation -
            (0.6 * next.launch.maxQ) / 10 +
            next.sat.prop / 30 +
            next.sat.returned.length * 1.8,
          45,
          100
        )
      );
      const distinct = new Set(next.sat.returned.map((x) => x.region)).size;
      const value = next.sat.returned.reduce(
        (sum, x) => sum + [1.1, 1.0, 1.25, 1.4][x.region],
        0
      );
      baseScore = Math.round(cap(baseScore + (distinct - 1) * 2.5 + Math.min(8, value), 0, 100));
      next.mission.score = baseScore;

      const time = next.elapsed.toFixed(0).padStart(3, '0');
      next.logs = [
        { time, msg: 'Đã xác nhận tín hiệu ảnh từ Sao Hỏa. MISSION COMPLETE.', kind: 'good' },
        ...next.logs.slice(0, 11),
      ];
      saveToStorage(next);
      return next;
    });
    addToast('MISSION ACCOMPLISHED: MARS ORBIT REACHED', 'good');
    setActiveModal('end-report');
  }, [addToast, saveToStorage]);

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      addToast(next ? 'Âm thanh được bật.' : 'Âm thanh đã tắt.', next ? 'good' : 'warn');
      return next;
    });
  }, [addToast]);

  const startMission = useCallback(() => {
    const s = createDefaultState();
    s.started = true;
    s.sat.prop = SLOTS[3].opts[0].prop || 1149;
    s.logs = [
      { time: '000', msg: 'Đã tiếp nhận chỉ thị nhiệm vụ MOR–28–01.', kind: 'good' },
      { time: '000', msg: 'Hãy lựa chọn 5 nhóm linh kiện và phương tiện phóng.', kind: 'info' },
    ];
    setState(s);
    checkpointRef.current = null;
    makeCheckpoint(s);
    setActiveModal('none');
    setSoundEnabled(true);
    setSoundOn(true);
    saveToStorage(s);
  }, [makeCheckpoint, saveToStorage]);

  const continueMission = useCallback(() => {
    try {
      const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (p && p.started) {
        setState(p);
        const cp = JSON.parse(localStorage.getItem(CHECKPOINT_KEY) || 'null');
        if (cp) checkpointRef.current = cp;
        setActiveModal('none');
        addLog('Đã khôi phục nhiệm vụ được lưu trước đó.', 'good');
        return;
      }
    } catch {
      // ignore
    }
    startMission();
  }, [addLog, startMission]);

  const resetMission = useCallback(() => {
    startMission();
  }, [startMission]);

  const retryStage = useCallback(() => {
    const cp = checkpointRef.current;
    const failedPhase = state.mission.failurePhase;
    if (!cp || cp.phase !== failedPhase) {
      addToast('Không còn checkpoint hợp lệ. Hãy bắt đầu nhiệm vụ mới.', 'warn');
      return;
    }
    const attempts = { ...state.v3attempts };
    const restored = clone(cp.state);
    restored.v3attempts = attempts;
    restored.mission = { result: null, reason: '', score: 0, ending: null, failurePhase: null };
    randomizeSliders(restored.phase, restored);
    motionTimes.current[restored.phase] = 0;
    setState(restored);
    makeCheckpoint(restored);
    setActiveModal('none');
    const phaseName = PHASES.find((p) => p.id === restored.phase)?.name || restored.phase;
    addLog(`Thử lại ${phaseName}, lần ${(attempts[restored.phase] || 0) + 1}. Checkpoint đã khôi phục.`, 'good');
    addToast('CHECKPOINT RESTORED', 'good');
    saveToStorage(restored);
  }, [addLog, addToast, makeCheckpoint, randomizeSliders, saveToStorage, state.mission.failurePhase, state.v3attempts]);

  const setBuildTab = useCallback((tab: 'component' | 'rocket' | 'test') => {
    setState((prev) => ({ ...prev, buildTab: tab }));
  }, []);

  const setSlotFocus = useCallback((idx: number) => {
    setState((prev) => ({ ...prev, slotFocus: idx }));
  }, []);

  const setSlotChoice = useCallback(
    (slotIdx: number, choiceIdx: number) => {
      setState((prev) => {
        const next = clone(prev);
        next.slot[slotIdx] = choiceIdx;
        next.preflight = false;
        const b = Physics.loadout(
          next.slot.map((idx, i) => SLOTS[i].opts[idx]),
          LAUNCHERS[next.launcher],
          next.budget
        );
        next.sat.prop = b.prop;
        next.logs.unshift({
          time: next.elapsed.toFixed(0).padStart(3, '0'),
          msg: `Đã chọn ${SLOTS[slotIdx].opts[choiceIdx].name}.`,
          kind: 'info',
        });
        next.logs = next.logs.slice(0, 12);
        saveToStorage(next);
        return next;
      });
    },
    [saveToStorage]
  );

  const setLauncher = useCallback(
    (idx: number) => {
      setState((prev) => {
        const next = clone(prev);
        next.launcher = idx;
        next.preflight = false;
        next.logs.unshift({
          time: next.elapsed.toFixed(0).padStart(3, '0'),
          msg: `Chọn phương tiện phóng ${LAUNCHERS[idx].name}.`,
          kind: 'info',
        });
        next.logs = next.logs.slice(0, 12);
        saveToStorage(next);
        return next;
      });
    },
    [saveToStorage]
  );

  const updateRange = useCallback(
    (id: string, value: number) => {
      setState((prev) => {
        const next = clone(prev);
        const l = next.launch;
        const c = next.capture;
        switch (id) {
          case 'throttle':
            l.throttle = value;
            break;
          case 'guidance':
            l.guidance = value;
            break;
          case 'roll':
            l.roll = value;
            break;
          case 'park-burn':
            next.orbit.burn = value;
            break;
          case 'park-angle':
            next.orbit.angle = value;
            break;
          case 'tmi-burn':
            next.tmi.burn = value;
            break;
          case 'tmi-angle':
            next.tmi.angle = value;
            break;
          case 'along':
            next.cruise.along = value;
            break;
          case 'lateral':
            next.cruise.lateral = value;
            break;
          case 'capture-burn':
            c.burn = value;
            break;
          case 'capture-angle':
            c.angle = value;
            break;
          case 'peri':
            c.peri = value;
            break;
          case 'trim':
            c.trim = value;
            break;
          case 'incl':
            c.incl = value;
            break;
        }
        saveToStorage(next);
        return next;
      });
    },
    [saveToStorage]
  );

  const usedMemory = useCallback(() => {
    let t = 0;
    for (const x of state.sat.images) {
      const sent = state.sat.returned.some((r) => r.id === x.id);
      if (!sent) t += x.size - x.sent;
    }
    return t;
  }, [state.sat.images, state.sat.returned]);

  const cruiseTarget = useCallback(() => {
    const d = state.launch.deviation;
    const a = state.tmi.angle;
    return {
      along: Math.round(12 + d * 0.23),
      lateral: Math.round(-4 + a * 0.7 + d * 0.13),
    };
  }, [state.launch.deviation, state.tmi.angle]);

  const requiredPasses = useCallback(() => {
    return state.slot[3] === 1 ? 3 : 2;
  }, [state.slot]);

  const photoCapacity = useCallback(() => {
    return Physics.photoCapacity(state.slot[0], state.slot[4]);
  }, [state.slot]);

  const targetTrim = useCallback(() => {
    return Physics.trimTarget(state.capture.apo);
  }, [state.capture.apo]);

  const powerFraction = useCallback(() => {
    const s = state.sat;
    return (s.batteryWh || 0) / Math.max(1, s.batteryMaxWh || 5600);
  }, [state.sat]);

  const inSunlight = useCallback(() => {
    return !['capture', 'science'].includes(state.phase) || Math.sin(state.elapsed * 0.4) > 0;
  }, [state.elapsed, state.phase]);

  const availablePower = useCallback(() => {
    const s = state.sat;
    return s.solar && inSunlight() ? Math.round(build.gen * (s.powerHealth ?? 1)) : 0;
  }, [build.gen, inSunlight, state.sat]);

  const powerDraw = useCallback(() => {
    const s = state.sat;
    return (
      160 +
      (s.antenna ? 75 : 0) +
      (state.phase === 'science' && s.radarActive ? Math.min(210, build.opts[1].power || 0) : 0)
    );
  }, [build.opts, state.phase, state.sat]);

  const consumeProp = useCallback(
    (dv: number): boolean => {
      const m = build.dry + build.science + state.sat.prop;
      const exhaust = 320 * 9.80665;
      const final = m * Math.exp(-Math.abs(dv) / exhaust);
      const used = m - final;
      if (!isFinite(used) || used > state.sat.prop - 1) return false;
      setState((prev) => ({
        ...prev,
        sat: { ...prev.sat, prop: prev.sat.prop - used },
      }));
      return true;
    },
    [build.dry, build.science, state.sat.prop]
  );

  const executeAction = useCallback(
    (action: string) => {
      const cur = stateRef.current;
      const b = Physics.loadout(
        cur.slot.map((idx, i) => SLOTS[i].opts[idx]),
        LAUNCHERS[cur.launcher],
        cur.budget
      );

      if (action.startsWith('target-')) {
        const n = Number(action.slice(7));
        if (Number.isInteger(n) && n >= 0 && n <= 3) {
          setState((prev) => ({
            ...prev,
            sat: { ...prev.sat, imageTarget: n },
          }));
        }
        return;
      }

      switch (action) {
        case 'preflight': {
          if (!b.weightOK || !b.priceOK || !b.fairingOK || b.twr < 1.05) {
            addToast('Kiểm tra thất bại: tải trọng, ngân sách, bao hình hoặc TWR vượt giới hạn.', 'warn');
            return;
          }
          setState((prev) => {
            const next = clone(prev);
            next.preflight = true;
            next.spent = b.cost;
            next.sat.prop = b.prop;
            next.sat.batteryMaxWh = b.opts[2].capacity * 28;
            next.sat.batteryWh = next.sat.batteryMaxWh;
            next.sat.powerHealth = 1;
            next.launch.stageFuel = Math.min(252000, b.launcher.fullMass * 0.77);
            next.launch.mass = b.launcher.fullMass;
            next.launch.trail = [];
            return next;
          });
          addToast('PREFLIGHT PASS', 'good');
          addLog(`Preflight PASS: khối lượng ${b.mass} kg; ngân sách $${(b.cost / 1000).toFixed(2)}B.`, 'good');
          if (!b.powerOK) addToast('Cảnh báo: quản lý công suất ở pha chụp ảnh.', 'warn');
          setPhase('launch', 'SLC-41: tên lửa ở trạng thái sẵn sàng phóng.');
          break;
        }

        case 'ignite': {
          const twr = (b.twr * cur.launch.throttle) / 100;
          if (twr <= 1.0) {
            addToast(`TWR ${twr.toFixed(2)} ≤ 1.0. Tăng throttle để phóng.`, 'warn');
            return;
          }
          setState((prev) => ({
            ...prev,
            launch: { ...prev.launch, ignited: true },
          }));
          launchFX.current.ignition = performance.now();
          playSoundEffect('ignite');
          addLog('RD-180 IGNITION. Lift-off được xác nhận.', 'good');
          addToast('T-0: LIFTOFF!', 'good');
          break;
        }

        case 'to-separation': {
          if (!cur.launch.cutoff) {
            addToast('MECO chưa xảy ra.', 'warn');
            return;
          }
          setPhase('separation', 'Tầng 1 MECO; đã đạt điều kiện chuẩn bị tách tầng.');
          break;
        }

        case 'stage-sep': {
          if (!cur.launch.cutoff || cur.launch.alt < 100) {
            fail('Tách tầng quá sớm khi động cơ còn hoạt động.');
            return;
          }
          setState((prev) => ({ ...prev, sep: { ...prev.sep, stage: true } }));
          launchFX.current.stage = performance.now();
          playSoundEffect('stage-sep');
          addLog('STAGE 1 SEPARATION CONFIRMED.', 'good');
          addToast('TÁCH TẦNG 1 THÀNH CÔNG', 'good');
          break;
        }

        case 'centaur-ignite': {
          if (!cur.sep.stage) {
            addToast('Tầng 1 chưa tách.', 'warn');
            return;
          }
          setState((prev) => ({ ...prev, sep: { ...prev.sep, centaur: true } }));
          playSoundEffect('centaur-ignite');
          addLog('Động cơ tầng trên Centaur RL-10 bắt đầu.', 'good');
          addToast('CENTAUR IGNITED', 'good');
          break;
        }

        case 'fairing-sep': {
          if (!cur.sep.centaur || cur.launch.alt < 101) {
            addToast('Không đủ điều kiện tách vỏ fairing.', 'warn');
            return;
          }
          setState((prev) => ({ ...prev, sep: { ...prev.sep, fairing: true } }));
          launchFX.current.fairing = performance.now();
          playSoundEffect('fairing-sep');
          addLog('Fairing jettison thành công; vệ tinh được bảo vệ.', 'good');
          addToast('FAIRING JETTISONED', 'good');
          break;
        }

        case 'to-parking': {
          if (!(cur.sep.stage && cur.sep.centaur && cur.sep.fairing)) {
            addToast('Chưa hoàn thành chu trình tách tầng.', 'warn');
            return;
          }
          setPhase('parking', 'Centaur đã tách vỏ và tiến đến Earth parking orbit.');
          break;
        }

        case 'park-exec': {
          const fuel = cur.tmi.fuel;
          const need = Physics.stageFuelForDV(fuel, b.mass, cur.orbit.burn);
          if (need > fuel - 100) {
            fail('Cạn nhiên liệu Centaur trong thao tác đốt quỹ đạo chờ.');
            return;
          }
          const e = Physics.parking(cur.orbit.burn, cur.orbit.angle);
          const dx = (cur.launch.deviation || 0) * 0.25 + Math.abs(cur.launch.vx || 0) / 2500;
          const peri = e.peri - dx;
          const apo = e.apo + dx;
          const newFuel = fuel - need;

          if (peri < 115 || apo > 300 || apo < 130 || Math.abs(cur.orbit.angle) > 8) {
            fail(
              `Đốt quỹ đạo chờ sai: cận điểm ${peri.toFixed(0)} km, viễn điểm ${apo.toFixed(
                0
              )} km; Centaur không vào quỹ đạo ổn định.`
            );
            return;
          }

          setState((prev) => ({
            ...prev,
            orbit: { ...prev.orbit, peri, apo, confirmed: true },
            tmi: { ...prev.tmi, fuel: newFuel },
          }));
          addLog(
            `Quỹ đạo chờ ${peri.toFixed(0)} × ${apo.toFixed(0)} km; Centaur đã tiêu hao ${need.toFixed(0)} kg nhiên liệu.`,
            'good'
          );
          addToast('PARKING ORBIT CONFIRMED', 'good');
          break;
        }

        case 'to-tmi': {
          if (!cur.orbit.confirmed) {
            addToast('Quỹ đạo chờ chưa hợp lệ.', 'warn');
            return;
          }
          setPhase('tmi', 'Cửa sổ chuyển tiếp Trái Đất → Sao Hỏa đã mở.');
          break;
        }

        case 'tmi-exec': {
          const t = cur.tmi;
          const need = Physics.stageFuelForDV(t.fuel, b.mass, t.burn);
          if (need > t.fuel - 100) {
            fail('Không đủ nhiên liệu Centaur để hoàn thành TMI.');
            return;
          }
          const newFuel = t.fuel - need;
          if (Math.abs(t.burn - 3150) > 110 || Math.abs(t.angle) > 6) {
            fail(`Trans-Mars Injection lệch quỹ đạo: Δv ${t.burn} m/s, hướng ${t.angle}°; hành lang Mars không đạt.`);
            return;
          }
          setState((prev) => ({
            ...prev,
            tmi: { ...prev.tmi, complete: true, fuel: newFuel },
          }));
          motionTimes.current.tmi = performance.now();
          addLog(`TMI COMPLETE • Δv ${t.burn} m/s • còn ${newFuel.toFixed(0)} kg Centaur fuel.`, 'good');
          addToast('TRANS-MARS TRAJECTORY ACHIEVED', 'good');
          break;
        }

        case 'detach': {
          if (!cur.tmi.complete) {
            addToast('Chưa hoàn thành TMI burn.', 'warn');
            return;
          }
          setState((prev) => ({
            ...prev,
            tmi: { ...prev.tmi, detached: true },
          }));
          launchFX.current.detach = performance.now();
          playSoundEffect('detach');
          addLog('MRO tách an toàn khỏi tầng Centaur.', 'good');
          addToast('MRO PAYLOAD RELEASE CONFIRMED', 'good');
          break;
        }

        case 'to-cruise': {
          if (!cur.tmi.detached) {
            addToast('MRO chưa tách khỏi tầng Centaur.', 'warn');
            return;
          }
          setPhase('cruise', 'MRO đã bắt đầu hành trình liên hành tinh.');
          break;
        }

        case 'solar': {
          if (cur.sat.solar) return;
          if (!cur.sat.powered) {
            fail('Không thể triển khai thiết bị vì máy tính điều khiển đã mất nguồn.');
            return;
          }
          setState((prev) => ({
            ...prev,
            sat: { ...prev.sat, solar: true },
          }));
          launchFX.current.solar = performance.now();
          addLog('Hai khớp cánh pin mở theo chu trình; nguồn sạc khả dụng.', 'good');
          addToast('SOLAR ARRAYS DEPLOYED', 'good');
          break;
        }

        case 'antenna': {
          if (cur.sat.antenna) return;
          if (!cur.sat.powered) {
            fail('Không thể triển khai thiết bị vì máy tính điều khiển đã mất nguồn.');
            return;
          }
          setState((prev) => ({
            ...prev,
            sat: { ...prev.sat, antenna: true },
          }));
          launchFX.current.antenna = performance.now();
          addLog('Bản lề ăng-ten khóa, high-gain dish hướng Trái Đất.', 'good');
          addToast('HIGH-GAIN ANTENNA DEPLOYED', 'good');
          break;
        }

        case 'cruise-exec': {
          if (!cur.sat.solar || !cur.sat.antenna) {
            addToast('Cần mở cánh pin và ăng-ten để cấp điện và nhận lệnh hiệu chỉnh hành trình.', 'warn');
            return;
          }
          const t = cruiseTarget();
          const co = cur.cruise;
          const miss = Physics.missDistance(co.along, co.lateral, t.along, t.lateral, cur.launch.deviation);
          const dv = Math.hypot(co.along, co.lateral);
          if (!consumeProp(dv)) {
            fail('Thiếu nhiên liệu cho midcourse correction.');
            return;
          }
          if (miss > 150000) {
            fail(`Tàu bay lệch quỹ đạo: điểm tiếp cận dự đoán cách Mars ${(miss / 1000).toFixed(0)}k km.`);
            return;
          }
          if (miss > 70000) {
            setState((prev) => ({
              ...prev,
              cruise: { ...prev.cruise, miss },
            }));
            addToast(`Sai số còn ${(miss / 1000).toFixed(0)}k km, phải hiệu chỉnh lại. Nhiên liệu đã tiêu hao.`, 'warn');
            return;
          }
          setState((prev) => ({
            ...prev,
            cruise: { ...prev.cruise, miss, corrected: true },
          }));
          motionTimes.current.cruise = performance.now();
          addLog(`Trajectory correction completed. Predicted miss ${miss.toLocaleString('en-US')} km.`, 'good');
          addToast('CORRECTION SUCCESSFUL', 'good');
          break;
        }

        case 'to-capture': {
          if (!cur.cruise.corrected) {
            addToast('Phải hiệu chỉnh hành trình trước khi vào Sao Hỏa.', 'warn');
            return;
          }
          setPhase('capture', 'MRO tiếp cận Sao Hỏa; chuẩn bị Mars Orbit Insertion.');
          break;
        }

        case 'capture-exec': {
          if (!consumeProp(cur.capture.burn)) {
            fail('Cạn nhiên liệu, không thể hãm tốc tại Sao Hỏa.');
            return;
          }
          if (Math.abs(cur.capture.burn - 940) > 85 || Math.abs(cur.capture.angle) > 6) {
            fail('Mars Orbit Insertion không thành công: tàu không vào quỹ đạo an toàn quanh Sao Hỏa.');
            return;
          }
          const apo = Math.round(2600 + (cur.capture.burn - 940) * 2);
          setState((prev) => ({
            ...prev,
            capture: { ...prev.capture, inserted: true, apo },
          }));
          addLog(`Mars gravity capture confirmed. Apoapsis ${apo.toLocaleString('en-US')} km.`, 'good');
          addToast('MARS CAPTURE SUCCESSFUL', 'good');
          break;
        }

        case 'aerobrake': {
          if (!cur.capture.inserted) return;
          const per = cur.capture.peri;
          if (
            per < 125 ||
            (cur.slot[2] === 2 && per < 130) ||
            (cur.slot[1] === 0 && cur.slot[2] === 2 && per < 140)
          ) {
            fail(`Nhiệt độ hãm khí quyển vượt giới hạn linh kiện ở periapsis ${per} km.`);
            return;
          }
          if (per > 175) {
            addToast('Periapsis quá cao: lực cản khí quyển không đủ để giảm apoapsis.', 'warn');
            return;
          }
          const passes = cur.capture.passes + 1;
          const nextApo = Physics.aerobrakeApo(cur.capture.apo, per, cur.slot[3] === 1);
          let powerHealth = cur.sat.powerHealth || 1;
          if (cur.slot[2] === 2 && per < 150) {
            powerHealth = Math.min(powerHealth, per < 145 ? 0.46 : 0.75);
            addLog('Cảnh báo nhiệt tăng ở khớp cánh pin.', 'warn');
          }
          const optimalTrim = Physics.trimTarget(nextApo);
          setState((prev) => ({
            ...prev,
            capture: {
              ...prev.capture,
              passes,
              apo: nextApo,
              trim: optimalTrim,
            },
            sat: {
              ...prev.sat,
              powerHealth,
            },
          }));
          addLog(`Aerobrake pass ${passes}/${requiredPasses()}: apoapsis ~${nextApo.toLocaleString('en-US')} km.`, 'good');
          addToast(`AEROBRAKE PASS ${passes} COMPLETE`, 'good');
          break;
        }

        case 'circularize': {
          if (cur.capture.passes < requiredPasses()) {
            addToast('Chưa đủ các lượt hãm khí quyển.', 'warn');
            return;
          }
          const optimal = targetTrim();
          if (!consumeProp(cur.capture.trim)) {
            fail('Thiếu nhiên liệu để đạt quỹ đạo khoa học.');
            return;
          }
          const result = Physics.finalOrbit(
            cur.capture.trim,
            optimal,
            cur.capture.peri,
            cur.capture.incl,
            cur.launch.deviation
          );
          const dH = Math.abs(result.alt - 300);
          const dI = Math.abs(result.inc - 93);
          if (dH > 25 || dI > 2) {
            fail(
              `Quỹ đạo sai mục tiêu: độ cao ${result.alt.toFixed(1)} km và độ nghiêng ${result.inc.toFixed(
                1
              )}°. Sai lệch vượt giới hạn.`
            );
            return;
          }
          setState((prev) => ({
            ...prev,
            capture: {
              ...prev.capture,
              finalized: true,
              finalAlt: result.alt,
              finalInc: result.inc,
            },
          }));
          addLog(`MARS SCIENCE ORBIT CONFIRMED: ${result.alt.toFixed(1)} km • i=${result.inc.toFixed(1)}°.`, 'good');
          addToast('TARGET ORBIT ACQUIRED', 'good');
          setPhase('science', 'Vệ tinh ổn định trên quỹ đạo mục tiêu; khởi tạo chiến dịch chụp ảnh.');
          break;
        }

        case 'radar-toggle': {
          setState((prev) => {
            const next = clone(prev);
            next.sat.radarActive = !next.sat.radarActive;
            next.sat.batteryWh = Math.max(0, (next.sat.batteryWh || 0) - 12);
            return next;
          });
          addLog(`Hệ thống radar: ${!cur.sat.radarActive ? 'BẬT' : 'TẮT'} để quản lý điện năng.`);
          break;
        }

        case 'crism-toggle': {
          setState((prev) => {
            const next = clone(prev);
            next.sat.crismActive = !(next.sat.crismActive !== false);
            next.sat.batteryWh = Math.max(0, (next.sat.batteryWh || 0) - 12);
            return next;
          });
          addLog(`Quang phổ kế CRISM: ${cur.sat.crismActive === false ? 'BẬT' : 'TẮT'}.`);
          break;
        }

        case 'science-photo': {
          setState((prev) => ({
            ...prev,
            sat: { ...prev.sat, scienceMode: 'photo' },
          }));
          break;
        }

        case 'science-send': {
          setState((prev) => ({
            ...prev,
            sat: { ...prev.sat, scienceMode: 'send' },
          }));
          break;
        }

        case 'take-photo': {
          const opts = b.opts;
          const s = cur.sat;
          const sz = [3.5, 1.7, 0.6][cur.slot[0]];
          if (!s.solar) {
            addToast('Phải triển khai cánh pin trước khi chụp ảnh.', 'warn');
            return;
          }
          if (cur.slot[0] === 0 && s.crismActive !== false) {
            addToast('Vi rung HiRISE: phải tắt CRISM trước khi chụp ảnh độ phân giải cao.', 'warn');
            return;
          }
          if (usedMemory() + sz > opts[4].memory + 1e-6) {
            addToast(`Bộ nhớ không đủ: còn ${(opts[4].memory - usedMemory()).toFixed(1)} GB. Truyền ảnh rồi thử lại.`, 'warn');
            return;
          }
          const draw =
            opts[0].power -
            (cur.slot[0] === 0 && s.crismActive === false ? 180 : 0) +
            (s.radarActive ? opts[1].power || 0 : 0) +
            300;
          const effectiveGen = b.gen * (s.powerHealth ?? 1);
          if (draw > effectiveGen) {
            addToast('Quá tải nguồn điện. Tắt radar rồi thử lại.', 'warn');
            return;
          }
          const cost = [460, 255, 95][cur.slot[0]];
          if (s.batteryWh < cost) {
            addToast('Không đủ điện để chụp.', 'warn');
            return;
          }

          const id = Math.max(0, ...s.images.map((x) => x.id)) + 1;
          const newImg: CapturedImage = {
            id,
            region: s.imageTarget,
            size: sz,
            sent: 0,
          };

          const cap = Physics.photoCapacity(cur.slot[0], cur.slot[4]);
          const nextImagesCount = s.images.length + 1;
          const isBufferFull = usedMemory() + sz * 2 > opts[4].memory + 1e-6 || nextImagesCount >= cap.maxPhotos;

          setState((prev) => ({
            ...prev,
            sat: {
              ...prev.sat,
              images: [...prev.sat.images, newImg],
              batteryWh: prev.sat.batteryWh - cost,
              scienceMode: isBufferFull ? 'send' : prev.sat.scienceMode,
            },
          }));
          addLog(
            `CAMERA exposure ${String(id).padStart(2, '0')} stored • REGION 0${s.imageTarget + 1} • ${sz} GB (Đã lưu: ${nextImagesCount}/${cap.maxPhotos} ảnh).`,
            'good'
          );
          addToast(
            `CAPTURE ${String(id).padStart(2, '0')} COMPLETE • ${sz} GB (${nextImagesCount}/${cap.maxPhotos} ảnh)`,
            'good'
          );
          break;
        }

        case 'transmit': {
          const s = cur.sat;
          if (!s.solar || !s.antenna) {
            addToast('Cần triển khai cánh pin và ăng-ten.', 'warn');
            return;
          }
          if (cur.slot[1] === 0 && s.radarActive) {
            addToast('SHARAD và Electra có nguy cơ nhiễu chéo. Hãy tắt radar trước khi truyền ảnh.', 'warn');
            return;
          }
          if (s.batteryWh < 100) {
            addToast('Pin quá thấp để truyền dữ liệu. Hãy đợi cánh pin sạc.', 'warn');
            return;
          }

          const rate = b.opts[4].rate || 2;
          let remain = rate;
          const nextImages = clone(s.images);
          const nextReturned = clone(s.returned);

          for (const x of nextImages) {
            if (nextReturned.some((r) => r.id === x.id)) continue;
            const need = x.size - x.sent;
            const portion = Math.min(need, remain);
            if (portion <= 0) continue;
            x.sent = Math.round((x.sent + portion) * 1000) / 1000;
            remain = Math.round((remain - portion) * 1000) / 1000;
            if (x.sent + 1e-5 >= x.size) {
              nextReturned.push({ id: x.id, region: x.region, size: x.size });
              addLog(`Earth uplink ACK: MARS IMAGE ${String(x.id).padStart(2, '0')} received.`, 'good');
            }
            if (remain <= 0) break;
          }

          const transferred = rate - remain;
          const batteryCost = transferred * 38;
          const cap = Physics.photoCapacity(cur.slot[0], cur.slot[4]);

          setState((prev) => ({
            ...prev,
            sat: {
              ...prev.sat,
              images: nextImages,
              returned: nextReturned,
              batteryWh: Math.max(0, prev.sat.batteryWh - batteryCost),
            },
          }));

          addToast(
            `${transferred.toFixed(1)} GB đã truyền • ${nextReturned.length}/${cap.targetPhotos} ảnh hoàn tất`,
            'good'
          );
          if (nextReturned.length >= cap.targetPhotos) {
            success();
          }
          break;
        }

        case 'show-end': {
          setActiveModal('end-report');
          break;
        }
      }
    },
    [
      addLog,
      addToast,
      consumeProp,
      cruiseTarget,
      fail,
      photoCapacity,
      requiredPasses,
      setPhase,
      success,
      targetTrim,
      usedMemory,
    ]
  );

  // Main simulation tick loop (Ascent and Power)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = cap((now - lastTime) / 1000, 0, 0.065);
      lastTime = now;

      setState((prev) => {
        if (!prev.started || prev.mission.result) return prev;

        let next = prev;
        const phase = prev.phase;

        // Ascent integration
        if (phase === 'launch' && prev.launch.ignited && !prev.launch.cutoff) {
          next = clone(prev);
          const l = next.launch;
          const vehicle = LAUNCHERS[next.launcher];
          const d = dt * 11.5;
          const stepCount = Math.max(1, Math.ceil(d / 0.22));
          const sub = d / stepCount;

          for (let k = 0; k < stepCount; k++) {
            const nextStep = Physics.ascentStep(l, vehicle, l.throttle, l.guidance, l.roll, sub);
            Object.assign(l, nextStep);
            l.t += sub;
            l.maxQ = Math.max(l.maxQ, l.q);

            // Active guidance steering: player can steer left/right to keep deviation within safety corridor
            const naturalDrift = next.slot[3] === 2 ? 0.008 : 0.003;
            l.deviation += sub * (l.guidance * 0.014 + l.roll * 0.004 + naturalDrift);

            if (l.q > 45) l.health -= sub * (l.q - 45) * 0.27;

            if (l.alt < 0.04 && l.t > 14 && l.vy < 0) {
              setTimeout(() => fail('Tên lửa không rời được bệ phóng: tỷ số lực đẩy/trọng lượng quá thấp.'), 0);
              break;
            }
            if (l.health < 55) {
              setTimeout(
                () => fail(`Max Q đạt ${l.maxQ.toFixed(1)} kPa: thân tên lửa chịu tải khí động vượt giới hạn và bị phá hủy.`),
                0
              );
              break;
            }
            if (Math.abs(l.deviation) > 18) {
              setTimeout(
                () =>
                  fail(
                    `Sai hướng phóng ${l.deviation > 0 ? '+' : ''}${l.deviation.toFixed(1)} units: tên lửa rời hành lang an toàn.`
                  ),
                0
              );
              break;
            }
            if ((l.stageFuel ?? 0) <= 0 && l.alt < 100.8) {
              setTimeout(
                () => fail(`Tầng 1 cạn nhiên liệu tại ${l.alt.toFixed(1)} km, chưa đạt độ cao tách tầng 101 km.`),
                0
              );
              break;
            }
            if (l.alt >= 100.8) {
              l.alt = 101;
              l.cutoff = true;
              l.ignited = false;
              addLog(`MECO tại 101 km; velocity ${l.vel.toFixed(2)} km/s • engine cutoff.`, 'good');
              addToast('MECO / STAGE 1 CUTOFF', 'good');
              break;
            }

            if (l.trail.length === 0 || l.alt - l.trail[l.trail.length - 1].alt > 0.32) {
              l.trail.push({ alt: l.alt, downrange: l.downrange, dev: l.deviation });
              if (l.trail.length > 350) l.trail.shift();
            }
          }
        }

        // Spacecraft battery drain / charge
        if (['cruise', 'capture', 'science'].includes(phase) && !next.mission.result) {
          if (next === prev) next = clone(prev);
          const s = next.sat;
          const currentBuild = Physics.loadout(
            next.slot.map((idx, i) => SLOTS[i].opts[idx]),
            LAUNCHERS[next.launcher],
            next.budget
          );
          const inSun = !['capture', 'science'].includes(phase) || Math.sin(next.elapsed * 0.4) > 0;
          const gen = s.solar && inSun ? Math.round(currentBuild.gen * (s.powerHealth ?? 1)) : 0;
          const draw =
            160 +
            (s.antenna ? 75 : 0) +
            (phase === 'science' && s.radarActive ? Math.min(210, currentBuild.opts[1].power || 0) : 0);
          const simHours = (dt * 90) / 3600;
          s.batteryWh = cap(s.batteryWh + (gen - draw) * simHours, 0, s.batteryMaxWh);

          if (s.batteryWh <= 0.1) {
            s.powered = false;
            setTimeout(
              () =>
                fail(
                  'Mất nguồn điện: pin cạn trước khi vệ tinh có thể sạc lại, bộ điều khiển và máy phát tín hiệu ngừng hoạt động.'
                ),
              0
            );
          }
        }

        if (next === prev) {
          next = { ...prev, elapsed: prev.elapsed + dt };
        } else {
          next.elapsed += dt;
        }

        return next;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [addLog, addToast, fail]);

  return (
    <GameContext.Provider
      value={{
        state,
        build,
        toasts,
        hasSavedGame,
        soundOn,
        activeModal,
        setActiveModal,
        toggleSound,
        startMission,
        continueMission,
        resetMission,
        retryStage,
        setBuildTab,
        setSlotFocus,
        setSlotChoice,
        setLauncher,
        updateRange,
        executeAction,
        addToast,
        addLog,
        usedMemory,
        availablePower,
        powerDraw,
        powerFraction,
        cruiseTarget,
        targetTrim,
        requiredPasses,
        photoCapacity,
        motionTimes,
        launchFX,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
