# Chick Mates Sandbox

A browser prototype for designing and testing **Chick Mates** puzzle situations
without building them in Unity. Paint a grid, play it immediately, export it as
JSON.

Open `index.html` in any browser. No build step, no dependencies, no server.

## The mechanic

Two chicks are tethered one tile apart. One is the **anchor**; pressing a chick's
button sends it one tile around the anchor, and the other chick becomes the new
anchor. The pair walks by alternating presses.

Each chick carries its own turn direction — the left one starts clockwise, the
right one counter-clockwise — shown as an arrow on the edge of its tile pointing
at the tile it will jump to next.

- **Open tile** — the chick lands there.
- **Box** — gets pushed one tile along the direction of travel; the chick holds
  its tile. A box pushed into water is lost.
- **Gate** — swings 90° about its hinge in the direction of the push; the chick
  holds its tile and its direction. Closed, a gate blocks everything.
- **Hard block** (tree, fence, board edge, wedged box) — the chick does not move
  and **both** chicks flip their turn direction.
- **Water** — a real landing, and a fatal one. The level restarts.

A level is complete when both chicks stand in coops at the same time.

### A constraint worth knowing

An orbiting pair **cannot enter a one-tile-wide corridor** — every slot around
the anchor is blocked, so presses only flip direction and the pair sits there.
Boards need open space; the puzzle comes from handedness and scattered
obstacles rather than from narrow passages.

## Enemies

All three run off the same step clock: one button press is one step for
everything on the board.

| Enemy | Behaviour |
|---|---|
| **Bear** | Stationary and solid. A chick entering its 1-tile radius arms a 3-step fuse; when it fires, anything in that radius is lost. The countdown then resets. |
| **Coyote** | Paces an authored path one tile per step, turning around at each end (1 2 3 4 3 2 1 …). Boxes, fences and closed gates stop it and turn it early. Sharing a tile with a chick loses the level. |
| **Eagle** | Never lands, so it is never on the board. Works through its authored target tiles in order, striking one every 3 steps. The cycle runs from level load, not from the first press. |

## Editing

Switch to **Edit** and paint with the tool row. Fences and gates go on the edges
*between* tiles — pick either tool and tap strips appear along every internal
boundary. Tapping a gate cycles its hinge between the edge's two corners, which
is what decides the way it swings.

The coyote path and the eagle's targets are tapped out in order and numbered.

## Levels

`levels/` holds a 30-level campaign, `Level_01` through `Level_30`, with coops as
the only objective. Every one is machine-verified solvable; each file's `notes`
field carries its chapter, design intent, target difficulty and shortest
solution as a press sequence.

Import a single level, or paste an array of them to load the whole campaign into
the saved list at once.

Two caveats carried in the files themselves:

- **Levels 08–09** are placeholders. The campaign design calls for a *one-way*
  gate there; the game has only the swinging gate, so they teach swing
  sequencing instead.
- **Level_24** can be made unwinnable from about a quarter of its reachable
  states — the gate can be swung into a position that seals the only crossing.
  Deliberate at that point in the campaign, but worth revisiting.

## Tools

`tools/` is a Node port of the rules plus a breadth-first solver, used to verify
that levels are solvable and to measure them.

```
node tools/build.js      # build + verify the whole campaign
node tools/gen.js        # write levels/Level_NN.json one file per level
```

- `engine.js` — the rules, mirroring `index.html`
- `solver.js` — BFS for the shortest solution, plus a dead-end census
- `levels.js` — the 30 level definitions as ASCII maps
- `build.js` — ASCII → level JSON, and the verification report

Shortest-solution length is the difficulty number here. It is a proxy: it
measures route length, not how hard the insight is. Real calibration comes from
playtesting.

### Map format

```
.  grass     ~  water    T  tree     B  box
C  coop      X  bear     l  left chick    r  right chick
1-9  coyote path, in order
a-f  eagle target tiles, in order
```

Edges are listed separately: `"4,3:n"` is the north edge of tile (4,3), `:w` the
west edge, and a gate adds its hinge corner — `"4,3:n@5,3"`.
