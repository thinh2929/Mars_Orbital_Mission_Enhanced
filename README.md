# MARS ORBITAL MISSION — Spaceflight Simulator

A high-fidelity spaceflight operations simulator inspired by NASA's **Mars Reconnaissance Orbiter (MRO)** mission aboard the **Atlas V 401** launch vehicle. Built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **HTML5 Canvas**, and **WebGL 3D**.

---

## 🚀 Quick Start

### Option 1: One-Click Launch (Windows)
Double-click **`start_nextjs.bat`** in the project root. This automatically starts the development server and launches your default web browser at `http://localhost:3000`.

### Option 2: Command Line (PowerShell / Terminal)
```bash
# 1. Install dependencies
npm install

# 2. Launch development server
npm run dev

# 3. Or create an optimized production build
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000) in any modern desktop web browser (Chrome, Edge, Firefox, or Safari).

---

## 🛰️ Mission Overview & 8-Phase Campaign

The simulator models the complete journey of the Mars Reconnaissance Orbiter from Space Launch Complex 41 (SLC-41) at Cape Canaveral to a low-altitude polar science orbit around Mars:

```
[Phase 1: Assembly] ──► [Phase 2: Liftoff & Ascent] ──► [Phase 3: Staging] ──► [Phase 4: Parking Orbit]
                                                                                      │
[Phase 8: Science]  ◄── [Phase 7: Mars Capture]     ◄── [Phase 6: Cruise]  ◄── [Phase 5: TMI Departure]
```

### 1. Spacecraft Assembly & Preflight Inspection
- Configure 5 satellite subsystems: Science Instrument Payload, Solar Array System, High-Gain Antenna (HGA), Solid State Recorder (SSR), and Monopropellant Tank.
- Choose between 3 heavy-lift rocket configurations (Atlas V 401, Atlas V 551, Delta IV Heavy).
- Balance payload mass, electrical power budget, folded stowed envelope vs. fairing diameter, and liftoff Thrust-to-Weight Ratio (TWR).

### 2. Liftoff & Atmospheric Ascent
- Control the launch vehicle with realistic avionics cockpit controls:
  - **Engine Throttle Quadrant Lever**: Modulate RD-180 rocket thrust (keep liftoff TWR > 1.0; throttle down through high dynamic pressure at Max Q).
  - **TVC Gimbal Pitch Lever**: Counteract atmospheric drag and wind shear, keeping ascent within the guidance corridor (±18 units).
  - **Roll Attitude Trim Dial**: Neutralize aerodynamic rolling moments.
- Coupled 2-axis physics integration tracking dynamic pressure ($Q = \frac{1}{2} \rho v^2$), gravitational losses, propellant mass flow, and Main Engine Cut-Off (MECO) at 101 km altitude.

### 3. Stage Separation & Centaur Ignition
- Sequence mechanical booster separation with pyrotechnic shock simulation.
- Ignite the cryogenic Centaur RL-10 upper stage engine in vacuum.
- Jettison the dual-half payload fairing once dynamic pressure drops below safety thresholds.

### 4. Earth Parking Orbit Insertion
- Execute Centaur upper-stage orbital burn to circularize into a stable low Earth parking orbit ($148 \times 185\text{ km}$).
- Shaded green target orbital corridor provides visual feedback for burn duration and cutoff timing.

### 5. Trans-Mars Injection (TMI)
- Execute hyperbolic escape burn ($\Delta v \approx 3,600\text{–}4,050\text{ m/s}$) to break Earth's gravitational sphere of influence and enter a heliocentric Hohmann transfer ellipse.
- Perform pyrotechnic separation of the MRO spacecraft from the Centaur upper stage adapter.

### 6. Interplanetary Cruise & Trajectory Correction
- Deploy dual high-efficiency gallium-arsenide solar arrays and the 3-meter High-Gain Antenna (HGA) to avoid electrical blackout.
- Execute midcourse Trajectory Correction Maneuvers (TCM) to eliminate along-track ($\Delta v_{\parallel}$) and cross-track ($\Delta v_{\perp}$) drift, targeting Mars arrival within 70,000 km miss distance.

### 7. Mars Orbit Insertion & Aerobraking
- Perform retro-propulsion Mars Orbit Insertion (MOI) burn ($\Delta v \approx 940\text{ m/s}$) for gravitational capture.
- Navigate consecutive atmospheric aerobraking dips through the Martian upper atmosphere ($140\text{–}165\text{ km}$ periapsis) to shed orbital energy and lower apoapsis while protecting solar array hinges from thermal overheat.
- Perform circularization burn into the operational polar science orbit ($300\text{ km}$ altitude, $93^\circ$ polar inclination).

### 8. Polar Science Operations
- Command primary scientific instruments:
  - **HiRISE (High Resolution Imaging Science Experiment)**: Ultra-high-resolution visible camera.
  - **CRISM (Compact Reconnaissance Imaging Spectrometer for Mars)**: Mineral and water-ice mapping.
  - **SHARAD (Shallow Radar)**: Subsurface sounding radar.
- Manage battery charge/discharge cycles, avoid instrument radio-frequency conflicts, store observations on the Solid State Recorder (SSR), and downlink high-rate science telemetry to NASA's Deep Space Network (DSN).

---

## 🎮 Key Features & Technical Highlights

- **Avionics Cockpit & Mechanical Levers**: Interactive cockpit with throttle quadrant lever, TVC gimbal lever, attitude trim dial, digital 7-segment readouts, and flight telemetry HUD.
- **Interactive 3D WebGL Planetary Visualization**: Real NASA topography models for Mars and Earth rendered using Three.js with orbit controls, atmospheric rim shaders, and offline texture fallbacks.
- **60 FPS Physics Simulation Engine**: High-performance HTML5 Canvas rendering decoupled from React state updates using `requestAnimationFrame`, sub-pixel vector trails, staging pyro particles, and launch pad camera shake.
- **Web Audio Procedural Sound Synthesizer**: Zero external audio files — rocket engine rumble, staging pyro clanks, booster resonance, guidance warnings, and telemetry beeps are synthesized in real time via the Web Audio API.
- **Multi-Branch Mission Outcomes**: 11+ unique mission outcomes (Primary Mission Complete, Exceptional Mission, Marginal Success, and specific failure diagnostics with technical root-cause analyses and mitigation guidance).
- **Mission Checkpoint & Smart Guidance**: Auto-saves state per flight phase to `localStorage`. If an anomaly occurs, players can retry that specific stage; progressive guidance hints unlock after repeated failures.
- **Fully Responsive Mission Control UI**: Viewport-adaptive layout designed for standard and widescreen displays ($1920\times1080$, $1440\times900$, $1280\times720$) with independent card scrolling and fullscreen toggle.

---

## 📁 Project Architecture

```
Mars_Orbital_Mission_Enhanced/
├── public/
│   └── assets/                     # NASA 3D GLB models, planetary textures, Atlas V & MRO sprites
├── src/
│   ├── app/
│   │   ├── globals.css             # Cyberpunk/Retro-Sci-Fi Mission Control styles & animations
│   │   ├── layout.tsx              # Root HTML Layout, Metadata & responsive viewport configuration
│   │   ├── not-found.tsx           # Telemetry 404 error page
│   │   └── page.tsx                # Main single-page application shell
│   ├── components/
│   │   ├── Header.tsx              # Top bar, Sol clock, audio toggle, fullscreen, abort/restart
│   │   ├── LeftSidebar.tsx         # Flight Director console, 8-phase timeline, real-time event log
│   │   ├── RightSidebar.tsx        # Live telemetry HUD, power budget bar, safety checks, mission checklist
│   │   ├── SimulationCanvas.tsx    # 60 FPS Canvas simulation, SLC-41 pad, staging physics, orbital trajectories
│   │   ├── LaunchCockpit.tsx       # Phase 2 Avionics cockpit with throttle, TVC pitch, and roll levers
│   │   ├── Mars3DView.tsx          # 3D WebGL rotating Mars sphere with Three.js & GLTF loader
│   │   ├── ControlPanel.tsx        # Interactive control panels for all 8 flight phases
│   │   ├── Footer.tsx              # Mission Operations Center bottom telemetry strip
│   │   ├── IntroOverlay.tsx        # Mission briefing dossier, historical specs & start/resume modal
│   │   ├── Modal.tsx               # Flight manual handbook, mission debrief report, restart confirmation
│   │   └── ToastContainer.tsx      # Procedural audio-reactive toast notification alerts
│   ├── context/
│   │   └── GameContext.tsx         # Central React state machine, physics loop, localStorage checkpoints
│   └── lib/
│       ├── types.ts                # Strict TypeScript interfaces for all game entities and telemetry
│       ├── constants.ts            # Component specifications, launch vehicle parameters, phase metadata
│       ├── physics.ts              # Atmospheric drag, gravity integration, rocket equation, aerobraking
│       ├── planetMesh.ts           # Pre-extracted 3D geometry vertices, normals, and UVs for offline rendering
│       ├── planetRenderer.ts       # Standalone WebGL 3D planet renderer with lighting shaders
│       ├── audio.ts                # Real-time Web Audio API sound generator
│       └── endings.ts              # Multibranch debrief reports, failure analysis & score evaluation
├── .gitignore                      # Git ignore rules for node_modules, build outputs, and secrets
├── next.config.mjs                 # Next.js configuration (asset optimization, clean dist)
├── package.json                    # Project dependencies (Next.js 15, React 19, Three.js, TypeScript)
├── start_nextjs.bat                # Windows quick launcher batch file
├── tsconfig.json                   # TypeScript compiler configuration
└── README.md                       # This comprehensive documentation
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15.1 (App Router) |
| **UI Library** | React 19 |
| **Language** | TypeScript 5.7 (strict typing) |
| **3D Rendering** | Three.js 0.187 (WebGL) + Custom WebGL Shader fallback |
| **2D Simulation** | HTML5 Canvas API (hardware-accelerated, 60 FPS) |
| **Audio** | Web Audio API (real-time procedural oscillator synthesis) |
| **Styling** | Vanilla CSS (CSS Variables, Grid & Flexbox, CRT scanline effects) |
| **State Management** | React Context API + LocalStorage persistence |

---

## 📜 Educational & Aerospace Simulation Notice

This simulator is designed for educational exploration and spaceflight enthusiasm. Atmospheric ascent dynamics, Tsiolkovsky rocket equation calculations, Max Q aerodynamic drag, and aerobraking corridor models reflect authentic physics principles. However, specific mission parameters (burn durations, orbital mechanics approximations, simplified flight timelines, and program budgets) have been balanced for engaging interactive gameplay. It is not intended for operational flight guidance design.

GLB 3D planetary models and topographic surface textures are derived from publicly available NASA/JPL datasets.

---

## 📄 License

Created for educational and spaceflight simulation purposes. All NASA planetary textures, Atlas V imagery, and Mars Reconnaissance Orbiter assets belong to their respective public domain / educational resource creators.
