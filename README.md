# Where's Santa?

A Christmas pixel-art adventure in 8 stages. Santa has gone missing on Christmas Eve, and Ollie has to find him before morning.

It plays in the browser on desktop and mobile, in English, Deutsch and Ελληνικά.

**Stages**
1. Platformer
2. Skateboard runner
3. Point & click
4. Top-down park adventure
5. Sleigh shooter
6. Turn-based battle
7. Candy puzzle
8. Attic platformer, followed by the finale

Collect every cookie and all 8 of Santa's mittens to unlock a secret ending.

## Controls

| | Keyboard | Touch |
|---|---|---|
| Move | Arrow keys | Joystick (left side) |
| Jump | Space / Z | JUMP button |
| Action | X / J | X button |
| Pause | P / Esc | Pause button |
| Fullscreen | F | Fullscreen button |
| Mute | M | Sound button |
| Graphics: enhanced / classic | G | — |

## Running locally

The site is fully static, with no build step and no outside requests. It needs to be served over http:

```sh
python3 -m http.server
```

Then open http://localhost:8000.

## Credits

- Built with [three.js](https://threejs.org) (MIT, see `assets/THREE-LICENSE.txt`).
- Fonts: Press Start 2P and Ubuntu (SIL Open Font License, see `assets/fonts/`).
