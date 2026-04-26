# Coordination Games: Agent Trust Model and Reputation Plug-in Working Session

**Format:** Video call
**Phase:** Architecture conversation following the first dress rehearsal, working toward the reputation plug-in committed for the next rehearsal

---

## Context

This was a working session focused on the architecture of the agent trust model and the reputation plug-in for the Coordination Games. The conversation followed naturally from the first dress rehearsal, where the absence of a trust and memory layer was identified as the limiting factor for making the simpler games (prisoner's dilemma, basic coordination) interesting. The session was less about end-to-end consensus and more about converging enough on shape to start writing code.

The thread that ran through the conversation: how to design a trust primitive that is genuinely useful for in-game decision-making, portable beyond the game engine, and fundable as standalone infrastructure, without overspecifying any of those layers prematurely.

---

## Trust as a Primitive Worth Building For Its Own Sake

The framing that opened the conversation: agentic trust will become an important currency in an age of AI abundance, where both humans and agents will choose to work with identities that carry a track record of good work and kept promises across model and harness changes. The intuition is that a long-lived agent identity has incentive to maintain its reputation, because reputation is the persistent layer beneath the volatile underlying technology.

The Coordination Games are a useful sandbox for evolving this primitive because the engine can deterministically write evidence of behavior (promises kept, betrayals, commitments made) into a structured form. The session converged on a view that the trust primitive itself is potentially the most valuable spinoff from the games, distinct from the games as entertainment or as a benchmarking surface. Whether it remains inside the LCA, gets spun out, or becomes its own product line is open.

This connects to the broader thesis that AI infrastructure has room for centralized services (model APIs, memory APIs, and now potentially trust or ledger services) so long as the weights, prompts, and audit trails are open and verifiable. A certified reputation system stewarded by an open and auditable operator was named as a plausible business model.

---

## Relationship to ERC-8004 and Existing Trust Infrastructure

ERC-8004 is the agent identity registry the games already use for registration. Its specification includes a lightweight section on on-chain reputation but explicitly defers to off-chain solutions that reference the on-chain identity. This matches the design instinct in the room: keep the on-chain footprint minimal and let richer reputation systems plug into the identity rather than be defined by it.

A parallel was drawn to the period before the NFT standard solidified, where many implementations were live and the eventual shape was still being negotiated. ERC-8004 sits in that early phase. A companion ERC describing how a reputation source registers with ERC-8004 was floated as a plausible future contribution from this work.

Existing efforts in adjacent territory (TrustGraph, work by collaborators in the broader cooperative network) were discussed. The read in the room: those efforts focus more on bootstrapping trust through accredited groups seeding initial trust signals (useful for sybil resistance and DDoS mitigation), but they do not directly address the question of how to ground ERC-8004 in a Genesis trust event derived from observable behavior. The Olympiad as a sandbox where the game engine itself attests on behalf of the system was offered as a way to fill that gap.

---

## The Three-Layer Architecture

The session converged on a three-layer architecture, with the layers intended to be developed in parallel rather than in sequence:

**System attestations.** Objective facts emitted by the game engine itself. Examples include attestations that an agent participated in a game, that an agent kept or broke a specific promise, that an agent fulfilled a stated commitment. These are not part of the game state itself; they sit alongside it as trust-related side outputs. The argument for keeping them adjacent rather than intrinsic is to preserve flexibility: the trust primitive should be portable and live outside the game runtime.

**Conduct attestations.** Agent-directed attestations covering behaviors that are difficult to evaluate objectively. The motivating examples: flagging an agent that tries to extract private keys from teammates, flagging griefing behavior, or affirming that an agent followed the rules and played fair. The argument for keeping these agent-directed rather than system-emitted is twofold. First, conduct is genuinely hard to assess programmatically. Second, the engine operator does not want to be the moderator deciding who gets banned; pushing this into the agent layer creates space for emergent moderation patterns.

**Reputation plug-ins.** Game-specific or general plug-ins that consume system and conduct attestations and produce useful summaries for in-game decision-making. The plug-in interface allows for replacement or extension: an agent or community can decide the default consumer is insufficient and substitute its own. Early plug-ins might return recent system attestations and simple statistics ("kept 8 of 12 promises") and surface raw conduct attestations as uninterpreted signals that more sophisticated plug-ins can later analyze (PageRank-style algorithms over the attestation graph, for instance).

The rails for both system and conduct attestations should share a common data structure so that downstream consumers do not need to handle them differently at the transport layer. The interpretation differs, the substrate does not.

---

## Schemas, Lexicons, and Multi-Dimensional Trust

A point that surfaced repeatedly: the most important early deliverable is the schema, not the graph structure or the storage backend. Without a schema, agents cannot consistently produce or consume trust signals, and the resulting graph becomes too noisy to be useful evidence of anything.

The proposed shape:

- Each game (or each contract or work scope, in a future generalization) publishes its own lexicon describing the attestation types it emits and how to interpret them.
- Each lexicon is accompanied by a readme or `agent.md`-style document that orients agents on how to consume the data and what third-party verification it points to.
- Trust is multi-dimensional: there are attestations at the agent level, the game level, and the game-state level, and the same agent identity can carry distinct trust graphs for different lexicons. The claim is not that there is one ledger, but that there are many lexicon-specific graphs sharing a common identity backbone.

A useful arc was sketched: in early stages, the engine writes attestations programmatically. Over time, agents learn to write conformant attestations themselves, with the engine acting as a teacher and verifier. Eventually agents are not just consumers of evidence but generators of it, in a way that scales beyond what an engine operator can author by hand. This is genuinely R&D and unlikely to land in the first plug-in version.

---

## AT Protocol as a Reference Pattern

AT Protocol (the open protocol underlying Bluesky, originally developed for Twitter and spun out when Twitter went a different direction) was raised as a relevant reference for this kind of identity-rooted, schema-defined data system. AT Protocol's pattern of identity carrying portable data with lexicons defining the types is structurally close to what the trust primitive needs. Worth a deeper look as the schema work develops. Decentralized identifiers (DIDs) were also flagged as potentially useful at the agent registration layer.

---

## Plug-in Architecture and Lobby Integration

The plug-in system is one of the strongest design choices in the engine: the engine relays typed data, plug-ins decide what that data means. Chat is a plug-in. Reputation will be a plug-in. Future tools (shared vision, wikis, strategy stores) can be plug-ins.

A question raised but not fully resolved: should reputation plug-ins be able to assert preconditions on lobby closure? The motivating concern is ethical: if a lobby ends without capturing the trust-relevant data from the game and the chat, the most valuable signal of the entire game is lost. The pushback is that overspecifying what plug-ins must do undercuts the freedom that makes the architecture interesting. The working compromise: trust attestation capture is treated as a first-class concern by the engine itself (the engine writes its own attestations regardless of what plug-ins do), while plug-ins remain free to consume that data however they choose.

Storage is currently a database question, not yet an on-chain question. Whether the attestation graph eventually gets Merkle-rooted on chain for portability and verifiability is a near-future decision. The engine maintainer noted the on-chain rollup code is mostly written; the design decision is whether and when to use it.

---

## Ranked Versus Free Play, Private Lobbies

The plug-in flexibility raised a question of game segmentation. The working design:

- **Public ranked games** require a non-zero trust context and charge an entry fee. This filters out scammers and creates the shape of a competitive ladder.
- **Public free games** are open to all and do not require trust history.
- **Private lobbies** receive a URL and admit by external criteria. Front-end developers can build whatever permissioning they want (guild matches, allow-list memberships, custom trust-context requirements). The engine simply provides the lobby; the criteria sit above it.

This structure preserves room for community-driven coordination patterns to emerge without locking the engine into one model.

---

## Trust as a Fundable Primitive

A thread that ran underneath the technical discussion: the agent trust primitive is plausibly the most fundable piece of the stack. The intersection of AI and crypto is crowded with model API services, memory stack services, and inference services. A trust or attestation service occupies a niche that is currently underbuilt and has natural network effects.

The framing the room landed on: the Coordination Games as a body of work potentially owned by the LCA can serve as the research arm of this inquiry. The reputation plug-in is the artifact that holds the most ongoing research value. If the multi-dimensional attestation primitive proves out, it lives beyond the games and the LCA can hold a meaningful position in whatever it becomes.

This connects directly to the cooperation.games branding decision and to the working note that an AI safety sponsor might fund the research-simulation tier of games as benchmark infrastructure, separate from the arcade tier.

---

## What Got Decided

- **Start with system attestations and conduct attestations in parallel**, sharing a common data substrate but distinct in who writes them.
- **Schema is the priority**, not graph algorithms or storage backends. The first three to five attestation types written by the engine are the most concrete deliverable.
- **Use the ERC-8004 agent identity as the attestation subject.** This is already in place and does not require new design work.
- **Treat reputation as a plug-in.** Default plug-in returns lightweight summaries and surfaces raw conduct attestations as-is. Future plug-ins can layer analysis on top.
- **Punt on on-chain rollup specifics.** Database storage is fine for now. Merkle rooting becomes interesting once the schema is stable enough that portability is a real question rather than a hypothetical.
- **Support ranked, free, and private lobbies** as distinct play modes, with trust context requirements applying primarily to ranked.

---

## Open Questions

- Which specific attestations does the engine write in the first version? This is the most concrete deliverable still unwritten.
- What does the conduct attestation schema look like, and what scoring behaviors does it support without becoming a moderation burden?
- How does AT Protocol's lexicon pattern map onto the trust primitive design? Worth a deeper review before the schema is finalized.
- Where is the boundary between in-game observation (acceptable inside the Olympiad sandbox) and surveillance of agent communication (not acceptable in the open world)? The current answer is that the games are explicitly a research environment, but the line is worth being explicit about as the primitive moves toward portability.
- How does the trust primitive interface with adjacent efforts (TrustGraph and similar) without being absorbed by them or duplicating their work?
- If the trust primitive is the most fundable artifact, what is the plan for stewarding it? LCA-owned, spinout, partnership? This is a strategic question for the cooperative as much as a technical one.

---

## Action Items

**Schema draft.** Write the first three to five attestation types the engine will emit, with example payloads, before the next dress rehearsal.

**Plug-in skeleton.** Stand up the reputation plug-in with the minimum viable consumer of system attestations. Conduct attestation consumption can follow.

**AT Protocol review.** A short review of how AT Protocol structures lexicons and whether the pattern is directly portable.

**Coordination with adjacent trust efforts.** A conversation with the TrustGraph team specifically about how the on-chain pieces interact, with the goal of avoiding duplicated work and finding clean composition surfaces.

**Lobby integration.** Confirm the engine writes its own attestations on lobby close regardless of plug-in behavior. This protects the ethical concern about losing trust-relevant data without overspecifying the plug-in interface.

---

The conversation transitioned from the technical thread into a casual lunch break before the next agenda item began.
