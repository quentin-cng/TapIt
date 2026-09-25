import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const recapPage = source("../app/recap/page.tsx");
const styles = source("../app/globals.css");

describe("Weekly Recap presentation", () => {
  it("puts goal results before mascot commentary and streak", () => {
    const hitIndex = recapPage.indexOf('className="recap-section hit"');
    const missedIndex = recapPage.indexOf('className="recap-section missed"');
    const mascotIndex = recapPage.indexOf("<TapItMascotSpeech");
    const streakIndex = recapPage.indexOf('className="recap-streak-highlight"');

    assert.ok(hitIndex > 0);
    assert.ok(missedIndex > hitIndex);
    assert.ok(mascotIndex > missedIndex);
    assert.ok(streakIndex > mascotIndex);
  });

  it("renders hit and missed users with name, username, and progress", () => {
    assert.match(recapPage, /stats=\{recap\.goalsHit\}[\s\S]*status="hit"/);
    assert.match(
      recapPage,
      /stats=\{recap\.goalsMissed\}[\s\S]*status="missed"/,
    );
    assert.match(recapPage, /\{stat\.displayName\}/);
    assert.match(recapPage, /@\{stat\.username\}/);
    assert.match(
      recapPage,
      /stat\.previousSessions\} \/ \{stat\.previousGoal/,
    );
    assert.doesNotMatch(recapPage, /recap\.noGoal|status="none"/);
  });

  it("uses visually distinct but restrained result groups", () => {
    assert.match(styles, /\.recap-section\.hit[\s\S]*background: #f5fbf7/);
    assert.match(styles, /\.recap-section\.missed[\s\S]*background: #fff7f8/);
    assert.match(styles, /\.recap-section\.hit \.section-label[\s\S]*var\(--success\)/);
    assert.match(styles, /\.recap-section\.missed \.section-label[\s\S]*var\(--danger\)/);
  });

  it("removes Most Points and keeps tie-safe Best Weekly Streak", () => {
    assert.doesNotMatch(recapPage, /Most points|recap\.mostPoints/);
    assert.match(recapPage, /Best weekly streak/);
    assert.match(recapPage, /recap\.bestStreak\.map/);
    assert.match(recapPage, /streakValue > 0/);
  });

  it("shows one zero-result speech without empty result cards", () => {
    assert.match(recapPage, /const hasGoalResults/);
    assert.match(recapPage, /\{hasGoalResults \? \(/);
    assert.match(recapPage, /<TapItMascotSpeech/);
    assert.doesNotMatch(recapPage, /No one in this group/);
  });
});
