import { BuildSummary, Launcher, SlotOption } from './types';

export const Physics = {
  loadout(options: SlotOption[], launcher: Launcher, missionBudget = 3600): BuildSummary {
    const science = options[0].mass + options[1].mass;
    const dry = 892 + (options[2].mass - 132) + (options[3].mass - 190) + (options[4].mass - 110);
    const prop = options[3].prop || 0;
    const mass = science + dry + prop;
    const cost = 1100 + options.reduce((a, x) => a + x.cost, 0) + launcher.cost;
    const gen = options[2].power || 0;
    const draw = (options[0].power || 0) + (options[1].power || 0) + 300;
    const powerOK = gen >= draw;
    const stowedWidth = options[2].mass >= 160 ? 4.10 : options[2].mass <= 95 ? 3.32 : 3.65;
    const fairingOK = stowedWidth <= launcher.fairing - 0.14;
    return {
      opts: options,
      science,
      dry,
      prop,
      mass,
      cost,
      gen,
      draw,
      powerOK,
      launcher,
      weightOK: mass <= launcher.max,
      priceOK: cost <= missionBudget,
      fairingOK,
      stowedWidth,
      twr: (launcher.thrust * 1000) / (launcher.fullMass * 9.80665),
    };
  },

  ascentStep(
    previous: {
      stageFuel?: number | null;
      mass?: number | null;
      alt?: number;
      downrange?: number;
      vx?: number;
      vy?: number;
      t?: number;
    },
    launcher: Launcher,
    throttlePercent: number,
    guidance: number,
    roll: number,
    dt: number
  ) {
    const fuel = previous.stageFuel ?? Math.min(252000, launcher.fullMass * 0.77);
    const mass = previous.mass ?? launcher.fullMass;
    const thrust = (launcher.thrust * 1000 * throttlePercent) / 100;
    const flow = Math.min(fuel, (thrust / (310 * 9.80665)) * dt);
    const newFuel = Math.max(0, fuel - flow);
    const newMass = mass - flow;
    const alt = Math.max(0, previous.alt || 0);
    const vx = previous.vx || 0;
    const vy = previous.vy || 0;
    const speed = Math.hypot(vx, vy);
    const rho = 1.225 * Math.exp(-alt / 8.5);
    const rawQ = (0.5 * rho * speed * speed) / 1000; // kPa
    const effectiveQ = rawQ * (1 + Math.abs(guidance) * 0.052 + Math.abs(roll) * 0.026);
    const drag = rawQ * 1000 * 0.6 * 13;
    const pitch =
      ((90 - Math.min(34, Math.max(0, (previous.t || 0) - 12) * 0.21) + guidance * 0.24) *
        Math.PI) /
      180;
    const g = 9.80665 * Math.pow(6371 / (6371 + alt), 2);
    const ax = (thrust * Math.cos(pitch) - (drag * vx) / Math.max(1, speed)) / newMass;
    const ay = (thrust * Math.sin(pitch) - (drag * vy) / Math.max(1, speed)) / newMass - g;
    const nextVx = vx + ax * dt;
    const nextVy = vy + ay * dt;
    return {
      alt: Math.max(0, alt + ((vy + nextVy) * 0.5 * dt) / 1000),
      downrange: (previous.downrange || 0) + ((vx + nextVx) * 0.5 * dt) / 1000,
      vx: nextVx,
      vy: nextVy,
      vel: Math.hypot(nextVx, nextVy) / 1000,
      q: effectiveQ,
      rawQ,
      stageFuel: newFuel,
      mass: newMass,
      twr: thrust / newMass / g,
      pitch: (pitch * 180) / Math.PI,
    };
  },

  stageFuelForDV(
    remainingFuel: number,
    payloadMass: number,
    dv: number,
    isp = 450,
    stageDryMass = 2700
  ): number {
    const before = stageDryMass + payloadMass + remainingFuel;
    return before * (1 - Math.exp(-Math.abs(dv) / (isp * 9.80665)));
  },

  ascent(t: number, throttlePercent: number, deltaPitch: number, roll: number) {
    const alt = Math.max(0, Math.min(101, 0.0018 * t * t - 0.06 * t)); // km
    const vel = Math.max(0, 0.001 * t + 0.000035 * t * t); // km/s
    const rho = 1.225 * Math.exp(-alt / 8.5); // proxy kg/m³
    const q =
      Math.max(0, (0.5 * rho * Math.pow(vel * 1000, 2)) / 1000) *
      (0.6 + (0.4 * throttlePercent) / 100) *
      (1 + Math.abs(deltaPitch) * 0.025 + Math.abs(roll) * 0.01); // kPa
    return { alt, vel, q };
  },

  parking(burn: number, angle: number) {
    const err = burn - 335;
    return {
      peri: 148 + err * 1.2 - Math.abs(angle) * 2,
      apo: 185 + err * 1.65 + Math.abs(angle) * 4,
    };
  },

  propellantUsed(dryMass: number, scienceMass: number, remainingProp: number, dv: number, isp = 320): number {
    const before = dryMass + scienceMass + remainingProp;
    return before * (1 - Math.exp(-Math.abs(dv) / (isp * 9.80665)));
  },

  missDistance(along: number, lateral: number, targetAlong: number, targetLateral: number, deviation: number): number {
    return Math.round(
      Math.abs(along - targetAlong) * 11000 +
        Math.abs(lateral - targetLateral) * 20000 +
        deviation * 1500
    );
  },

  aerobrakeApo(apo: number, peri: number, reducedTank: boolean): number {
    const effectiveness = Math.min(1.2, Math.max(0.7, 1.2 - (peri - 135) / 90));
    return Math.max(330, Math.round(apo - (reducedTank ? 675 : 740) * effectiveness));
  },

  trimTarget(apo: number): number {
    return Math.round((190 + Math.max(0, apo - 300) * 0.09) / 5) * 5;
  },

  finalOrbit(trim: number, optimal: number, peri: number, inclination: number, deviation: number) {
    return {
      alt: 300 + (trim - optimal) * 1.2 + (peri - 150) * 0.09,
      inc: inclination + deviation * 0.05,
    };
  },

  photoCapacity(slot0: number, slot4: number) {
    const sz = [3.5, 1.7, 0.6][slot0] ?? 1.7;
    const mem = [20, 10, 5][slot4] ?? 10;
    const maxPhotos = Math.max(1, Math.floor(mem / sz));
    const targetPhotos = Math.max(1, Math.min(6, maxPhotos));
    return {
      imageSize: sz,
      memory: mem,
      maxPhotos,
      targetPhotos,
    };
  },
};
