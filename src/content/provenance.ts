import type {
  VerifiedText,
  VerifiedUrl,
  VerifiedValue,
} from '../domain/verified.ts';

// User requested resume-based portfolio content on 2026-10-31. Facts below
// are limited to the supplied resumes and explicit statements in this chat.
// This records owner-supplied provenance, not independent credential verification.
export function sourcedText(value: string, sourceNote: string): VerifiedValue<VerifiedText> {
  return Object.freeze({ value: value as VerifiedText,
    verification: Object.freeze({ approvedByOwner: true, sourceNote }) });
}

export function sourcedUrl(value: string, sourceNote: string): VerifiedValue<VerifiedUrl> {
  return Object.freeze({ value: value as VerifiedUrl,
    verification: Object.freeze({ approvedByOwner: true, sourceNote }) });
}
export const resumeSource = 'Owner-authorized resume-based update, 2026-10-31: AWS Summer 2027 resume and Upwardly Corrected Resume; teaching duration reconfirmed by owner in chat. Certifications and disputed internship details omitted.';
export const projectSource = 'Owner confirmed these projects in chat and authorized portfolio improvement, 2026-10-31. Descriptions limited to supplied AWS resume, RojBer local README, and existing Rêya Sine starter files. Deployment and traction not asserted.';
