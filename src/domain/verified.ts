/**
 * Text that crossed the owner-approval boundary.
 *
 * The brand is type-only. Content modules may apply it only after the review
 * process described by the portfolio specification; this module deliberately
 * exposes no function that upgrades an arbitrary string to verified content.
 */
export type VerifiedText = string & {
  readonly __verifiedText: unique symbol;
};

/** A destination URL confirmed by an owner-approved source. */
export type VerifiedUrl = string & {
  readonly __verifiedUrl: unique symbol;
};

/** Maintenance-only provenance attached to every renderable factual value. */
export interface VerificationNote {
  readonly approvedByOwner: true;
  readonly sourceNote: string;
}

/** A value paired with the owner-approval metadata required at validation. */
export interface VerifiedValue<T> {
  readonly value: T;
  readonly verification: VerificationNote;
}
