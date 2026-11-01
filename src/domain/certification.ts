import type {
  VerifiedText,
  VerifiedUrl,
  VerifiedValue,
} from './verified.ts';

export const pendingCertificationVerificationLabel =
  'Issuer verification link pending' as const;

export type CertificationKind =
  | 'professional-certification'
  | 'course-completion'
  | 'assessment-completion';

export type CertificationStatus =
  | 'resume-reported'
  | 'earned-validity-unverified'
  | 'expired'
  | 'completed';

export interface VerifiedCertificationLink {
  readonly kind: 'verified';
  readonly label: VerifiedValue<VerifiedText>;
  readonly url: VerifiedValue<VerifiedUrl>;
}

export interface PendingCertificationLink {
  readonly kind: 'pending';
  readonly label: typeof pendingCertificationVerificationLabel;
  readonly url?: never;
  readonly href?: never;
}

export type CertificationVerification =
  | VerifiedCertificationLink
  | PendingCertificationLink;

/**
 * A public credential summary. Private credential identifiers are deliberately
 * absent from this contract, and every factual display value carries provenance.
 */
export interface CertificationRecord {
  readonly id: string;
  readonly name: VerifiedValue<VerifiedText>;
  readonly issuer: VerifiedValue<VerifiedText>;
  readonly kind: CertificationKind;
  readonly kindLabel: VerifiedValue<VerifiedText>;
  readonly status: CertificationStatus;
  readonly statusLabel: VerifiedValue<VerifiedText>;
  readonly dateLabel: VerifiedValue<VerifiedText>;
  readonly detail?: VerifiedValue<VerifiedText>;
  readonly verification: CertificationVerification;
}
