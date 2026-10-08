import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const home = source("../mobile/src/features/home/HomeScreen.tsx");
const particles = source(
  "../mobile/src/features/home/HomeAmbientParticles.tsx",
);

describe("Home ambient particles", () => {
  it("mounts the particle layer only inside the clipped hero", () => {
    assert.match(
      home,
      /<View style=\{\[styles\.hero,[\s\S]*?<HomeHeroArtwork[\s\S]*?<HomeAmbientParticles \/>[\s\S]*?<View style=\{\[styles\.heroTopbar/,
    );
    assert.match(home, /hero: \{[\s\S]*?overflow: "hidden"/);
    assert.equal(home.match(/<HomeAmbientParticles \/>/g)?.length, 1);
  });

  it("cannot intercept touches and stays outside Home content", () => {
    assert.match(particles, /pointerEvents="none"/);
    assert.match(
      home,
      /<HomeAmbientParticles \/>[\s\S]*?<\/View>\s*\n\s*<View style=\{styles\.contentPanel\}>/,
    );
  });

  it("uses thirteen fixed definitions that remain stable across rerenders", () => {
    const definitions = particles.match(/\{ left: "\d+%"/g) ?? [];
    assert.equal(definitions.length, 13);
    assert.doesNotMatch(particles, /Math\.random|useState/);
  });

  it("hides ambient motion when reduced motion is enabled", () => {
    assert.match(particles, /const reduceMotion = useReducedMotion\(\)/);
    assert.match(particles, /if \(reduceMotion\) return null/);
  });

  it("uses UI-thread repetition without timer-driven React updates", () => {
    assert.match(particles, /withRepeat\(/);
    assert.match(particles, /useAnimatedStyle\(/);
    assert.doesNotMatch(
      particles,
      /setInterval|setTimeout|requestAnimationFrame/,
    );
  });
});
