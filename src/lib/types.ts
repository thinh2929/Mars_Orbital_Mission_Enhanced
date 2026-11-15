export type PhaseId =
  | 'assembly'
  | 'launch'
  | 'separation'
  | 'parking'
  | 'tmi'
  | 'cruise'
  | 'capture'
  | 'science'
  | 'end';

export interface PhaseInfo {
  id: PhaseId;
  name: string;
  note: string;
}

export interface SlotOption {
  name: string;
  kind: string;
  mass: number;
  cost: number;
  description: string;
  issue: string;
  detail: string;
  power?: number;
  capacity?: number;
  prop?: number;
  memory?: number;
  rate?: number;
}

export interface SlotGroup {
  label: string;
  short: string;
  desc: string;
  opts: SlotOption[];
}

export interface Launcher {
  id: string;
  name: string;
  kind: string;
  max: number;
  cost: number;
  thrust: number;
  fullMass: number;
  fairing: number;
  stages: number;
  description: string;
  real: boolean;
}

export interface LogEntry {
  time: string;
  msg: string;
  kind: 'info' | 'good' | 'warn';
}

export interface ToastItem {
  id: string;
  msg: string;
  kind: 'good' | 'warn' | 'bad';
}

export interface TrailPoint {
  alt: number;
  downrange: number;
  dev: number;
}

export interface CapturedImage {
  id: number;
  region: number;
  size: number;
  sent: number;
}

export interface ReturnedImage {
  id: number;
  region: number;
  size: number;
}

export interface GameState {
  phase: PhaseId;
  slot: [number, number, number, number, number];
  slotFocus: number;
  launcher: number;
  buildTab: 'component' | 'rocket' | 'test';
  preflight: boolean;
  budget: number;
  spent: number;
  launch: {
    ignited: boolean;
    cutoff: boolean;
    t: number;
    alt: number;
    vel: number;
    q: number;
    maxQ: number;
    health: number;
    deviation: number;
    guidance: number;
    roll: number;
    throttle: number;
    vx: number;
    vy: number;
    downrange: number;
    stageFuel: number | null;
    mass: number | null;
    twr: number;
    trail: TrailPoint[];
  };
  sep: {
    stage: boolean;
    centaur: boolean;
    fairing: boolean;
  };
  orbit: {
    burn: number;
    angle: number;
    confirmed: boolean;
    peri: number;
    apo: number;
  };
  tmi: {
    burn: number;
    angle: number;
    complete: boolean;
    detached: boolean;
    fuel: number;
  };
  cruise: {
    along: number;
    lateral: number;
    corrected: boolean;
    miss: number;
  };
  capture: {
    burn: number;
    angle: number;
    inserted: boolean;
    peri: number;
    passes: number;
    apo: number;
    trim: number;
    incl: number;
    finalized: boolean;
    finalAlt: number;
    finalInc: number;
  };
  sat: {
    prop: number;
    solar: boolean;
    antenna: boolean;
    powered: boolean;
    batteryWh: number;
    batteryMaxWh: number;
    powerHealth: number;
    crismActive: boolean;
    scienceMode: 'photo' | 'send';
    images: CapturedImage[];
    returned: ReturnedImage[];
    imageTarget: number;
    radarActive: boolean;
  };
  mission: {
    result: null | 'success' | 'failure';
    reason: string;
    score: number;
    ending: string | null;
    failurePhase: PhaseId | null;
  };
  elapsed: number;
  logs: LogEntry[];
  flags: Record<string, boolean>;
  started: boolean;
  v3attempts: Record<string, number>;
}

export interface BuildSummary {
  opts: SlotOption[];
  science: number;
  dry: number;
  prop: number;
  mass: number;
  cost: number;
  gen: number;
  draw: number;
  powerOK: boolean;
  launcher: Launcher;
  weightOK: boolean;
  priceOK: boolean;
  fairingOK: boolean;
  stowedWidth: number;
  twr: number;
}

export interface EndingDetail {
  id: string;
  headline: string;
  name: string;
  badge: string;
  analysis: string;
  advice: string;
}
