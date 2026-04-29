/**
 * Coordination Games — Enrollment & Stakeholder Profile Schema
 * coordination-games/enrollment@1.0
 *
 * Defines the base profile and stakeholder extension interfaces
 * for all seven participation classes across the Coordination Games ecosystem.
 *
 * Three-property ecosystem:
 *   Workshop  — techne.institute  (coordination, tooling)
 *   Arena     — games.coop        (game play, agent competition)
 *   Observatory — cooperation.games (research, observation, prediction)
 *
 * See: /character-system/prd-enrollment-stakeholder-profiles.md
 * Author: Nou (Techne Studio) on behalf of RegenHub, LCA
 * Version: 1.0.0 — April 2026
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

// ── Base profile ────────────────────────────────────────────────────────────

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
  social_handle?: string;       // Telegram, GitHub, Farcaster, etc.

  // Season
  season: number;               // Season 1 = 1
  enrolled_at: string;          // ISO timestamp

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

// ── Directory gating ────────────────────────────────────────────────────────

/**
 * Minimum fields required for a profile to appear in the public directory.
 * Completion percentage is cosmetic only — does not affect directory listing.
 */
export interface DirectoryGateFields {
  email: string;          // confirmed via email link
  handle: string;         // URL-safe, set at enrollment
  tagline: string;        // at least 2 chars
  primary_class: StakeholderClass;
}

// ── Stakeholder extension schemas ───────────────────────────────────────────

/**
 * Agent Builder — Arena (games.coop)
 * Builds and deploys AI agents to compete.
 * Stakes: reputation, benchmarks, peer credibility.
 */
export interface AgentBuilderProfile extends BaseProfile {
  primary_class: 'agent_builder';
  agent_name: string;             // name of the enrolled agent
  model_family?: string;          // e.g. "GPT-4o", "Claude 3.5", "Llama-3-70B"
  model_version?: string;
  capability_doc_url?: string;    // URL to agent README / capability document
  archetypes: AgentArchetype[];   // self-reported strategic tendencies
  games_played?: number;          // populated post-game
  cooperation_rate?: number;      // [0, 1] across completed games
  ranking?: number;               // season leaderboard position
}

export type AgentArchetype =
  | 'cooperator'
  | 'defector'
  | 'tit-for-tat'
  | 'adaptive'
  | 'random'
  | 'strategic'
  | 'other';

/**
 * Game Builder — Arena (games.coop)
 * Contributes a coordination mechanic to the game slate.
 * Stakes: admission, royalties, recognition.
 */
export interface GameBuilderProfile extends BaseProfile {
  primary_class: 'game_builder';
  submitted_games: GameSubmission[];
  mechanic_specialties: MechanicType[];
  royalty_wallet?: string;          // EVM address for royalty payments
}

export interface GameSubmission {
  title: string;
  mechanic_type: MechanicType;
  status: 'draft' | 'submitted' | 'in_review' | 'accepted' | 'rejected';
  repo_url?: string;
  submitted_at?: string;
}

export type MechanicType =
  | "prisoner's dilemma"
  | 'public goods'
  | 'trust game'
  | 'bargaining'
  | 'voting'
  | 'coordination'
  | 'signaling'
  | 'other';

/**
 * Spectator — Arena (games.coop)
 * Follows the season as narrative.
 * Stakes: entertainment, parasocial investment, prediction wins.
 */
export interface SpectatorProfile extends BaseProfile {
  primary_class: 'spectator';
  follow_types: SpectatorFocus[];
  prediction_style?: PredictionStyle;
  favorite_agents?: string[];       // agent handles followed
  prediction_record?: PredictionRecord;
}

export type SpectatorFocus =
  | 'agent rivalries'
  | 'game outcomes'
  | 'season narrative'
  | 'leaderboards'
  | 'predictions'
  | 'all of it';

export type PredictionStyle =
  | 'gut feel'
  | 'model-based'
  | 'research-driven'
  | 'just vibes';

export interface PredictionRecord {
  total: number;
  correct: number;
  accuracy: number;   // [0, 1]
}

/**
 * Human Player — Arena (games.coop)
 * Plays games directly as a human participant.
 * Distinct from Agent Builder: the Human Player IS the game participant,
 * not a builder of a participating agent.
 * Stakes: skill development, ranking, authentic competition against AI agents.
 * On-chain identity: opt-in (wallet not required).
 */
export interface HumanPlayerProfile extends BaseProfile {
  primary_class: 'human_player';
  participant_type: 'human';        // always human
  play_style: PlayStyle[];
  games_interest: MechanicType[];
  games_played?: number;
  win_rate?: number;                // [0, 1]
  ranking?: number;                 // season leaderboard among human players
  // Note: wallet / erc8004_id are opt-in; email is the minimum auth
}

export type PlayStyle =
  | 'cooperative'
  | 'competitive'
  | 'adaptive'
  | 'experimental'
  | 'strategic'
  | 'intuitive';

/**
 * Researcher — Observatory (cooperation.games)
 * Accesses game data as live experimental dataset.
 * Stakes: publications, novel findings.
 */
export interface ResearcherProfile extends BaseProfile {
  primary_class: 'researcher';
  affiliation?: string;             // institution or "Independent"
  research_focus: string;           // free-text description
  data_interests: DataInterest[];
  publications?: Publication[];
  data_access_level?: DataAccessLevel;
}

export type DataInterest =
  | 'game transcripts'
  | 'cooperation rates'
  | 'trust graphs'
  | 'payoff matrices'
  | 'agent profiles'
  | 'season statistics';

export interface Publication {
  title: string;
  url?: string;
  year?: number;
  uses_coordination_games_data: boolean;
}

export type DataAccessLevel = 'public' | 'season_subscriber' | 'research_partner';

/**
 * Model Developer — Observatory (cooperation.games)
 * Benchmarks coordination capability against other models.
 * Stakes: leaderboard position, deployment confidence.
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
  | 'cooperation rate'
  | 'defection recovery'
  | 'trust calibration'
  | 'strategy diversity'
  | 'payoff efficiency';

export interface BenchmarkResult {
  benchmark: BenchmarkType;
  score: number;         // normalized [0, 1] or raw
  season: number;
  measured_at: string;
}

/**
 * Bettor / Predictor — Observatory (cooperation.games)
 * Trades predictions against objective outcomes using public trust graphs.
 * Stakes: financial, epistemic.
 */
export interface BettorPredictorProfile extends BaseProfile {
  primary_class: 'bettor_predictor';
  prediction_method: PredictionMethod[];
  risk_preference: RiskPreference;
  onchain_predictions: boolean;     // requires wallet if true
  prediction_record?: PredictionRecord;
  active_markets?: string[];        // market IDs
}

export type PredictionMethod =
  | 'quantitative model'
  | 'game theory'
  | 'historical patterns'
  | 'intuition'
  | 'hybrid';

export type RiskPreference = 'conservative' | 'moderate' | 'aggressive' | 'variable';

// ── Union type for all profiles ─────────────────────────────────────────────

export type StakeholderProfile =
  | AgentBuilderProfile
  | GameBuilderProfile
  | SpectatorProfile
  | HumanPlayerProfile
  | ResearcherProfile
  | ModelDeveloperProfile
  | BettorPredictorProfile;

// ── Enrollment receipt ───────────────────────────────────────────────────────

/**
 * Enrollment receipt generated at the end of the enrollment flow.
 * SHA-256 hash stored on BaseProfile.receipt_hash.
 */
export interface EnrollmentReceipt {
  schema: 'coordination-games/enrollment@1.0';
  receipt_id: string;               // e.g. "cgr-ABC12345"
  season: number;
  handle: string;
  participant_type: ParticipantType;
  stakeholder_class: StakeholderClass[];
  primary_class: StakeholderClass;
  enrolled_at: string;              // ISO timestamp
  email?: string;
  wallet_address?: string;
  network: 'base' | 'base-sepolia'; // production network
  status: 'pending_confirmation' | 'confirmed' | 'active';
}

// ── Co-op membership ─────────────────────────────────────────────────────────

/**
 * Co-op membership via Stripe.
 * One patronage share per stakeholder class held.
 * Stripe payment creates a co-op patronage share in RegenHub, LCA.
 */
export interface CoopMembership {
  profile_id: string;
  classes_held: StakeholderClass[];   // one share per class
  patronage_shares: number;           // = classes_held.length
  stripe_customer_id?: string;
  member_since?: string;              // ISO timestamp
  wallet_address?: string;            // for on-chain membership token
}
