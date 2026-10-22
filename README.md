# AquaVR — First-person Virtual Aquarium

A browser-based university mini project. Walk through a full-screen aquarium with coral tanks, a curved shark tunnel, tropical habitats, a kelp forest, a deep-sea gallery and a panoramic ocean hall.

## Run

Requires Node.js 18 or newer. Runtime dependencies are bundled locally; installation is not needed to play.

```sh
npm start
```

Open http://localhost:8000. Click **Enter the aquarium** to capture the mouse. Press **Escape** to release it and open the menu. Stop the server with Ctrl+C. Use `PORT=8001 npm start` if port 8000 is occupied.

## Controls

| Control | Action |
| --- | --- |
| WASD / arrow keys | Walk |
| Mouse | Look around (drag if pointer lock is unavailable) |
| Shift | Walk faster |
| Space | Small hop; stand up from a bench |
| E / left click | Inspect the highlighted animal, coral or exhibit station |
| M | Gallery map and travel |
| P | Take a photograph |
| J | Photo journal; download captured photographs |
| F | Toggle research light |
| R | Replay the current gallery narration |
| Escape | Pause / release the mouse |

In the menu, adjust sound, narration, captions, mouse sensitivity and graphics resolution. Touch devices have movement buttons and drag look.

## Included

- Six physically connected galleries, floor/wall/tank collisions and gravity.
- 60 animated marine animals: fish, sharks, a spotted whale shark, manta rays, turtles and jellies. Eight animated visitors follow gallery routes and stop near exhibits.
- Transparent tank windows, a curved tunnel, animated water surfaces, caustic light patterns, suspended particles, coral and swaying kelp.
- Spatially panned ambient sound and synthesized footsteps, plus optional browser speech narration and captions.
- Reef restoration, shark myth identification, tropical habitat matching, deep-sea research observations and a four-question quiz.
- Observation benches, exhibit signage, a gallery map and a session-only photo journal (up to 12 images).

## VR

Use a WebXR-capable headset and browser. The VR button enables itself when immersive VR is available. Controller triggers select, the left stick walks, and the right stick snap turns. A/X buttons open navigation. Gaze dwelling also selects targets. Every exhibit station includes a gallery map for teleportation. Panels appear in 3D and captions remain visible in VR. Photo capture is currently desktop-only.

WebXR needs localhost or HTTPS. To access the experience from a separate headset, serve this static directory through HTTPS; ordinary HTTP at a LAN IP is generally insufficient. Physical headset behavior has not been verified here.

## Project structure

- `src/world.js`: aquarium architecture, tanks, vegetation, visitors and swimming routes.
- `src/creatures.js`: original textured marine models and articulated animation.
- `src/player.js`: player collision, gravity, movement and soundscape.
- `src/main.js`: interaction, activities, desktop/VR panels and game state.
- `src/data.js`: exhibit facts, species information and quiz questions.
- `src/graphics.js`: materials, procedural textures, water shaders and static geometry batching.
- `vendor/`: pinned A-Frame 1.6.0 and Three.js geometry utility, with license notices.
- `tools/server.mjs`: local static file server. No backend or accounts are required.

Marine forms and people are original illustrative 3D artwork rather than photorealistic scans. Water uses visual shaders rather than fluid simulation. Player physics uses a kinematic controller with collision sliding, substeps and gravity. The earlier museum files are unused by the current entry point.

## Sources and credits

Inspired by [Georgia Aquarium](https://www.georgiaaquarium.org/gallery/ocean-voyager/), [Monterey Bay Aquarium](https://www.montereybayaquarium.org/visit/exhibits/kelp-forest), [Oceanário de Lisboa](https://oceanario.pt/en/exhibitions/) and [Okinawa Churaumi Aquarium](https://churaumi.okinawa/en/area/the-kuroshio/). This is an original student demonstration, not an affiliated replica.

Scientific sources are linked in the in-game credits and in `src/data.js`, including NOAA Ocean Service, NOAA Fisheries and NOAA Ocean Exploration. The original procedural artwork follows the project's MIT license. A-Frame and Three.js are MIT licensed; notices are in `vendor/`.

## Verification

JavaScript syntax, desktop startup, movement, map travel, rendering and photo capture were checked in Chrome. The opening scene was reduced from approximately 950 to 320 draw calls through static geometry batching, shared materials and gallery visibility culling. These draw-call counts are not a hardware frame-rate guarantee. Full manual interaction checks and physical headset validation remain to be performed.

Optional visual smoke check: `npm install`, then `npm run test:browser`. Set `CHROME_BIN` if Chrome is not at `/usr/bin/google-chrome`. The game must already be running. This captures the initial screen and reports JavaScript errors; it does not replace player interaction checks.
