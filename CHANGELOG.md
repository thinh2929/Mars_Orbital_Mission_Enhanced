# Changelog — 2.0

- Updated viewport layout for desktop and mobile.
- Added fullscreen button; preserved Canvas scene, mission HUD, and all original assets.
- Fixed launch trajectory trail to originate from rocket engine nozzle.
- Added launch camera shake and mechanical stage, fairing and payload separation effects.
- Integrated user-supplied Earth/Mars GLB planet meshes with offline WebGL renderer, retaining 2D fallback.
- Replaced purely time-based ascent with a mass/thrust/fuel/gravity/drag coupled 2-axis integration.
- Added dynamic stowed width/fairing feasibility checks, Centaur rocket-equation consumption.
- Added battery Wh, solar generation, spacecraft blackout, damaged solar output, and activity electricity costs.
- Moved solar array and high-gain antenna deployments to after MRO/Centaur separation during cruise.
- Added multibranch good/bad endings with failure reason, diagnosis, suggested improvement and mission telemetry.
- Tested logical full success flow and selected failure branches using a JavaScript runtime harness.

## v3 — Responsive mission control & gameplay fixes (14 Nov 2026)

- Desktop viewport-fit layout prioritizes mission controls while reducing simulation canvas height. Sidebar and control panel scroll internally; mobile retains a vertically arranged view.
- Ground launch pad, launch tower and engine-tail tracking; redesigned Centaur RL-10 separation illustration.
- TMI and midcourse screens include confirmed-transfer animation, inertial hover before cruise confirmation and independent actual-versus-target trajectory tracing.
- All navigation sliders initialize with randomized offsets. Guidance lines become visible after five failures per stage.
- Per-stage failure checkpoint, retry-stage button and preserved failure explanation.
- Region 4 can now be selected; science capture is limited by available storage rather than an arbitrary 8-image maximum.
- Radar/CRISM switching charges a 12 Wh switching cost; science power draw continues to depend on active equipment.
- User-triggered engine ignition, upper-stage, separation and payload-release effects generated with Web Audio, with sound enabled when a new mission starts.
- Larger telemetry and control fonts, spaced ending metrics and slightly revised score adjustment for region diversity.

**Educational gameplay caveat:** Transfers and burns are approximations, not mission-certified orbital mechanics. Desktop screen height constraints can still require scrolling **inside** mission control cards at smaller resolutions. Some optional research/strategy ideas have not been replaced with full astrodynamics solvers or procedural science missions.
