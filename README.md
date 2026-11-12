# Chick Mates Sandbox

A browser prototype for designing and testing **Chick Mates** puzzle situations
without building them in Unity. Paint a grid, play it immediately, export it as
JSON.

Open `index.html` in any browser, or the published page. No dependencies, no
server.

`src/sandbox.html` is the source of truth. It carries no `<!doctype>` or `<head>`
of its own because the Claude artifact host supplies them; `node tools/wrap.js`
adds that shell and writes `index.html` for GitHub Pages. Edit the source, run
the wrapper, commit both.

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
the only objective. Every board is framed by one tile of water; `tools/gen.js`
adds that frame, which is why the ASCII maps in `tools/levels.js` show only the
interior.

Falling in is a normal way to lose, so the waterline is open by default. Two
things soften it, both deliberate rather than automatic. Chapter one's boards
carry an extra tile of grass margin, which keeps the learning area clear of the
coast without pretending the coast is safe. And a level can name a `seawall`
side, which fences the waterline along one edge only — a wall the player can
see and lean on. Levels 1 and 10 use one; the rest are open water.

## Level status

Every level carries a `status`: `ready`, `draft` or `test`. Only `ready` means
"this belongs in the game" — it is the set a Unity sync would ask for. `test` is
for boards that exist to try a mechanic rather than to be played.

Set it on the open level under Board & situation, and filter the side panel by
it. **Export ready levels** in the JSON panel emits just that set, each entry
carrying its `type` and `status`.

The whole campaign ships as `draft`. Every level is verified solvable and
designed against the campaign doc, but none has been played by a person, and
the design doc is clear that difficulty is only real once it has been
playtested. Promote them as you play them.

Status changes you make live in this browser, keyed by level name, so they
follow the page rather than the files. The files carry the status they were
generated with until you publish.

**Publish to repo** (JSON panel) commits the status you set in this browser
into `levels/` on main, as one commit through the GitHub API. Only levels
whose status was set in this browser are written, so publishing from a fresh
browser demotes nothing. Unity's *Chick Mates > Levels > Sync Ready Levels From
Sandbox* reads the repo, so: mark ready → Publish → Sync.

It needs a fine-grained GitHub token with **Contents: read and write** on this
repository only, set once per browser with **GitHub token**. It is stored in
that browser's localStorage and sent only to api.github.com.

## Tools

`tools/` is a Node port of the rules plus a breadth-first solver, used to verify
that levels are solvable and to measure them.

```
node tools/build.js      # build + verify the whole campaign
node tools/gen.js        # write levels/Level_NN.json one file per level
node tools/wrap.js       # regenerate index.html from src/sandbox.html
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
