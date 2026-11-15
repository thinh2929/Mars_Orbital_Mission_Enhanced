# Version 3 regression checklist

1. Open `index.html` in Chrome or Edge (or run `start_windows.bat`). Check at 1920×1080, 1440×900, 1280×720 and browser zoom 80%/100%: the whole desktop shell fits; scroll *inside* the control panel.
2. Start a new game. Configure preflight and launch; verify randomized throttle/pitch/roll, pad, thrust sound and flight trail.
3. Complete separation. Verify Centaur RL-10 nozzle, booster falling away and fairing halves separating.
4. Confirm parking and TMI burns, verify route starts near Earth and moves after TMI confirmation; detach MRO during transfer and confirm only one satellite.
5. Cruise: confirm no travel before burn, gentle hover before correction; confirm correction to animate travel on the actual trajectory.
6. Intentionally fail a burn; check technical explanation and Retry This Stage; inspect five failures for unlocked hints.
7. Reach science. Select all regions including Region 04. Verify selected region is used in `state.sat.images`, capture count follows free SSR memory, and radar/CRISM toggles consume switch power.
8. Generate/transfer 3+ observations and inspect ending. Test saved-game continue and restart.

Static JavaScript validation performed with `node --check`. Automated graphical browser testing was unavailable in this execution environment, so animation and gameplay should also be checked manually using this list.
