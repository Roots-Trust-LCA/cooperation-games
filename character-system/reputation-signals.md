# Reputation Signals: Conduct, Skill, and Reliability

**Schema:** `coordination-games/enrollment@1.1`
**Sprint:** P509
**Author:** Dianoia (Techne Collective Intelligence)
**Date:** May 10, 2026

## Overview

The character system displays three distinct reputation meters on every enrolled participant profile:

1. **conduct_score** — platform integrity signal
2. **skill_score** — in-game capability signal
3. **reliability_score** — claim-behavior alignment signal

These signals are **not** a single composite "trust score." They measure distinct dimensions of participant behavior, sourced from different data streams, and serve different coordination functions.

This document defines what each signal measures, how it's computed, where the data comes from, and how it decays over time.

---

## The Gap This Fills

**Problem:** Issue [#23](https://github.com/coordination-games/coordination-games/issues/23) identified that the platform was collapsing reputation into a single scalar, mixing platform-conduct (cooperation rate, rule adherence) with in-game performance (strategic skill). This creates a category error: someone can be an excellent cooperator but a weak strategist, or vice versa.

**Current state:** The character viewer (P508) displays three score meters that are currently empty. The enrollment schema (P507) declares `conduct_score`, `skill_score`, `reliability_score` as optional number fields on `BaseProfile`. But the computation logic and data sources are undefined.

**What this sprint delivers:** Signal definitions, computation specifications, schema additions (ScoreRecord interface), and character viewer tooltip explanations.

---

## Signal 1: Conduct Score [0, 1]

### What It Measures

**Platform integrity.** How well does this participant uphold the norms of cooperation across all games? This is the lobby gate signal — public lobbies require minimum conduct to prevent defection cascades.

Conduct is **cross-game**. It aggregates behavior from every game the participant has played, weighted by recency and game type.

### Data Sources

1. **Game completion events** — Did the participant finish games they started, or abandon mid-round?
2. **Conduct attestations (EAS)** — Peer-authored attestations about rule adherence, non-harassment, cooperative behavior.
3. **Platform moderation events** — Warnings, suspensions, or bans (negative weight).

### Computation

```
conduct_score = weighted_avg(completion_events + conduct_attestations - moderation_events)
```

**Weights:**
- Game completion: `+0.02` per completed game (cumulative)
- Cooperative outcome (both players cooperate): `+0.05` bonus
- Defection in Prisoner's Dilemma context: `-0.10` penalty
- Conduct attestation (peer-authored): `+0.15` per attestation (if from agent with conduct ≥ 0.6)
- Moderation warning: `-0.30`
- Suspension: `-0.60` (recoverable)
- Ban: score set to `0.0` (non-recoverable without appeal)

**Normalization:** Raw score clamped to [0, 1]. New participants start at `0.5` (neutral) until they accumulate 5+ games.

### Decay Model

Conduct decays **slowly** because platform norms persist across seasons.

**Half-life:** 180 days (6 months)
**Decay factor:** `r = 0.996` per day (from #21 trust architecture, adjusted for conduct)

```typescript
score_t = score_0 * (0.996 ^ days_since_last_game)
```

Conduct score will halve after 6 months of inactivity. After 1 year: 25% remains. After 2 years: ~6% remains (effectively reset).

**Rationale:** Platform conduct should persist longer than in-game skill (which decays faster due to meta shifts). A participant who was cooperative in Season 1 should retain partial conduct credit into Season 2, even if they didn't play between seasons.

### Display

**Character viewer tooltip (on hover):**

> **Conduct Score: 0.72**
> Platform integrity signal. Cooperation rate and rule adherence across all games. Sourced from game completions + conduct attestations.
> *Computed: 2026-05-08 | Games sampled: 47*

---

## Signal 2: Skill Score [0, 1]

### What It Measures

**In-game capability.** How well does this participant perform within game mechanics? Skill is derived from **ELO-style performance ratings** within each game type, normalized across seasons.

Skill is **game-specific**. A participant may have high skill in Prisoner's Dilemma but low skill in Capture the Flag. The profile displays the **primary skill** (highest or most-played game), with per-game breakdowns available in the detailed view.

### Data Sources

1. **Game outcome events** — Win/loss/draw records per game type
2. **ELO performance ratings** — Updated after every game using standard ELO with k-factor = 32
3. **Season normalization** — ELO ratings reset each season; skill_score bridges across seasons using percentile rank

### Computation

**Per-game ELO:**

```
ELO_new = ELO_old + k * (actual_score - expected_score)
```

Where:
- `k = 32` (standard)
- `actual_score`: 1 for win, 0.5 for draw, 0 for loss
- `expected_score = 1 / (1 + 10^((opponent_ELO - player_ELO) / 400))`

**Skill score normalization:**

```typescript
skill_score = percentile_rank(player_ELO, season_ELO_distribution)
```

Each participant's ELO is converted to a percentile within the season's player pool. This produces a [0, 1] score where:
- `0.9` = top 10% of players
- `0.5` = median player
- `0.1` = bottom 10%

**Cross-season bridging:**
When a new season starts, carry forward 40% of prior season's skill_score as the starting value. This prevents full reset while allowing meta shifts to rebalance rankings.

### Per-Game Variants

The schema supports per-game skill scores using a namespaced format:

```
skill:prisoners-dilemma = 0.78
skill:capture-the-flag = 0.52
skill:shelling-point = 0.91
```

The profile's primary `skill_score` field displays the **highest** or **most-played** game skill. The character viewer "Skill Breakdown" panel shows all game-specific scores.

### Decay Model

Skill decays **faster** than conduct because game meta shifts rapidly between seasons.

**Half-life:** 90 days (3 months)
**Decay factor:** `r = 0.992` per day

```typescript
skill_score_t = skill_score_0 * (0.992 ^ days_since_last_game)
```

After 3 months of inactivity: 50% remains. After 6 months: 25%. After 1 year: ~6% (effectively reset).

**Rationale:** In-game skill becomes stale as strategies evolve and new archetypes emerge. A participant who was top 10% in Season 1 but didn't play Season 2 should not retain full skill credit into Season 3.

### Display

**Character viewer tooltip (on hover):**

> **Skill Score: 0.84**
> In-game capability signal. Derived from ELO performance across game types, normalized by season percentile.
> *Primary game: Shelling Point | Computed: 2026-05-09 | Games sampled: 63*

**Skill Breakdown panel (expandable):**

```
Prisoners Dilemma:  0.78  (23 games)
Capture the Flag:   0.52  (12 games)
Shelling Point:     0.91  (28 games, primary)
```

---

## Signal 3: Reliability Score [0, 1]

### What It Measures

**Claim-behavior alignment.** How well does this participant's stated archetype and capability documentation match their actual in-game behavior?

Reliability is the **self-description accuracy signal**. It answers: "Can I trust what this participant says about themselves?"

High reliability = predictable. Low reliability = either experimental (trying new strategies) or deceptive (misrepresenting capabilities).

### Data Sources

1. **Archetype declaration at enrollment** — What coordination posture did the participant claim? (Cooperator, Tit-for-Tat, Defector, Adaptive, etc.)
2. **Observed strategy patterns** — Behavioral classification from game logs using pattern recognition (cooperative rate, defection timing, response to betrayal, etc.)
3. **Capability doc claims** — If the participant authored a skill doc, how well do their stated capabilities match observed performance?

### Computation

**Behavioral divergence score:**

```typescript
divergence = |declared_archetype_vector - observed_behavior_vector|
reliability_score = 1 - divergence
```

**Declared archetype vector:** A 5-dimensional vector encoding the stated coordination posture:
- Cooperation rate (claimed): [0, 1]
- Defection under pressure (claimed): [0, 1]
- Reciprocity (claimed): [0, 1]
- Forgiveness (claimed): [0, 1]
- Exploitation resistance (claimed): [0, 1]

**Observed behavior vector:** Same 5 dimensions, computed from actual game logs over last N games (N = 20 minimum for stable estimate).

**Distance metric:** Euclidean distance between the two vectors, normalized to [0, 1].

**Reliability weighting:**
Reliability score is **only computed after 20+ games**. Below that threshold, the profile shows `reliability_score = null` and displays "Insufficient data" in the character viewer.

### Decay Model

Reliability decays **moderately** — faster than conduct, slower than skill.

**Half-life:** 120 days (4 months)
**Decay factor:** `r = 0.994` per day

```typescript
reliability_score_t = reliability_score_0 * (0.994 ^ days_since_last_game)
```

After 4 months of inactivity: 50% remains. After 8 months: 25%. After 16 months: ~6%.

**Rationale:** Reliability tracks self-description accuracy. Participants may shift archetypes between seasons (intentionally experimenting or adapting). Reliability should decay at a moderate rate — not as fast as skill (which responds to meta shifts) but faster than conduct (which measures stable norms).

### Edge Cases

**No archetype declared:** If the participant enrolled without selecting an archetype or authoring a capability doc, `reliability_score` remains `null` indefinitely. The character viewer displays: "No declared archetype — reliability not applicable."

**Experimental participants:** Participants who frequently shift strategies will have **low reliability**, but this is not inherently negative. Low reliability signals: "This participant is exploring the strategy space" or "Behavioral model is incomplete."

**High reliability ≠ high conduct:** A participant can have high reliability (consistent with their stated archetype) but low conduct (if they declared "Defector" and consistently defect). Reliability measures **predictability**, not **cooperativeness**.

### Display

**Character viewer tooltip (on hover):**

> **Reliability Score: 0.67**
> Claim-behavior alignment signal. How well stated archetype matches observed strategy patterns.
> *Declared: Tit-for-Tat | Computed: 2026-05-07 | Games sampled: 34*

**Insufficient data state:**

> **Reliability Score: —**
> Insufficient data (minimum 20 games required).
> *Games played: 12*

---

## Schema Additions to enrollment-schema.ts

To support these signal definitions, the schema adds a **ScoreRecord** interface that captures not just the score value but the metadata needed for transparency:

```typescript
/**
 * Score record with computation metadata.
 * Used for conduct_score, skill_score, reliability_score on BaseProfile.
 */
export interface ScoreRecord {
  score: number;              // [0, 1]
  computed_at: string;        // ISO timestamp of last computation
  games_sampled: number;      // number of games included in computation
  season: number;             // season in which score was computed
  decay_applied?: boolean;    // true if decay factor was applied since last game
  last_game_at?: string;      // ISO timestamp of most recent game (for decay calculation)
}

/**
 * Per-game skill score variant.
 * Example: skill:prisoners-dilemma, skill:capture-the-flag
 */
export interface PerGameSkillRecord extends ScoreRecord {
  game_type: string;          // e.g. "prisoners-dilemma", "capture-the-flag"
  elo_rating: number;         // raw ELO before percentile normalization
  percentile_rank: number;    // [0, 1] percentile within season
}
```

**Updated BaseProfile fields:**

```typescript
export interface BaseProfile {
  // ... existing fields ...

  // Attestation scores (populated post-game)
  conduct_score_record?: ScoreRecord;
  skill_score_record?: ScoreRecord;
  reliability_score_record?: ScoreRecord;

  // Per-game skill breakdown (optional)
  skill_scores_by_game?: Record<string, PerGameSkillRecord>;

  // Primary game (highest or most-played) for skill_score display
  primary_game?: string;  // e.g. "shelling-point"

  // Legacy fields (deprecated in v1.1, retained for backward compat)
  conduct_score?: number;       // use conduct_score_record.score instead
  skill_score?: number;         // use skill_score_record.score instead
  reliability_score?: number;   // use reliability_score_record.score instead
}
```

**Computation input interfaces** (for backend scoring systems):

```typescript
/**
 * Input data for conduct score computation.
 */
export interface ConductScoreInput {
  participant_id: string;
  game_completions: number;
  cooperative_outcomes: number;
  defections: number;
  conduct_attestations: number;  // count of peer attestations with weight ≥ 0.6
  moderation_warnings: number;
  suspensions: number;
  bans: number;
  last_game_at: string;  // ISO timestamp
}

/**
 * Input data for skill score computation.
 */
export interface SkillScoreInput {
  participant_id: string;
  game_type: string;
  elo_rating: number;
  games_played: number;
  season_elo_distribution: number[];  // all participant ELOs for percentile calculation
  last_game_at: string;
}

/**
 * Input data for reliability score computation.
 */
export interface ReliabilityScoreInput {
  participant_id: string;
  declared_archetype_vector: number[];  // 5-dimensional [0,1] vector
  observed_behavior_vector: number[];   // 5-dimensional [0,1] vector from game logs
  games_sampled: number;
  last_game_at: string;
}
```

---

## Character Viewer Updates

### Score Meter Tooltips

The character viewer (P508) displays three horizontal meters for conduct, skill, and reliability. Each meter now includes a hover tooltip with:

1. **Score value** (2 decimal places)
2. **Signal definition** (1-2 sentences)
3. **Metadata**: Computed date, games sampled, primary game (for skill)

**Visual separation:** Conduct (platform) is styled differently from skill (game) and reliability (claim). Use color coding:
- **Conduct:** Blue (platform-level, cross-game)
- **Skill:** Green (in-game performance)
- **Reliability:** Orange (self-description accuracy)

### Insufficient Data States

When a score cannot be computed (< 5 games for conduct, < 20 games for reliability), display:

```
Conduct Score: —
(Minimum 5 games required. Games played: 3)

Reliability Score: —
(Minimum 20 games required. Games played: 12)
```

Skill score is always computable after the first game (ELO initialization).

### Skill Breakdown Panel

Add an expandable "Skill Breakdown" section below the primary skill meter showing per-game scores:

```
┌─ Skill Breakdown ─────────────────────────────────┐
│ Prisoners Dilemma    0.78  ████████░░  (23 games) │
│ Capture the Flag     0.52  █████░░░░░  (12 games) │
│ Shelling Point       0.91  █████████░  (28 games, primary) │
└───────────────────────────────────────────────────┘
```

---

## Connections to Trust Architecture (#21)

This sprint defines the **signals** that populate the character viewer. Issue #21 (Trust architecture: platform attestation primitives + reputation-standard plugin) defines the **attestation infrastructure** that generates the raw data for these signals.

**Relationship:**

- **P509 (this sprint):** Signal definitions — what conduct/skill/reliability mean, how they're computed, how they decay
- **#21 (future sprint):** Attestation market mechanics — how attestations are authored, weighted by attester stewardship, rolled up on-chain via EAS

The signals defined here are **consumers** of the attestation data produced by #21. The computation formulas in this document assume the attestation primitives are available.

**Decay model alignment:**
The decay factors in this document reference the `r = 0.99` daily decay specified in #21 but adjust per signal type:
- Conduct: `r = 0.996` (slower decay, platform norms persist)
- Skill: `r = 0.992` (faster decay, meta shifts rapidly)
- Reliability: `r = 0.994` (moderate decay, self-description stability)

---

## What This Does NOT Include

- **Full attestation market mechanics** — Separate sprint (#21)
- **EAS on-chain rollup** — Separate sprint
- **Guardian NFT contracts** — Separate sprint
- **Rate limit infrastructure** — Issue #26 (prerequisite for market, not signal definitions)
- **Backend scoring implementation** — This document defines the spec; implementation is out of scope for P509

---

## References

- **Issue #23:** [Reputation: separate platform-conduct from in-game reputation signals](https://github.com/coordination-games/coordination-games/issues/23)
- **Issue #21:** [Trust architecture: platform attestation primitives + reputation-standard plugin](https://github.com/coordination-games/coordination-games/issues/21)
- **P507:** Enrollment Flow & Stakeholder Profile System (defines BaseProfile)
- **P508:** Character Viewer (displays the score meters)
- **Schema:** [character-system/enrollment-schema.ts](https://github.com/Roots-Trust-LCA/cooperation-games/blob/main/character-system/enrollment-schema.ts)

---

## Retrospective Notes

**What worked:**
- Signal separation (conduct ≠ skill ≠ reliability) clarifies what each score measures and prevents category errors
- ScoreRecord interface with metadata (computed_at, games_sampled) provides transparency and decay calculation support
- Per-game skill variants allow skill specialization without overloading the primary skill_score field

**Design tensions:**
- Reliability score requires 20+ games for stable estimate, which may exclude new participants from this signal for weeks
- Decay model parameters (half-life values) are initial estimates; may need tuning after Season 1 data
- Conduct score starts at 0.5 (neutral) for new participants, which may feel arbitrary — alternative: start at null until 5 games

**Open questions for future sprints:**
- Should reliability_score decay faster for participants who declare "experimental" or "adaptive" archetypes?
- How to handle participants who change their declared archetype mid-season? Reset reliability? Track multiple archetype-behavior pairs?
- Should skill_score display the **highest** game skill or the **most-played** game skill as primary? Current spec uses highest, but most-played may be more representative.

---

*Dianoia — May 10, 2026 — P509*
