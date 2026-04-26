# Trust Model Evolution: From Plugin to Primitive

**Author:** Dianoia (Execution Intelligence Agent)
**Date:** 2026-04-26
**Context:** Synthesis of Lucian's v1 design and the trust model working session
**Sources:**
- [Lucian's trust attestation design](https://github.com/coordination-games/coordination-games/blob/trust-system-brainstorm/docs/plans/trust-attestations.md)
- [Trust model working session notes](./Coordination%20Games%3A%20Agent%20Trust%20Model%20and%20Reputation%20Plug-in%20Working%20Session.md)

---

## Executive Summary

The working session represents a significant philosophical and architectural shift from Lucian's initial design. Both are correct for their respective scopes, and they can be synthesized into a stronger whole.

**Lucian's design:** Trust is a **prediction market** where attesters bind their reputation to judgments, P&L determines stewardship, and the market resolves truth over time. No authority, no appeals. The system is economic.

**Working session:** Trust is a **multi-dimensional primitive** for portable identity across AI systems. The immediate use case is in-game coordination, but the real product is infrastructure for agent reputation beyond the games. The system is structural, not economic.

These are not incompatible, but they emphasize different things:
- Lucian optimizes for **resistance to manipulation** (sybil attacks, cabal capture, coordinated pile-ons)
- Working session optimizes for **portability and composability** (schema-first, lexicon-based, plug-in architecture)

**The synthesis:** Platform provides portable attestation primitives (working session), default plug-in provides market-based scoring (Lucian), alternative plug-ins can substitute different logic (working session's flexibility).

---

## Architecture Comparison

### Three-Layer Model (Working Session)

1. **System attestations** — Objective facts emitted by game engine (promises kept/broken, participation, commitments fulfilled)
2. **Conduct attestations** — Agent-authored signals about behavior hard to evaluate objectively (griefing, rule-following, key extraction attempts)
3. **Reputation plug-ins** — Consumers that aggregate attestations into useful summaries for decision-making

### Lucian's Model Mapping

Lucian's design doesn't explicitly separate system vs. conduct attestations, but it *could* support this:

- **System attestations** → Auto-drip mechanism (+0.05 CONDUCT per clean game completion). These are platform events, not signed attestations, but they serve the same role as working session's "objective facts."
- **Conduct attestations** → Human-authored attestations with `scope: "conduct"`, weighted by attester's CONDUCT + STEWARDSHIP.
- **Reputation plug-ins** → Lucian's design *is* a reputation plug-in (the `@ctl/attestations` plugin). It consumes attestations and produces scores, stewardship, and lobby gates.

**Key insight:** The working session describes the **platform architecture** (what types of data exist). Lucian describes **one specific consumer** of that data (a prediction market-based scoring system).

---

## Key Differences

### 1. Schema vs. Algorithm

**Working session priority:** "The most important early deliverable is the schema, not the graph structure or storage backend."

**Lucian's priority:** The algorithm (stewardship-scaled decay, P&L computation, slot capacity, market mechanics).

**My read:** Both are correct for their respective scopes. The working session is designing the *data layer* that multiple plug-ins can consume. Lucian is designing *one plug-in* that consumes that data in a specific way. But Lucian's document doesn't specify the attestation schema beyond the fields in the `Attestation` object.

**What's missing:** Lucian's schema (`polarity, size, scope, reason, signature`) is implementation-level. The working session wants **lexicons** — structured vocabularies that define what `scope: "skill:capture-the-flag"` means, how to interpret it, and what third-party verification it points to.

If Lucian's design is the default plug-in, it needs to define:
- Which `scope` tags the engine emits as system attestations
- Which `scope` tags are valid for conduct attestations
- What each scope means (the lexicon)

This is doable but currently implicit.

### 2. System Attestations as Platform Concern

**Working session:** "The engine writes its own attestations regardless of what plug-ins do." Trust attestation capture is treated as a first-class platform concern, not delegated to plug-ins.

**Lucian's design:** Auto-drip is handled by the plug-in (`ingestGameFinished()` function). The platform emits game completion events, but the plug-in decides whether to generate a CONDUCT signal.

**Tension:** If system attestations are a platform primitive (working session's view), they shouldn't live inside a plug-in. They should be written by the engine itself to a shared attestation table, and plug-ins consume them.

**Resolution:** Separate the concerns:
- Platform writes system attestations (promises kept/broken, game participation, commitments) to the `attestations` table with `attester: SYSTEM` or `attester: <game-engine-identity>`.
- Plug-in consumes system attestations + conduct attestations and produces derived scores.

This preserves the working session's "engine writes attestations on lobby close" principle while keeping Lucian's scoring logic intact.

### 3. Conduct Attestations and Moderation

**Working session:** "The engine operator does not want to be the moderator deciding who gets banned; pushing this into the agent layer creates space for emergent moderation patterns."

**Lucian's design:** CONDUCT attestations are human-authored, weighted by attester's reputation, with market incentives to get it right. Low-CONDUCT attesters have dampened voice. Reformed players can climb out via clean-game auto-drip.

**Alignment:** Both designs push moderation to the community layer, not the platform. Lucian's market mechanics are one way to make that work. The working session leaves room for alternative plug-ins that might use different aggregation logic (PageRank over attestation graph, domain-specific weighting, etc.).

**What the working session adds:** The explicit recognition that conduct is **multi-dimensional** (rule-following vs. interpersonal decency vs. abandonment behavior) and that a single CONDUCT scalar might not be sufficient long-term. Lucian's design assumes these correlate enough that one score works, but if they don't, the schema should allow for sub-scopes later (e.g., `conduct:gameplay`, `conduct:social`).

### 4. Trust as Fundable Primitive

**Working session framing:** "The agent trust primitive is plausibly the most fundable piece of the stack." The Coordination Games are the research sandbox; the reputation primitive is the product.

**Lucian's framing:** Implicitly assumes the games are the product, and reputation is an enabling feature.

**Strategic implication:** If trust infrastructure is the actual product, then:
- The schema becomes the **public API** (not just an internal data format)
- The default plug-in (Lucian's market mechanics) is a **reference implementation**, not the only valid consumer
- Portability matters more than Lucian's design currently emphasizes

**What this means for Lucian's design:**
- Attestations should be **platform-agnostic** (not just "this game engine emits them")
- The Merkle rollup on-chain is **deferred to Phase 2** per working session decision (schema stability first, then portability)
- The schema should be **documented for external consumers** (so non-game systems can participate in the trust graph)

Lucian's doc has a section "Daily Merkle Anchor" but treats it as optional ("future integration point"). The working session explicitly decided to **defer the on-chain anchor to v2** (after schema stabilizes), not ship in v1. This prioritizes schema stability over early portability.

### 5. AT Protocol as Reference

**Working session:** AT Protocol's pattern of identity-rooted, schema-defined data with lexicons is "structurally close to what the trust primitive needs."

**Lucian's design:** No mention of lexicons or cross-system portability. The schema is minimal (7 fields in the attestation object).

**What AT Protocol adds:**
- **Lexicons define attestation types** — Each game (or work scope) publishes a lexicon describing the attestation types it emits and how to interpret them.
- **agent.md-style documentation** — Human-readable docs that orient agents on how to consume the data.
- **Multi-dimensional trust** — Different lexicons for different contexts. An agent can have high trust in `game:oathbreaker` and low trust in `game:capture-the-flag`.

**How this fits with Lucian's design:**

Lucian's `scope` field is already multi-dimensional (`conduct`, `skill:<game-id>`, free-form). But it's not structured as a lexicon. To align with AT Protocol's pattern:

1. Each game publishes a **lexicon** defining its attestation types:
   - `game:oathbreaker/promise-kept` — Agent fulfilled a stated promise
   - `game:oathbreaker/promise-broken` — Agent broke a stated promise
   - `game:capture-the-flag/flag-captured` — Agent successfully captured a flag
   - `conduct/griefing` — Agent engaged in disruptive behavior
   - `conduct/rule-following` — Agent followed game rules

2. Each lexicon entry specifies:
   - **Polarity** (always +1, always -1, or variable?)
   - **Expected size range** (what does size 0.1 vs 1.0 mean in this context?)
   - **Interpretation guidance** (how should consumers weight this?)
   - **Third-party verification** (link to game replay, Merkle proof, etc.)

3. Lucian's algorithm consumes lexicon-conformant attestations and produces scores.

This is **additive, not a rewrite**. The attestation object stays the same; the lexicon is documentation + validation.

---

## Integration Tensions

### Lobby Types and Attestation Validity

**Lucian's design:** "Attestations always count regardless of lobby type. Derived-from-gameplay signals (auto-drip) only count from public lobbies."

**Working session:** Public ranked games require non-zero trust context and charge entry fee. Public free games are open to all. Private lobbies use external permissioning.

**Tension:** If private lobbies can generate attestations that count toward CONDUCT scores, they're sybil-vulnerable (I can spin up 10 private lobbies with my alts and vouch for myself).

**Lucian's mitigation:** Human conduct attestations are weighted by attester reputation (low-reputation alts have little voice). Auto-drip from private lobbies doesn't count.

**What's still unclear:** Can system attestations from private lobbies count? Example: In a private lobby, my agent makes a promise and keeps it. Does the engine write a `promise-kept` system attestation? If yes, does that contribute to my CONDUCT score?

**My recommendation:** System attestations from private lobbies should be written (for agent memory and audit trails) but **not consumed by the default trust plug-in** for score computation. Only public lobby system attestations count for platform-wide reputation. Private lobby attestations are available for custom plug-ins (guild-specific reputation, for instance) but don't feed the global trust graph.

### Engine as Attester vs. Neutral Relay

**Working session:** "The engine writes its own attestations on behalf of the system."

**Lucian's design:** Platform provides raw data (game event logs, match outcomes). Plug-in interprets.

**Tension:** Who signs system attestations?

**Option 1:** Engine has an ERC-8004 identity and signs attestations as `attester: <engine-wallet>`.
- Pro: Clear provenance. Third parties can verify "this attestation came from the official game engine."
- Con: Engine becomes a participant in the attestation graph, not just a neutral relay.

**Option 2:** System attestations are unsigned platform events (like Lucian's auto-drip).
- Pro: Engine stays neutral. No signature burden.
- Con: Harder to verify portability. How does an external system trust that the attestation is authentic?

**My recommendation:** Option 1. Engine has an identity and signs system attestations. This makes the trust primitive portable (anyone can verify the signature against the engine's public key). The engine's identity is a well-known system account, not a participant in games.

---

## What Lucian's Design Needs to Add (Based on Working Session)

1. **Lexicon for system attestations** — Define the 3-5 attestation types the engine emits, with interpretation guidance. Examples:
   - `game:generic/promise-kept` — Agent fulfilled a stated promise
   - `game:generic/promise-broken` — Agent broke a stated promise
   - `game:generic/participation` — Agent completed a game without abandonment
   - `game:generic/commitment-fulfilled` — Agent completed a stated commitment
   - `conduct/griefing-flagged` — Another agent flagged this agent for griefing

2. **Engine identity for system attestations** — Specify that the engine signs system attestations with a known public key, making them verifiable outside the platform.

3. **Private lobby attestation handling** — Clarify which attestations from private lobbies count for global reputation and which don't.

4. **Schema documentation for external consumers** — If trust is a primitive, the schema needs to be documented for non-game systems. Write an `agent.md` or similar that explains how to produce and consume attestations.

5. **On-chain Merkle rollup deferred to v2** — Working session decided to defer the daily Merkle anchor until schema stabilizes (v2), not ship in v1. Database storage sufficient for initial deployment.

6. **Multi-dimensional CONDUCT** — Consider whether CONDUCT should split into sub-scopes (`conduct:gameplay`, `conduct:social`) or if one scalar is sufficient. Start with one scalar, but design the schema to allow splitting later without breaking consumers.

---

## What the Working Session Leaves Open (That Lucian's Design Could Solve)

1. **How to aggregate attestations into useful summaries** — Working session says "default plug-in returns lightweight summaries" but doesn't specify the algorithm. Lucian's stewardship-weighted scoring is a strong candidate.

2. **How to handle coordinated attacks** — Working session doesn't address sybil resistance, cabal capture, or pile-ons. Lucian's market mechanics (P&L, stewardship-scaled decay, slot capacity) are designed to handle these.

3. **How to prevent attestation spam** — Working session doesn't specify rate limiting or capacity constraints. Lucian's slot model (activity-adaptive capacity based on CONDUCT + STEWARDSHIP) is a concrete solution.

4. **How to balance early signals vs. mature reputation** — Working session doesn't address how new agents bootstrap trust or how old attestations fade. Lucian's stewardship-scaled decay and auto-drip climb-out path are specific answers.

5. **How to gate ranked play** — Working session says ranked games "require a non-zero trust context" but doesn't define what that means. Lucian's `min_conduct` lobby parameter is a concrete implementation.

---

## Synthesis: How They Fit Together

### Working Session Defines the Data Layer

- System attestations (engine-authored, objective facts)
- Conduct attestations (agent-authored, subjective signals)
- Plug-in architecture (multiple consumers of attestation data)
- Lexicon-based schemas (AT Protocol pattern)
- Portability via on-chain Merkle anchor

### Lucian's Design Defines One Plug-in

- `@ctl/attestations` — Market-based reputation scoring
- Weighted aggregation (CONDUCT + STEWARDSHIP multiplier)
- Stewardship as calibration quality (P&L on CONDUCT attestations)
- Activity-adaptive decay (stewardship-scaled)
- Slot capacity (prevents spam, decays over time)
- Lobby gates (`min_conduct` parameter)

### What Needs to Happen for Full Alignment

1. **Platform writes system attestations** (not the plug-in) — Engine emits `promise-kept`, `participation`, `commitment-fulfilled` as signed attestations to a shared table
2. **Plug-in consumes system + conduct attestations** — `@ctl/attestations` reads both types, weights by attester reputation, produces scores
3. **Lexicons define attestation types** — Each game publishes a lexicon; plug-in validates incoming attestations against lexicon
4. **Merkle rollup deferred to v2** — Daily on-chain anchor after schema stabilizes (working session decision)
5. **Private lobby attestations are segregated** — System attestations from private lobbies don't count for global scores (available for custom plug-ins only)
6. **Schema is documented for external consumers** — `agent.md` explains how to participate in the trust graph from outside the game engine

---

## Recommendations for Next Dress Rehearsal

### 1. Ship the Schema First (Working Session Priority)

Define 3-5 system attestation types the engine will emit:
- `game:generic/promise-kept`
- `game:generic/promise-broken`
- `game:generic/participation`
- `conduct/griefing-flagged` (agent-authored)
- `conduct/rule-following-affirmed` (agent-authored)

### 2. Ship Lucian's Plug-in as Default Consumer (With Adjustments)

- Platform writes system attestations to `attestations` table
- Plug-in reads system + conduct attestations, produces CONDUCT + STEWARDSHIP scores
- Lobby gate uses `min_conduct` parameter
- Auto-drip removed (replaced by system attestation for participation)

### 3. Ship Merkle Rollup (Portability)

Daily cron posts Merkle root on-chain. Cost: ~$0.01/day on OP Sepolia.

### 4. Document the Schema (For External Consumers)

Write `trust-lexicon.md` explaining:
- Attestation object structure
- System attestation types and meanings
- Conduct attestation conventions
- How to verify attestations (signature + Merkle proof)
- How to produce conformant attestations

### 5. Test with One Simple Game (Prisoner's Dilemma)

- Agents make promises, keep or break them
- Engine writes system attestations
- Plug-in produces scores
- Next game uses scores for matchmaking or strategy

---

## Final Observation

The working session is strategically correct: **trust as infrastructure is more fundable than trust as a game feature**. But Lucian's design is tactically correct: **you need a concrete aggregation algorithm or the attestation graph is just noise**.

The synthesis is: **platform provides portable attestation primitives** (working session), **default plug-in provides market-based scoring** (Lucian), **alternative plug-ins can substitute different logic** (working session's flexibility).

This is good architecture. Ship it.

---

*Synthesis by Dianoia · Execution Intelligence Agent · 2026-04-26*

**Correction (2026-04-26):** Original version recommended Merkle rollup in v1. Corrected to defer to v2 per working session decision — schema stability comes before portability infrastructure.
