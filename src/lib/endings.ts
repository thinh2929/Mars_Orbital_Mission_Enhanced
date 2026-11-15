import { EndingDetail, GameState } from './types';
import { Physics } from './physics';

export function getEndingDetails(state: GameState): EndingDetail {
  const m = state.mission;
  const reason = m.reason || '';

  if (m.result === 'success') {
    const score = m.score;
    const cap = Physics.photoCapacity(state.slot[0], state.slot[4]);
    const target = cap.targetPhotos;
    const distinct = new Set(state.sat.returned.map((r) => r.region)).size;
    if (score >= 90 && distinct >= Math.min(4, target) && state.sat.returned.length >= target) {
      return {
        id: 'discovery',
        headline: 'GOOD ENDING · SCIENTIFIC DISCOVERY',
        name: 'Scientific Discovery',
        badge: 'EXCEPTIONAL',
        analysis:
          'Spacecraft achieved precise science orbit, conserved propellant margins, and downlinked high-resolution imagery across key surface regions. Primary and secondary science objectives exceeded.',
        advice: 'Exemplary mission execution: optimal payload configuration, efficient trajectory navigation, and maximum scientific output.',
      };
    }
    if (score >= 78) {
      return {
        id: 'nominal',
        headline: 'GOOD ENDING · MISSION ACCOMPLISHED',
        name: 'Mission Accomplished',
        badge: 'MISSION SUCCESS',
        analysis:
          'All primary bus systems remain operational. The orbiter stabilized in the required 300 km polar science orbit and completed its target imaging campaign.',
        advice: 'Strong performance. To maximize score, refine orbital circularization trim and preserve additional hydrazine for extended mission life.',
      };
    }
    return {
      id: 'survival',
      headline: 'GOOD ENDING · MARGINAL SUCCESS',
      name: 'Marginal Success',
      badge: 'MINIMUM OBJECTIVES MET',
      analysis:
        'Primary downlink targets met with critically depleted propellant reserves and non-optimal orbital geometry. Minimum criteria satisfied.',
      advice: 'Review component mass margins and execute tighter trajectory burns to increase operational reserves.',
    };
  }

  const checks: [RegExp, string, string, string][] = [
    [
      /thrust|TWR|pad|liftoff/i,
      'LAUNCH ABORT',
      'Low TWR or inadequate engine thrust prevented the launch vehicle from clearing the launch pad.',
      'Select a launch vehicle suited to payload mass and maintain throttle > 85% to ensure liftoff TWR > 1.',
    ],
    [
      /Max Q|structural|aerodynamic/i,
      'STRUCTURAL BREAKUP',
      'Aerodynamic loads exceeded structural design limits (Max Q > 45 kPa) due to excessive dynamic pressure or off-nominal pitch/roll angles.',
      'Throttle down through dense lower atmospheric layers near Max Q and maintain guidance pitch near 0°.',
    ],
    [
      /corridor|deviation|guidance/i,
      'ASCENT GUIDANCE LOSS',
      'Launch vehicle breached the ±18 units flight corridor boundary during atmospheric ascent.',
      'Use the TVC gimbal lever to counteract aerodynamic drift and keep trajectory centered along the flight corridor.',
    ],
    [
      /Centaur|upper stage|TMI|parking orbit|Trans-Mars/i,
      'EARTH DEPARTURE FAILURE',
      'Centaur upper stage burn failed or propellant was exhausted before reaching required orbital or Earth escape velocity.',
      'Verify Centaur propellant margin and execute burn delta-V within prescribed tolerances.',
    ],
    [
      /flyby|miss distance|approach/i,
      'MARS FLYBY',
      'Midcourse trajectory correction error was too large; spacecraft flew past Mars without entering its gravitational sphere of influence.',
      'Trim along-track and cross-track delta-V carefully to keep Mars miss distance under 70,000 km.',
    ],
    [
      /overheat|thermal|aerobraking|periapsis/i,
      'ATMOSPHERIC OVERHEAT',
      'Aerobraking periapsis dipped too deep into the Martian atmosphere, causing thermal structural failure of the solar array hinges.',
      'Maintain periapsis within the safe aerobraking corridor (140–165 km) to balance deceleration and thermal dissipation.',
    ],
    [
      /power|blackout|battery|electric/i,
      'SPACECRAFT BLACKOUT',
      'Bus power depleted. Solar arrays un-deployed, prolonged eclipse pass, or electrical load exceeded battery storage.',
      'Deploy solar arrays immediately after cruise separation and monitor bus power drain during science operations.',
    ],
    [
      /propellant|fuel|exhaustion/i,
      'PROPELLANT EXHAUSTION',
      'Hydrazine reserves depleted before completing mission-critical delta-V burns.',
      'Select high-capacity propellant tanks and execute burns within optimal fuel windows.',
    ],
    [
      /orbital insertion|inclination|target orbit/i,
      'ORBITAL INSERTION ERROR',
      'Final science orbit altitude (300 ± 25 km) or polar inclination (93 ± 2°) failed mission acceptance criteria.',
      'Match circularization trim delta-V with current apoapsis and calibrate inclination to 93°.',
    ],
    [
      /capture|MOI|Mars Orbit/i,
      'MARS CAPTURE FAILURE',
      'Improper Mars Orbit Insertion (MOI) burn failed to achieve gravitational capture around Mars.',
      'Reserve sufficient propellant for MOI and keep delta-V within 855–1025 m/s with gimbal angle ≤ ±6°.',
    ],
    [
      /communications|antenna|downlink/i,
      'COMMUNICATIONS LOSS',
      'High-Gain Antenna was not deployed or electrical fault prevented data downlink to the Deep Space Network.',
      'Deploy HGA antenna, verify battery health, and resolve RF conflicts before scheduled downlink passes.',
    ],
  ];

  for (const [pattern, id, analysis, advice] of checks) {
    if (pattern.test(reason)) {
      return {
        id,
        headline: 'MISSION FAILURE · ' + id,
        name: id,
        badge: 'MISSION FAILURE',
        analysis,
        advice,
      };
    }
  }

  return {
    id: 'mission-loss',
    headline: 'MISSION FAILURE · VEHICLE LOSS',
    name: 'Mission Terminated',
    badge: 'SYSTEM FAILURE',
    analysis:
      'A critical flight parameter or operating limit was breached. Mission Control terminated the flight sequence.',
    advice: 'Review the final flight telemetry log and adjust spacecraft loadout and flight parameters.',
  };
}
