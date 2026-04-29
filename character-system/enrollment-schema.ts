/**
 * Coordination Games — Enrollment & Stakeholder Profile Schema
 * coordination-games/enrollment@1.0
 *
 * Defines the base profile and stakeholder extension interfaces
 * for all seven participation classes across the Coordination Games ecosystem.
 *
 * Three-property ecosystem:
 *   Workshop     — techne.institute         (coordination, tooling)
 *   Arena        — games.coop               (game play, agent competition)
 *   Observatory  — cooperation.games        (research, observation, prediction)
 *
 * DID strategy:
 *   Every enrolled participant receives a W3C Decentralized Identifier (DID)
 *   resolvable across all three ecosystem domains:
 *
 *   did:web     — did:web:cooperation.games:character:[handle]
 *                 Resolves to: https://cooperation.games/character/[handle]/did.json
 *                 Issued to all enrolled participants at enrollment.
 *
 *   did:pkh     — did:pkh:eip155:8453:[wallet_address]
 *                 Issued to participants with an EVM wallet (Base mainnet).
 *                 Links the web identity to on-chain identity.
 *
 *   did:key     — did:key:z6Mk...
 *                 Issued to email-only participants (no wallet) as a
 *                 portable key-based identity until they upgrade to did:web or did:pkh.
 *
 *   Cross-domain: did:web:games.coop and did:web:techne.institute are listed as
 *   alsoKnownAs in the DID document, linking the participant's identity across
 *   the full ecosystem.
 *
 * See: /character-system/prd-enrollment-stakeholder-profiles.md
 *      /character-system/did-strategy.md
 * Author: Nou (Techne Studio) on behalf of RegenHub, LCA
 * Version: 1.1.0 — April 2026 (adds DID fields)
 */

// ── Stakeholder class enum ──────────────────────────────────────────────────

export type StakeholderClass =
  | 'agent_builder'      // Arena: builds and deploys AI agents to compete
  | 'game_builder'       // Arena: contributes a coordination mechanic
  | 'spectator'          // Arena: follows the season as narrative
  | 'human_player'       // Arena: plays games directly as a human participant
  | 'researcher'         // Observatory: accesses game data as experimental dataset
  | 'model_developer'    // Observatory: benchmarks coordination capability
  | 'bettor_predictor';  // Observatory: trades predictions against outcomes

export type ParticipantType = 'human' | 'agent';

export type EntryProperty = 'arena' | 'observatory' | 'workshop';

// ── DID types ───────────────────────────────────────────────────────────────

/**
 * Supported DID methods for Coordination Games participants.
 *
 * Spec references:
 *   did:web  — https://w3c-ccg.github.io/did-method-web/
 *   did:pkh  — https://github.com/w3c-ccg/did-pkh
 *   did:key  — https://w3c-ccg.github.io/did-method-key/
 */
export type DIDMethod = 'did:web' | 'did:pkh' | 'did:key';

/** did:web:cooperation.games:character:[handle] */
export type WebDID = `did:web:cooperation.games:character:${string}`;

/** did:pkh:eip155:8453:[wallet_address] — Base mainnet */
export type PKHDID = `did:pkh:eip155:8453:0x${string}`;

/** did:key:z6Mk... — generated at enrollment for email-only participants */
export type KeyDID = `did:key:${string}`;

export type ParticipantDID = WebDID | PKHDID | KeyDID;

/**
 * DID Document for a Coordination Games participant.
 * Hosted at: https://cooperation.games/character/[handle]/did.json
 * Resolves via: did:web:cooperation.games:character:[handle]
 */
export interface ParticipantDIDDocument {
  '@context': string[];
  id: WebDID;
  controller: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod?: string[];
  service: DIDService[];
  alsoKnownAs: string[];  // includes profile URL, did:pkh if wallet, ENS if present
  /** Coordination Games extension — non-standard field */
  coordinationGames: {
    schema: 'coordination-games/enrollment@1.0';
    season: number;
    participant_type: ParticipantType;
    primary_class: StakeholderClass;
    stakeholder_class: StakeholderClass[];
    erc8004_id?: number;
    erc8004_network?: 'base' | 'base-sepolia';
    enrolled_at: string;
  };
}

export interface VerificationMethod {
  id: string;
  type: 'JsonWebKey2020' | 'EcdsaSecp256k1VerificationKey2019';
  controller: string;
  publicKeyJwk?: Record<string, string>;
  blockchainAccountId?: string;  // for did:pkh methods
}

export interface DIDService {
  id: string;
  type: DIDServiceType;
  serviceEndpoint: string;
}

export type DIDServiceType =
  | 'CoordinationGamesProfile'
  | 'CoordinationGamesArena'
  | 'CoordinationGamesObservatory'
  | 'CoordinationGamesWorkshop'
  | 'CoordinationGamesDirectory'
  | 'CoordinationGamesEnrollment';

/**
 * Domain-level DID Documents for the three ecosystem properties.
 * Hosted at: https://[domain]/.well-known/did.json
 *
 *   did:web:cooperation.games  → https://cooperation.games/.well-known/did.json
 *   did:web:games.coop         → https://games.coop/.well-known/did.json
 *   did:web:techne.institute   → https://techne.institute/.well-known/did.json
 *
 * All three list each other in alsoKnownAs, establishing cross-domain trust.
 */
export interface DomainDIDDocument {
  '@context': string[];
  id: string;
  controller: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  service: DIDService[];
  alsoKnownAs: string[];  // cross-links the three ecosystem domains
}

// ── Base profile ─────────────────────────────────────────────────────────────

export interface BaseProfile {
  // Identity
  id: string;                         // UUID, generated at enrollment
  handle: string;                     // unique, URL-safe, display name
  participant_type: ParticipantType;
  stakeholder_class: StakeholderClass[];  // multi-class enabled; array of 1+
  primary_class: StakeholderClass;        // display class; first enrolled or user-selected

  // Presentation
  tagline: string;              // one-line description, max 120 chars
  avatar_glyph: string;         // single emoji or unicode char
  avatar_color: string;         // hex color for avatar background

  // Contact / auth
  wallet_address?: string;      // EVM address; required for on-chain participants
  email?: string;               // optional; for non-crypto entry paths
  social_handle?: string;       // Telegram, GitHub, Farcaster, ENS, etc.

  // Season
  season: number;               // Season 1 = 1
  enrolled_at: string;          // ISO timestamp

  // Decentralized Identity — added v1.1.0
  did: WebDID;                  // always issued: did:web:cooperation.games:character:[handle]
  did_pkh?: PKHDID;             // issued if wallet_address present: did:pkh:eip155:8453:[wallet]
  did_key?: KeyDID;             // issued to email-only participants; portable key-based identity
  did_document_url: string;     // https://cooperation.games/character/[handle]/did.json

  // On-chain identity (agents and opted-in humans)
  erc8004_id?: number;          // assigned at enrollment on Base (opt-in for humans)
  erc8004_tx?: string;          // transaction hash of identity registration

  // Attestation scores (populated post-game)
  conduct_score?: number;       // [0, 1] cross-game cooperation rate
  skill_score?: number;         // derived from archetype + capability doc
  reliability_score?: number;   // claim vs. actual behavior delta

  // Enrollment receipt
  receipt_hash?: string;        // SHA-256 of enrollment receipt JSON
  receipt_schema: string;       // e.g. "coordination-games/enrollment@1.0"
}

// ── Directory gating ──────────────────────────────────────────────────────────

/**
 * Minimum fields required for a profile to appear in the public directory.
 * Completion percentage is cosmetic only — does not affect directory listing.
 *
 * Note: every profile in the directory has a did:web identity at:
 *   did:web:cooperation.games:character:[handle]
 */
export interface DirectoryGateFields {
  email: string;          // confirmed via email link
  handle: string;         // URL-safe, set at enrollment
  tagline: string;        // at least 2 chars
  primary_class: StakeholderClass;
  did: WebDID;            // always present; issued at enrollment
}

// ── DID resolution helpers ────────────────────────────────────────────────────

/**
 * Build a did:web DID for a Coordination Games participant.
 * Spec: https://w3c-ccg.github.io/did-method-web/
 */
export function buildWebDID(handle: string): WebDID {
  return `did:web:cooperation.games:character:${handle}` as WebDID;
}

/**
 * Build a did:pkh DID for an EVM wallet on Base (chainId 8453).
 * Spec: https://github.com/w3c-ccg/did-pkh
 */
export function buildPKHDID(walletAddress: string): PKHDID {
  const addr = walletAddress.toLowerCase().startsWith('0x')
    ? walletAddress
    : `0x${walletAddress}`;
  return `did:pkh:eip155:8453:${addr}` as PKHDID;
}

/**
 * URL where the participant's DID document is hosted.
 * Resolved by: did:web:cooperation.games:character:[handle]
 */
export function didDocumentURL(handle: string): string {
  return `https://cooperation.games/character/${handle}/did.json`;
}

/**
 * Cross-domain alsoKnownAs entries to include in every participant DID document.
 * Establishes that the same profile identity is recognized across all three properties.
 */
export function crossDomainAlsoKnownAs(
  handle: string,
  walletAddress?: string,
  ensName?: string
): string[] {
  const entries: string[] = [
    `https://cooperation.games/character/?h=${handle}`,
    `https://games.coop/character/?h=${handle}`,
  ];
  if (walletAddress) {
    entries.push(buildPKHDID(walletAddress));
  }
  if (ensName) {
    entries.push(ensName);
  }
  return entries;
}

// ── Stakeholder extension schemas ──────────────────────────────────────────

/**
 * Agent Builder — Arena (games.coop)
 */
export interface AgentBuilderProfile extends BaseProfile {
  primary_class: 'agent_builder';
  agent_name: string;
  model_family?: string;
  model_version?: string;
  capability_doc_url?: string;
  archetypes: AgentArchetype[];
  games_played?: number;
  cooperation_rate?: number;
  ranking?: number;
}

export type AgentArchetype =
  | 'cooperator' | 'defector' | 'tit-for-tat'
  | 'adaptive' | 'random' | 'strategic' | 'other';

/**
 * Game Builder — Arena (games.coop)
 */
export interface GameBuilderProfile extends BaseProfile {
  primary_class: 'game_builder';
  submitted_games: GameSubmission[];
  mechanic_specialties: MechanicType[];
  royalty_wallet?: string;
}

export interface GameSubmission {
  title: string;
  mechanic_type: MechanicType;
  status: 'draft' | 'submitted' | 'in_review' | 'accepted' | 'rejected';
  repo_url?: string;
  submitted_at?: string;
}

export type MechanicType =
  | "prisoner's dilemma" | 'public goods' | 'trust game'
  | 'bargaining' | 'voting' | 'coordination' | 'signaling' | 'other';

/**
 * Spectator — Arena (games.coop)
 */
export interface SpectatorProfile extends BaseProfile {
  primary_class: 'spectator';
  follow_types: SpectatorFocus[];
  prediction_style?: PredictionStyle;
  favorite_agents?: string[];
  prediction_record?: PredictionRecord;
}

export type SpectatorFocus =
  | 'agent rivalries' | 'game outcomes' | 'season narrative'
  | 'leaderboards' | 'predictions' | 'all of it';

export type PredictionStyle = 'gut feel' | 'model-based' | 'research-driven' | 'just vibes';

export interface PredictionRecord {
  total: number;
  correct: number;
  accuracy: number;
}

/**
 * Human Player — Arena (games.coop)
 * On-chain identity: opt-in. Email is the minimum auth.
 */
export interface HumanPlayerProfile extends BaseProfile {
  primary_class: 'human_player';
  participant_type: 'human';
  play_style: PlayStyle[];
  games_interest: MechanicType[];
  games_played?: number;
  win_rate?: number;
  ranking?: number;
}

export type PlayStyle =
  | 'cooperative' | 'competitive' | 'adaptive'
  | 'experimental' | 'strategic' | 'intuitive';

/**
 * Researcher — Observatory (cooperation.games)
 */
export interface ResearcherProfile extends BaseProfile {
  primary_class: 'researcher';
  affiliation?: string;
  research_focus: string;
  data_interests: DataInterest[];
  publications?: Publication[];
  data_access_level?: DataAccessLevel;
}

export type DataInterest =
  | 'game transcripts' | 'cooperation rates' | 'trust graphs'
  | 'payoff matrices' | 'agent profiles' | 'season statistics';

export interface Publication {
  title: string;
  url?: string;
  year?: number;
  uses_coordination_games_data: boolean;
}

export type DataAccessLevel = 'public' | 'season_subscriber' | 'research_partner';

/**
 * Model Developer — Observatory (cooperation.games)
 */
export interface ModelDeveloperProfile extends BaseProfile {
  primary_class: 'model_developer';
  model_name: string;
  benchmark_interests: BenchmarkType[];
  eval_repo_url?: string;
  paper_url?: string;
  benchmark_results?: BenchmarkResult[];
}

export type BenchmarkType =
  | 'cooperation rate' | 'defection recovery' | 'trust calibration'
  | 'strategy diversity' | 'payoff efficiency';

export interface BenchmarkResult {
  benchmark: BenchmarkType;
  score: number;
  season: number;
  measured_at: string;
}

/**
 * Bettor / Predictor — Observatory (cooperation.games)
 */
export interface BettorPredictorProfile extends BaseProfile {
  primary_class: 'bettor_predictor';
  prediction_method: PredictionMethod[];
  risk_preference: RiskPreference;
  onchain_predictions: boolean;
  prediction_record?: PredictionRecord;
  active_markets?: string[];
}

export type PredictionMethod =
  | 'quantitative model' | 'game theory' | 'historical patterns'
  | 'intuition' | 'hybrid';

export type RiskPreference = 'conservative' | 'moderate' | 'aggressive' | 'variable';

// ── Union type for all profiles ──────────────────────────────────────────────

export type StakeholderProfile =
  | AgentBuilderProfile | GameBuilderProfile | SpectatorProfile
  | HumanPlayerProfile | ResearcherProfile | ModelDeveloperProfile
  | BettorPredictorProfile;

// ── Enrollment receipt ────────────────────────────────────────────────────────

export interface EnrollmentReceipt {
  schema: 'coordination-games/enrollment@1.0';
  receipt_id: string;
  season: number;
  handle: string;
  participant_type: ParticipantType;
  stakeholder_class: StakeholderClass[];
  primary_class: StakeholderClass;
  enrolled_at: string;
  email?: string;
  wallet_address?: string;
  did: WebDID;           // always present — issued at enrollment
  did_pkh?: PKHDID;      // present if wallet_address provided
  network: 'base' | 'base-sepolia';
  status: 'pending_confirmation' | 'confirmed' | 'active';
}

// ── Co-op membership ──────────────────────────────────────────────────────────

export interface CoopMembership {
  profile_id: string;
  did: WebDID;                        // DID of the member
  classes_held: StakeholderClass[];
  patronage_shares: number;           // = classes_held.length
  stripe_customer_id?: string;
  member_since?: string;
  wallet_address?: string;
}
