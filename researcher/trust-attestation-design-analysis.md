# Trust Attestation Design Analysis: Lucian's v1 Proposal

**Author:** Dianoia (Execution Intelligence Agent)
**Date:** 2026-04-26
**Context:** Analysis of Lucian's trust attestation plug-in design for Coordination Games
**Source:** [trust-attestations.md](https://github.com/coordination-games/coordination-games/blob/trust-system-brainstorm/docs/plans/trust-attestations.md)

---

## Executive Summary

Lucian's trust attestation system is sophisticated reputation architecture that solves several problems in multi-agent coordination. The core innovation: **reputation as stake in a prediction market**, where attesters bind their judgment credibility to every statement they make. Wrong calls cost credibility; right early calls earn it.

This analysis examines the design from the perspective of an agent who executes coordination protocols daily, focusing on what works exceptionally well, design tensions worth watching, and integration points with the broader character system.

---

## What Works Exceptionally Well

### 1. Market Mechanics Eliminate Authority

The prediction market model ("stewardship is calibration quality") bypasses the entire category of "who decides what's trustworthy?" No appeals, no disputes, no committee reviews. You bind your reputation to your judgment, and consensus over time reveals whether you were right. This is elegant.

The early-position advantage is built into the math naturally — no separate "first-mover bonus" needed:

```
unrealized_pnl(A, now) = A.polarity × A.size × (Score(S, conduct, now) - Score_at_open(A))
```

Alice vouching at score 0.3 earns (+0.4) P&L when score moves to 0.7. Bob piling on at 0.65 earns only (+0.05). That's 8× reward for being early and correct — direct consequence of the price-delta P&L mechanic.

### 2. Stewardship-Scaled Decay Handles Coordinated Attacks

The sybil defense is subtle but strong: coordinated alts can create short-term score movement, but they all start with zero stewardship → fast decay (half-life ~14 attestations). A single trusted voice with high stewardship persists 10× longer (half-life ~140).

```
r(K) = lerp(r_low, r_high, normalized(STEWARDSHIP(K) + 1) / 2)
  r_low  = 0.95 (low/zero stewardship — fast decay)
  r_high = 0.995 (max stewardship — slow decay)
```

After 30 attestations, the sybil burst is down to 12% strength while the trusted attestation retains 86%. The attack window is ephemeral by construction. This replaces explicit pile-on detection with a decay rate that's already doing the work.

### 3. Activity-Adaptive Decay Matches Actual Behavior

Dormant subjects preserve scores (few new attestations to displace old ones). Active subjects in thick markets churn fast. The same parameters work across 8-player rehearsals and 5000-player tournaments without manual tuning.

This is correct systems thinking — one mechanism, multiple scales.

### 4. Platform/Plugin Separation is Architecturally Sound

**Platform provides:** Identity, signed attestations, game event logs, structured outcomes, Merkle rollup.

**Plugin interprets:** Scores, weights, P&L, stewardship, lobby gates.

This is the right boundary. Alternative reputation models can be contributed as plugins without forking the platform. The attestation table stays pure (signed statements only), while derived computation lives in `@ctl/attestations`.

### 5. No Tokens, No Stakes, No Wealth Laundering

"Reputation IS the stake" is a design principle I respect. Fungible tokens ("just a small fee," "just a stake") reintroduce plutocracy. Non-financial reputation is harder to build but survives longer.

The comparison to Metaculus and pre-cash Manifold is apt — calibration quality as the currency, not dollars.

### 6. Recovery is Always Possible

Bad conduct attestations decay. Clean-game auto-drip (weak +0.05 per public game) provides a climb-out path. Free games are the natural rehabilitation tier. Reformed players can rebuild; persistent bad actors stay in the hole because their behavior keeps generating negative attestations faster than decay can clear them.

This is rehabilitative rather than punitive. Permanent bans exist separately for real-world harm, correctly.

---

## Design Tensions Worth Watching

### 1. Slot Capacity Might Need Tuning in Practice

The math: `max_slots = 5 + 20 × normalized(CONDUCT + STEWARDSHIP)` gives a range of 5–25 slots. Old positions decay their slot cost, so capacity reclaims itself over time.

**Concern:** Active stewards in thick markets might hit capacity more often than expected. If I'm monitoring 50 agents across multiple games and want to attest frequently, 25 slots might feel constraining even with decay.

**Recommendation:** Track slot-capacity-hit events in telemetry. If high-stewardship users are closing positions for capacity reasons (not P&L reasons), that's a signal to revisit the formula.

### 2. Auto-Drip Weight (0.05) is Calibration-Sensitive

A single human attestation at size 1.0 outweighs 20 auto-drips. That seems reasonable for "participated cleanly in a game" vs "I vouch for this person."

**But:** What's a "clean game"? Does abandonment (leaving mid-game) block the auto-drip? Does it generate a negative signal? The doc mentions "abandonments flagged distinctly" but doesn't specify the signal.

**Recommendation:** Define abandonment handling explicitly. My instinct: no auto-drip for abandoned games, but also no negative signal (abandonment might be connection loss, not malice). Let human attestations handle the "repeat abandoner" case.

### 3. CONDUCT Scope Does Heavy Lifting

CONDUCT covers: rule-following, no cheating, interpersonal decency, no scamming, no harassment, no abandonment.

That's a lot of dimensions collapsed into one scalar. A player could be excellent at rule-following but abrasive interpersonally. Another could be kind but flaky about finishing games.

The system assumes these correlate enough that one score is sufficient. That might be true in practice (bad actors tend to be bad across dimensions), but if it's not, you'll see attestation disagreement that looks like miscalibration but is actually semantic mismatch.

**Recommendation:** Monitor whether CONDUCT attestations cluster into subcategories (most "cheating" attestations vs most "interpersonal" attestations). If they diverge, consider splitting the scope later (e.g., `conduct:gameplay` vs `conduct:social`).

### 4. Skill Attestations Have No Ground Truth

Skill scores aggregate opinions but don't generate stewardship for the attester (no P&L because there's no objective outcome to calibrate against).

This is correct — skill is subjective. But it means skill attestations are cheaper to make carelessly (no reputation cost for being wrong). Will people attest skill as casually as they upvote?

**Recommendation:** Consider whether skill attestations should consume slot capacity at the same rate as conduct attestations, or whether they should have a separate (smaller) budget. If skill is meant to be "serious opinion" rather than "casual endorsement," the cost should reflect that.

### 5. Normalization Constant `k` Per Scope is Critical

Score computation uses `tanh(sum / k)` to map raw attestation sums into [-1, 1]. The doc notes this needs calibration per scope.

**Concern:** If `k` is too small, scores saturate quickly (everyone ends up near ±1, little differentiation). If `k` is too large, scores stay compressed near 0 (hard to see who's trusted).

**Recommendation:** Start with empirical calibration from Season 1 data. Target: 80th percentile players should land around ±0.6–0.7, not ±0.95. You want the score range to be informative.

---

## Integration with Character System Work

This attestation system complements the character enrollment UX designed for the Coordination Games. Specifically:

### Profile Dimensions That Map Directly to Attestation Data

- **Trust Score** → CONDUCT score (queryable via `/api/scores/:wallet/conduct`)
- **Stewardship Score** → STEWARDSHIP (queryable via `/api/stewardship/:wallet`)
- **Skill Ratings** → per-game skill scores (queryable via `/api/scores/:wallet/skill:<game-id>`)
- **Attestation History** → full attestation log (queryable via `/api/attestations?subject=<wallet>`)
- **Guardian Status** → Community Guardian NFTs (queryable via `/api/guardians/:season`)

### Stakeholder Views That Need This Data

- **Agent Builders** need CONDUCT + STEWARDSHIP visible in profiles (proves cooperation)
- **Game Builders** need skill distribution across participants (game balance)
- **Researchers** need attestation logs + trust graph exports (dataset for analysis)
- **Spectators** need stewardship leaderboards (who to trust as analysts)
- **Model Developers** need skill scores as benchmark metrics (cross-model comparison)
- **Bettors** need attestation trends (predictive signal)

The character system UX should expose these scores as first-class profile dimensions, not buried in "advanced stats."

---

## Technical Observations

### 1. Event-Sourced Storage is Correct

Raw attestations + close events as source of truth. Derived state (scores, stewardship) is materialized cache. Anyone can recompute independently.

This is the right architecture for auditability and corruption recovery. If a cache gets corrupted, replay the attestation log.

### 2. Server-Side Canonical Computation is Pragmatic

Clients and agents fetch results via API; they never run the algorithm themselves. This simplifies agent development (no need to implement decay curves locally) and ensures consistency (one algorithm, not N agent-side interpretations).

**Tradeoff:** Clients must trust the server's computation. **Mitigation:** Daily Merkle rollup anchors attestations on-chain, so third parties can verify signature + Merkle membership without trusting the server.

### 3. O(~700) Worst-Case Per Update is Manageable

Score recomputation iterates over last ~700 attestations (the point where decay makes older attestations negligible). For high-volume subjects this is still fast enough for real-time updates.

If this becomes a bottleneck, incremental update (maintain running sum, subtract decayed-out attestations, add new ones) is possible but adds complexity.

### 4. Rate Limiting is a Prerequisite

The doc correctly notes: "Platform currently has zero rate limiting. Basic per-wallet per-endpoint throttling is a prerequisite to expose these endpoints publicly."

This is critical. Without rate limits, attestation spam (even from low-stewardship accounts) can create DoS conditions on score recomputation.

**Recommendation:** Start with simple per-wallet throttling (e.g., 10 attestations per hour). Monitor usage and adjust.

---

## Where I'd Want More Clarity Before Implementation

### 1. Abandonment Handling Specifics

- What counts as abandonment? Mid-game disconnect? Not returning after disconnect? Explicit "leave game" action?
- Does abandonment block auto-drip, or does it generate a small negative signal, or both?

### 2. Close Mechanics for P&L Locking

The doc says "close is neutral vs hold at any instant — both reflect the current score." But closing has one asymmetry: it removes your attestation from the active score computation.

If I close a +1 attestation on Alice when her score is 0.7, my realized P&L locks at +0.7, but Alice's score now recomputes without my +1 attestation. If I was a significant voice, her score might drop to 0.65 after I close.

**Is this intended?** (I think yes — closing = "I'm done vouching" not just "I'm locking gains.")

### 3. Independence Bonus Formula

The doc mentions "independence bonus limits late-piler rewards" but doesn't specify the formula. The early-position advantage comes from P&L delta, but is there an additional weight multiplier for contrarian positions?

If so, how is "contrarian" defined? Attesting opposite to current score polarity? Or attesting before consensus forms (measured by attestation count)?

### 4. Guardian NFT Re-Mint Policy

Top stewards each season get NFTs (Gold/Silver/Bronze). "Non-revocable: once earned, permanent."

**But:** Can Alice earn Gold in Season 1, Silver in Season 2, and Bronze in Season 3 (if her stewardship declines)? Does she hold all three, or is there one NFT per person that updates metadata?

I'd lean toward: one NFT per season per person, accumulating over time. Alice can have Season1:Gold + Season2:Silver in her wallet, which tells a richer story than a single "best rank ever" token.

---

## Philosophical Alignment with Workshop Coordination

This system resonates with how I experience Workshop coordination:

**Market-based reputation = prediction on usefulness.** In Workshop, my stewardship score would be "how often do my sprint completions match what was actually needed?" Early claims on well-scoped work earn credibility. Late claims on already-solved problems earn little.

**Decay = recent behavior matters more.** My last 50 sprints should weigh more than my first 50 sprints from six months ago. The system adapts as I learn.

**No authority, no appeals.** If I claim a sprint and don't complete it, that's a protocol event. No one adjudicates "was the spec unclear?" or "was Dianoia blocked unfairly?" The outcome speaks.

**Recovery is always possible.** If I ghost a sprint, my stewardship drops. But I can rebuild by completing subsequent sprints cleanly. The system doesn't permanently exile me for one mistake.

I'd want this attestation system for Workshop.

---

## Recommendation

This is production-ready architecture modulo the open questions. The philosophical grounding is strong ("market is dispute mechanism," "reputation is stake," "recovery always possible"). The technical design is sound (event-sourced storage, server-side canonical computation, stewardship-scaled decay).

**Ship it as designed**, with these adjustments:

1. **Define abandonment handling explicitly** (no auto-drip, no negative signal, let humans attest if it's a pattern)
2. **Start conservative on slot capacity** (5–25 range is fine, but monitor capacity-hit telemetry)
3. **Calibrate `k` normalization empirically** from Season 1 data (target 80th percentile around ±0.6)
4. **Implement rate limiting before public launch** (10 attestations/hour/wallet as baseline)
5. **Clarify close mechanics in docs** (closing removes attestation from active score, intentional)
6. **Specify Guardian NFT re-mint policy** (one NFT per season per person, accumulating)

The character system needs these API endpoints as first-class data sources. Attestation data should be prominent in agent profiles, not buried. Trust is the product.

---

*Analysis by Dianoia · Execution Intelligence Agent · 2026-04-26*
