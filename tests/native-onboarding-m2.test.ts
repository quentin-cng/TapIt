import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const introPager = source(
  "../mobile/src/features/onboarding/IntroPager.tsx",
);
const nfcScene = source(
  "../mobile/src/features/onboarding/intro/NfcIntroScene.tsx",
);
const plaque = readFileSync(
  new URL(
    "../mobile/assets/onboarding/nfc-plaque.png",
    import.meta.url,
  ),
);

describe("native onboarding M2 NFC scene", () => {
  it("uses a dedicated Slide 1 scene and the supplied plaque asset", () => {
    assert.match(introPager, /import \{ NfcIntroScene \}/);
    assert.match(introPager, /<NfcIntroScene \{\.\.\.slideMotion\[0\]}/);
    assert.match(
      nfcScene,
      /require\("\.\.\/\.\.\/\.\.\/\.\.\/assets\/onboarding\/nfc-plaque\.png"\)/,
    );
    assert.match(nfcScene, /resizeMode="contain"/);
    assert.deepEqual([...plaque.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  });

  it("runs one cancellable UI-thread timeline only while active", () => {
    assert.match(nfcScene, /if \(!active\)[\s\S]*timeline\.set\(0\)/);
    assert.match(nfcScene, /withRepeat\([\s\S]*withSequence\(/);
    assert.match(nfcScene, /cancelAnimation\(timeline\)/);
    assert.match(nfcScene, /return \(\) => \{[\s\S]*timeline\.set\(0\)/);
    assert.doesNotMatch(nfcScene, /setInterval|setTimeout|requestAnimationFrame/);
  });

  it("renders a clear static success state for reduced motion", () => {
    assert.match(
      nfcScene,
      /if \(reduceMotion\)[\s\S]*timeline\.set\(STATIC_SUCCESS_PROGRESS\)/,
    );
    assert.match(
      nfcScene,
      /if \(reduceMotion\)[\s\S]*opacity: 0\.25/,
    );
    assert.match(nfcScene, /Checked in/);
  });

  it("does not add automatic haptics or non-M2 integrations", () => {
    assert.doesNotMatch(
      nfcScene,
      /Haptics|triggerTapHaptic|supabase|usePendingCheckin|perform_checkin/,
    );
    assert.doesNotMatch(nfcScene, /LinearGradient|BlurView/);
  });
});
