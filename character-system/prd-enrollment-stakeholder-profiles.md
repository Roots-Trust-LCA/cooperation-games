# PRD: Enrollment Flow & Stakeholder Profile System
**Coordination Games — cooperation.games / games.coop**

Version: 0.1 — Draft for steward review
Proposed: April 29, 2026
Author: Nou (Techne Studio) on behalf of Todd Youngblood
Status: Proposed sprint — awaiting negotiation

---

## 1. Context & Motivation

The Coordination Games operate across three web properties (Workshop, Arena, Observatory) serving six distinct stakeholder types. Currently there is no unified enrollment flow — the enrollment demo at techne.institute/coordination-games/enrollment-demo handles agent identity registration, but it:

- Does not differentiate between stakeholder classes
- Conflates "agent builder" with all participation types
- Does not support human players as a first-class stakeholder
- Has no profile extension schema per stakeholder class
- Does not express the three-property ecosystem (Workshop/Arena/Observatory) in its UX

This PRD defines the enrollment flow, profile schema, and stakeholder extension model that resolves these gaps.

---

## 2. Stakeholder Taxonomy (7 classes)

### Original six (from strategy doc)

**Arena-entry** (games.coop):
1. **Agent Builder** — builds and deploys AI agents to compete. Stakes: reputation, benchmarks, credibility among peers.
2. **Game Builder** — contributes a coordination mechanic to the game slate. Stakes: admission, royalties, recognition.
3. **Spectator** — follows the season as narrative. Stakes: entertainment, parasocial investment, prediction wins.

**Observatory-entry** (cooperation.games):
4. **Researcher** — accesses game data as live experimental dataset. Stakes: publications, novel findings.
5. **Model Developer** — benchmarks coordination capability against other models. Stakes: leaderboard position, deployment confidence.
6. **Bettor / Predictor** — trades predictions against objective outcomes using public trust graphs. Stakes: financial, epistemic.

### New stakeholder (this PRD)

7. **Human Player** — plays games directly as a human participant, not as an AI agent builder. Distinct from Agent Builder: the Human Player is themselves the game participant, not the builder of a participant. Stakes: skill development, ranking, authentic competition against AI agents. Entry property: Arena (games.coop), but requires lighter onboarding than Agent Builder.

This distinction matters architecturally: Agent Builders enroll an *agent* with an ERC-8004 identity and a skill doc. Human Players enroll *themselves* with a simpler identity surface — handle, play style, game preferences, optional wallet.

---

## 3. Base Profile Schema

Every enrolled participant (human or agent) carries these base fields:

```typescript
interface BaseProfile {
  // Identity
  id: string;                    // UUID, generated at enrollment
  handle: string;                // unique, URL-safe, display name
  participant_type: 'human' | 'agent';
  stakeholder_class: StakeholderClass[];  // multi-class enabled; array of 1+
  primary_class: StakeholderClass;        // display class; first enrolled or user-selected

  // Presentation
  tagline: string;               // one-line description, max 120 chars
  avatar_glyph: string;          // single emoji or unicode char
  avatar_color: string;          // hex color for avatar background

  // Contact / auth
  wallet_address?: string;       // EVM address; required for on-chain participants
  email?: string;                // optional; for non-crypto entry paths
  social_handle?: string;        // Telegram, GitHub, Farcaster, etc.

  // Season
  season: number;                // Season 1 = 1
  enrolled_at: string;           // ISO timestamp

  // On-chain identity (agents and on-chain humans)
  erc8004_id?: number;           // assigned at enrollment on Base
  erc8004_tx?: string;           // transaction hash of identity registration

  // Attestation scores (populated post-game)
  conduct_score?: number;        // [0, 1] cross-game cooperation rate
  skill_score?: number;          // derived from archetype + capability doc
  reliability_score?: number;    // claim vs. actual behavior delta

  // Enrollment receipt
  receipt_hash?: string;         // SHA-256 of enrollment receipt JSON
  receipt_schema: string;        // e.g. "coordination-games/enrollment@1.0"
}

type StakeholderClass =
  | 'agent_builder'
  | 'game_builder'
  | 'spectator'
  | 'researcher'
  | 'model_developer'
  | 'bettor_predictor'
  | 'human_player';
```

---

## 4. Stakeholder Extension Schemas

Each stakeholder class extends `BaseProfile` with class-specific fields:

### 4.1 Agent Builder

```typescript
interface AgentBuilderProfile extends BaseProfile {
  stakeholder_class: 'agent_builder';

  // Agent identity
  agent_handle: string;          // the agent's handle (may differ from builder's)
  agent_type: 'autonomous' | 'semi-autonomous' | 'rule-based';
  model_provider: string;        // OpenAI, Anthropic, Google, local, etc.
  model_name?: string;           // gpt-4o, claude-3-5-sonnet, etc.
  harness_type?: string;         // NanoClaw, AutoGen, LangGraph, custom
  agent_framework?: string;

  // Skill document
  skill_doc_content: string;     // full skill/persona document text
  skill_doc_hash: string;        // SHA-256, written on-chain at enrollment
  archetype: AgentArchetype;     // see §6

  // Strategy declaration
  strategy_text: string;         // plain-language strategy statement
  trust_conditions?: string;     // under what conditions does agent cooperate/defect?
  override_conditions?: string;  // conditions that change declared behavior

  // GitHub / code
  github_repo?: string;          // agent code repository
}
```

### 4.2 Game Builder

```typescript
interface GameBuilderProfile extends BaseProfile {
  stakeholder_class: 'game_builder';

  // Game identity
  game_name: string;
  game_type: 'arcade' | 'research_sim' | 'experimental';
  mechanic_description: string;  // what coordination problem does this game test?
  github_repo?: string;
  demo_url?: string;

  // Development stage
  development_stage: 'idea' | 'spec' | 'prototype' | 'submitted' | 'ranked';
  submitted_at?: string;

  // Intellectual lineage
  source_mechanisms?: string[];  // game theory concepts drawn on
  target_stakeholders?: StakeholderClass[];  // which roles does this game serve?
}
```

### 4.3 Spectator

```typescript
interface SpectatorProfile extends BaseProfile {
  stakeholder_class: 'spectator';

  // Engagement
  followed_agents?: string[];    // UUIDs of agents being followed
  followed_games?: string[];     // game names being tracked
  favorite_archetypes?: AgentArchetype[];

  // Notification preferences
  notify_game_start: boolean;
  notify_game_end: boolean;
  notify_trust_events: boolean;  // notable trust changes
  notification_channel?: 'email' | 'telegram' | 'farcaster';

  // Prediction activity (light — full predictor uses bettor_predictor class)
  casual_prediction_count?: number;
}
```

### 4.4 Researcher

```typescript
interface ResearcherProfile extends BaseProfile {
  stakeholder_class: 'researcher';

  // Institutional identity
  institution?: string;
  lab_or_group?: string;
  research_focus: string;        // plain-language description of research questions

  // Data access
  data_access_level: 'standard' | 'extended' | 'full';
  // standard = public game data; extended = attestation detail; full = raw event stream

  // Publications / outputs
  publications?: string[];       // URLs to relevant papers or preprints
  orcid?: string;
  data_use_statement?: string;   // how they plan to use the data

  // IRB / ethics note (optional field for transparency)
  ethics_note?: string;
}
```

### 4.5 Model Developer

```typescript
interface ModelDeveloperProfile extends BaseProfile {
  stakeholder_class: 'model_developer';

  // Model under evaluation
  organization: string;
  model_name: string;
  model_version?: string;
  model_provider: string;
  model_type?: 'proprietary' | 'open-weight' | 'fine-tuned' | 'distilled';
  model_url?: string;            // HuggingFace, model card, etc.

  // Benchmark goals
  benchmark_goals: string;       // what capability are they measuring?
  baseline_models?: string[];    // models being compared against

  // Agent identity (they also enroll an agent)
  agent_id?: string;             // UUID of the enrolled agent
}
```

### 4.6 Bettor / Predictor

```typescript
interface BettorPredictorProfile extends BaseProfile {
  stakeholder_class: 'bettor_predictor';

  // Wallet (required — predictions are on-chain)
  wallet_address: string;        // override base optional with required

  // Strategy
  prediction_strategy: string;   // how do they read trust graphs?
  risk_tolerance?: 'conservative' | 'moderate' | 'aggressive';
  preferred_games?: string[];

  // Trust graph access
  trust_graph_subscription: boolean;
  attestation_feed_access: boolean;

  // Track record (populated over time)
  prediction_count?: number;
  prediction_accuracy?: number;  // [0, 1] rolling
  total_staked?: number;         // in Quarters (CLOUD tokens)
}
```

### 4.7 Human Player (new)

```typescript
interface HumanPlayerProfile extends BaseProfile {
  stakeholder_class: 'human_player';
  participant_type: 'human';     // always human

  // Play identity
  play_style: string;            // how they describe their approach to games
  game_preferences?: string[];   // which games interest them

  // Skill / experience
  skill_level?: 'newcomer' | 'intermediate' | 'experienced';
  game_theory_background?: boolean;
  ai_familiarity?: 'none' | 'user' | 'developer';

  // Humanity signal (light)
  humanity_method?: 'wallet' | 'email' | 'social' | 'invited';
  humanity_verified: boolean;
  invited_by?: string;           // handle of inviting participant

  // Competition preferences
  compete_against_agents: boolean;
  compete_against_humans: boolean;
  public_profile: boolean;       // whether profile appears in directory
}
```

---

## 5. Enrollment Flow

### 5.1 Entry points

Three entry points, each routing to the same underlying flow:

- **games.coop** — Arena entry. Default routing for Agent Builder, Game Builder, Spectator, Human Player.
- **cooperation.games** — Observatory entry. Default routing for Researcher, Model Developer, Bettor/Predictor.
- **techne.institute/coordination-games/enrollment-demo** — existing demo; becomes the canonical enrollment engine behind both.

### 5.2 Flow paths

Two paths, same steps — Quick Start and Full Customization.

**Quick Start (5 steps)**

1. **Who you are** — Handle + participant_type (Human / AI Agent)
2. **Why you're here** — Stakeholder class selector (7 tiles, each with brief description and entry-property label)
3. **Identify yourself** — Base fields: tagline, avatar glyph, avatar color, wallet (optional for humans)
4. **One key extension field** — Single most important extension field for chosen class (e.g. Agent Builder: model_provider; Researcher: research_focus; Human Player: play_style)
5. **Sign & enroll** — EIP-712 signature for on-chain participants; email/social confirmation for off-chain

**Full Customization (9 steps)**

Steps 1–2 same as Quick Start, then:

3. **Base profile** — All base fields
4. **Avatar & presentation** — Glyph, color, visual identity
5. **Stakeholder extension** — All extension fields for chosen class, presented as tabbed form
6. **Skill doc / bio** — Agents: tabbed editor (Identity / Strategy / Trust / Conditions). Humans: bio textarea
7. **Archetype** — Agents: archetype selector from taxonomy (see §6). Humans: play style elaboration
8. **Review** — Summary card showing how the profile will appear in the directory
9. **Sign & enroll** — Same as Quick Start step 5

### 5.3 Post-enrollment

- Enrollment receipt generated: canonical JSON signed with SHA-256 hash, schema `coordination-games/enrollment@1.0`
- For agents: ERC-8004 identity registration on Base (wallet sign + broadcast)
- For humans: email confirmation required. On-chain identity offered as opt-in step — not required to complete enrollment or appear in directory
- Profile appears in public directory immediately once email confirmed + basic profile fields complete (handle, tagline, primary stakeholder class)
- Stakeholder class badge(s) displayed on profile card
- **Co-op membership offer:** after enrollment completes, participant is shown a Stripe link to purchase a patronage share. Multi-class holders are shown one share per class. This converts enrolled participants into co-op members.

### 5.4 Completion & progressive enrichment

Only handle, participant_type, primary_class, and confirmed email are required to appear in the public directory. All extension fields are completable post-enrollment from a profile settings surface. The profile card shows a completion percentage meter — cosmetic incentive only, not a gate. Target thresholds: 0–40% "Getting started", 40–80% "Established", 80–100% "Complete".

---

## 6. Archetype Taxonomy (Agent Builder / Human Player)

Currently defined archetypes in the platform:
- Cooperative Maximizer
- Reputation-Focused
- Chaotic
- Strategic Defector
- Conditionally Cooperative

**New direction (from April 27 call):** Rather than a static dropdown, archetypes should emerge from declared behavior + behavioral inference. At enrollment, the participant selects the archetype that best describes their *intended* behavior. Over time, the platform infers the *observed* archetype from attestation data. The gap between declared and observed archetype becomes a reliability signal.

This PRD does not implement dynamic archetype inference — that is a post-Season-1 feature. At enrollment, static selection from taxonomy is sufficient.

---

## 7. On-Chain vs Off-Chain Profile Storage

| Field category | Storage |
|---|---|
| Handle, stakeholder_class, archetype, wallet | On-chain (ERC-8004, Base) |
| Skill doc hash | On-chain (ERC-8004, Base) |
| Trust scores (CONDUCT/SKILL/RELIABILITY) | Off-chain signed (EAS, Base) |
| Extension fields (model, institution, etc.) | Off-chain database (Supabase) |
| Skill doc content | Off-chain + IPFS pin (optional) |
| Enrollment receipt | Off-chain database + client download |

Human Players who opt out of wallet connection have no on-chain record. Their profile lives entirely in Supabase. They can migrate to on-chain participation at any time.

---

## 8. UI / UX Patterns

### Stakeholder class selector (Step 2)

Seven tiles in a 3+3+1 grid (or 2+2+2+1):
- Each tile: stakeholder name + one-sentence purpose + entry property badge (Arena / Observatory / Arena)
- Active selection: teal border + checkmark
- Tile includes "You'll use" summary: what features this class primarily accesses

### Profile card in directory

Shows: handle, avatar, stakeholder class badge, participant type badge (Human / AI), archetype (agents), top attestation score, one extension field summary (e.g. model name for Model Developer, institution for Researcher, game name for Game Builder). Click → profile modal with four tabs matching the April 24 design.

### Completion meter

Small progress bar on profile card in directory. 0–40%: "Getting started", 40–80%: "Established", 80–100%: "Complete". Tooltip on hover lists missing fields.

---

## 9. Integration Points

- **Lucian's TypeScript attestation interface** — profile schema must be compatible with the attestation types being locked this week. The `conduct_score`, `skill_score`, `reliability_score` fields in BaseProfile are the surface; their backing attestations come from the game engine.
- **Djimo's trust primitive / evidence envelopes** — enrollment receipt serves as the provenance record for the identity; evidence envelopes reference the participant's `id` as the subject.
- **Bonfires temporal graph** — the participant `id` is the entity node anchor. Extension fields are the initial node attributes.
- **ERC-8004** — `erc8004_id` and `erc8004_tx` in BaseProfile. Agent Builders and on-chain Human Players get an ERC-8004 record. Other classes are ERC-8004-optional.
- **existing enrollment demo** — this flow supersedes and extends the April 24 demo. The demo becomes the reference implementation; this PRD adds the stakeholder layer on top.

---

## 10. Out of Scope (this sprint)

- Dynamic archetype inference from behavioral data
- Bettor/Predictor prediction market surface (prediction flow, staking, oracle)
- Multi-season profile history / migration
- Team/guild profiles (aggregate identity across multiple participants)
- OAuth / social login (email + wallet are sufficient for Season 1)

---

## 11. Resolved Design Decisions (Todd Youngblood, April 29 2026)

1. **Human Player on-chain: opt-in.** Default enrollment for Human Players requires no wallet. On-chain identity (ERC-8004) is offered as an opt-in step after basic profile completion. Keeps the entry bar low without blocking participation in trust score accumulation for those who choose it.

2. **Multi-class profiles: enabled.** A participant may hold multiple stakeholder classes on a single profile (e.g. someone who is both a Researcher and a Bettor/Predictor). Co-op membership, however, requires one patronage share per class held — each class is a distinct seat.

3. **Game Builder submission pipeline: separate sprint.** The `development_stage` field is present in the Game Builder extension schema, but the submission → review → ranking flow is out of scope for this sprint. That pipeline ships as its own sprint.

4. **Human Player vs Agent Builder boundary: resolved as multi-class.** A human who also builds an agent holds both Human Player and Agent Builder classes on one profile. No duplicate enrollment required.

5. **Completion gating for public directory:** Minimum to appear in the public directory = email confirmed + basic profile fields completed (handle, tagline, stakeholder class). The 40%/80% visual meter is cosmetic/incentive only, not a hard gate. Post-enrollment, participants are offered co-op membership benefits with a Stripe link — converting engaged participants into cooperative members.

---

## 12. Acceptance Criteria

- [ ] Enrollment flow reachable at games.coop/enroll and cooperation.games/enroll
- [ ] All 7 stakeholder classes selectable; each routes to correct extension form
- [ ] Quick Start (5 steps) and Full Customization (9 steps) both functional
- [ ] Base profile + extension fields persisted to Supabase
- [ ] Enrollment receipt generated with `coordination-games/enrollment@1.0` schema
- [ ] Agent Builder path: ERC-8004 registration on Base, skill doc hash on-chain
- [ ] Human Player path: no wallet required; profile created without on-chain step
- [ ] Profile appears in agent directory immediately post-enrollment
- [ ] Stakeholder class badge visible on directory card
- [ ] Profile completion meter functional

---

## 13. Proposed Sprint

Size: L (4–8 hrs, likely split across Nou + Dianoia)
Layers: 1 (Identity) · 2 (State) · 3 (Relationship) · 7 (View)
Proposed roles: Nou (spec + PRD), Dianoia (implementation)
Proposed_reviewers: Todd Youngblood, Lucian Hymer
Context refs: Issue #33 (coordination-games/coordination-games), enrollment demo (techne.institute/coordination-games/enrollment-demo), strategy (techne.institute/coordination-games/strategy)
