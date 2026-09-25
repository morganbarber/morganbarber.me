import { test } from "node:test";
import assert from "node:assert/strict";
import {
  count,
  parseBasicProfile,
  parseProgress,
  percent,
  topFocusAreas,
} from "./hackthebox-parse.ts";

// Trimmed from real responses; personal fields replaced with fakes.
const basic = {
  profile: {
    id: 2623084,
    name: "MorganBarber",
    system_owns: 12,
    user_owns: 14,
    user_bloods: 0,
    system_bloods: 0,
    respects: 0,
    rank: "Script Kiddie",
    current_rank_progress: 30.93,
    next_rank: "Hacker",
    ranking: 1008,
    points: 10,
    joined_date: "2025-09-15T17:35:00.000000Z",
    full_name: "Test Person",
    phone_number: "+15555550100",
    timezone: "Antarctica/Palmer",
  },
};

const challenges = {
  profile: {
    solved_tasks: 0,
    challenge_owns: { solved: 8, total: 855, percentage: 1 },
    challenge_categories: [
      { name: "Web", owned_flags: 0, total_flags: 171 },
      { name: "Satellite", owned_flags: 8, total_flags: 9 },
    ],
  },
};

const sherlocks = {
  profile: {
    solved_tasks: 24,
    challenge_owns: { solved: 1, total: 267 },
    challenge_categories: [
      { name: "DFIR", owned_flags: 1, total_flags: 156 },
      { name: "SOC", owned_flags: 0, total_flags: 17 },
    ],
  },
};

test("count treats zero, negatives and null as absent", () => {
  assert.equal(count(0), null);
  assert.equal(count(-3), null);
  assert.equal(count(null), null);
  assert.equal(count(12), 12);
});

test("percent clamps and rounds", () => {
  assert.equal(percent(30.93), 31);
  assert.equal(percent(140), 100);
  assert.equal(percent(-5), 0);
  assert.equal(percent(null), null);
});

test("basic profile keeps real stats and drops zero ones", () => {
  const p = parseBasicProfile(basic);
  assert.deepEqual(p, {
    username: "MorganBarber",
    rank: "Script Kiddie",
    nextRank: "Hacker",
    rankProgress: 31,
    points: 10,
    userOwns: 14,
    systemOwns: 12,
    memberSince: "2025-09-15",
  });
});

test("basic profile never carries personal fields through", () => {
  const serialised = JSON.stringify(parseBasicProfile(basic));
  assert.doesNotMatch(serialised, /5555550100|Test Person|Antarctica|phone|full_name/);
});

test("basic profile tolerates numeric strings and rejects a missing envelope", () => {
  const p = parseBasicProfile({ profile: { user_owns: "3", system_owns: "0" } });
  assert.equal(p?.userOwns, 3);
  assert.equal(p?.systemOwns, null);
  assert.equal(p?.rankProgress, null, "no progress without a next rank");
  assert.equal(parseBasicProfile({ nope: true }), null);
  assert.equal(parseBasicProfile(null), null);
});

test("challenge progress lists only categories with solves", () => {
  const p = parseProgress(challenges, "Challenges");
  assert.equal(p?.solved, 8);
  assert.equal(p?.tasks, null, "tasks are a Sherlock concept");
  assert.deepEqual(p?.areas, [
    { name: "Satellite", kind: "Challenges", owned: 8, total: 9, percent: 89 },
  ]);
});

test("sherlock progress includes answered tasks", () => {
  const p = parseProgress(sherlocks, "Sherlocks");
  assert.equal(p?.solved, 1);
  assert.equal(p?.tasks, 24);
  assert.equal(p?.areas.length, 1);
});

test("focus areas merge across sources, most-solved first, capped", () => {
  const areas = topFocusAreas([
    parseProgress(sherlocks, "Sherlocks"),
    null,
    parseProgress(challenges, "Challenges"),
  ]);
  assert.deepEqual(
    areas.map((a) => a.name),
    ["Satellite", "DFIR"],
  );
  assert.equal(topFocusAreas([parseProgress(challenges, "Challenges")], 0).length, 0);
});

test("owned is clamped to total so a bar never exceeds 100%", () => {
  const p = parseProgress(
    { profile: { challenge_categories: [{ name: "X", owned_flags: 12, total_flags: 9 }] } },
    "Challenges",
  );
  assert.deepEqual(p?.areas[0], {
    name: "X",
    kind: "Challenges",
    owned: 9,
    total: 9,
    percent: 100,
  });
});
