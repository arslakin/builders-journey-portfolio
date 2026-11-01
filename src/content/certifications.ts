import type {
  CertificationRecord,
  PendingCertificationLink,
  VerifiedCertificationLink,
} from '../domain/certification.ts';
import { pendingCertificationVerificationLabel } from '../domain/certification.ts';
import { sourcedText, sourcedUrl } from './provenance.ts';

const resumeEvidence =
  'Owner-authorized resumes inspected locally on 2026-10-31. Credential is resume-reported and issuer verification remains pending.';
const ckaIssuerEvidence =
  'Owner-supplied Linux Foundation and CKA badge documents inspected locally on 2026-10-31. Issuer document date and badge expiration take precedence over the conflicting resume date.';
const terraformIssuerEvidence =
  'Owner-supplied HashiCorp Terraform Associate certificate inspected locally on 2026-10-31. The document states the earned date but does not establish current validity.';
const udacityIssuerEvidence =
  'Owner-supplied Udacity certificate inspected locally on 2026-10-31. This is course completion evidence, not an AWS professional certification.';
const awsAssessmentEvidence =
  'Owner-supplied AWS Certification certificate of completion inspected locally on 2026-10-31. It documents assessment completion, not an AWS professional certification.';
const ibtIssuerEvidence =
  'Owner-supplied IBT certificate inspected locally on 2026-10-31. The document states the credential and date but no current validity period.';

const pendingVerification = Object.freeze({
  kind: 'pending',
  label: pendingCertificationVerificationLabel,
}) satisfies PendingCertificationLink;

function verifiedLink(
  label: string,
  url: string,
  sourceNote: string,
): VerifiedCertificationLink {
  return Object.freeze({
    kind: 'verified',
    label: sourcedText(label, sourceNote),
    url: sourcedUrl(url, sourceNote),
  });
}

/**
 * Public credential summaries only. Raw certificates, private credential IDs,
 * personal contact details, and unsupported verification URLs stay outside the app.
 */
export const certificationRecords = Object.freeze([
  {
    id: 'aws-solutions-architect-associate',
    name: sourcedText('AWS Certified Solutions Architect – Associate', resumeEvidence),
    issuer: sourcedText('Amazon Web Services', resumeEvidence),
    kind: 'professional-certification',
    kindLabel: sourcedText('Professional certification', resumeEvidence),
    status: 'resume-reported',
    statusLabel: sourcedText('Resume-reported · issuer verification pending', resumeEvidence),
    dateLabel: sourcedText('Resume reports June 2025–June 2028', resumeEvidence),
    detail: sourcedText(
      'The reported validity window has not been independently confirmed with the issuer.',
      resumeEvidence,
    ),
    verification: pendingVerification,
  },
  {
    id: 'aws-cloud-practitioner',
    name: sourcedText('AWS Certified Cloud Practitioner', resumeEvidence),
    issuer: sourcedText('Amazon Web Services', resumeEvidence),
    kind: 'professional-certification',
    kindLabel: sourcedText('Professional certification', resumeEvidence),
    status: 'earned-validity-unverified',
    statusLabel: sourcedText('Earned · current validity not verified', resumeEvidence),
    dateLabel: sourcedText('Resume reports earned April 2023', resumeEvidence),
    verification: pendingVerification,
  },
  {
    id: 'cka',
    name: sourcedText('Certified Kubernetes Administrator (CKA)', ckaIssuerEvidence),
    issuer: sourcedText(
      'The Linux Foundation / Cloud Native Computing Foundation',
      ckaIssuerEvidence,
    ),
    kind: 'professional-certification',
    kindLabel: sourcedText('Professional certification', ckaIssuerEvidence),
    status: 'expired',
    statusLabel: sourcedText('Expired', ckaIssuerEvidence),
    dateLabel: sourcedText(
      'Issued December 3, 2022 · expired December 3, 2025',
      ckaIssuerEvidence,
    ),
    verification: verifiedLink(
      'Verify CKA status with Credly',
      'https://www.credly.com/go/Wr5GF1fB',
      ckaIssuerEvidence,
    ),
  },
  {
    id: 'terraform-associate-002',
    name: sourcedText('HashiCorp Certified: Terraform Associate (002)', terraformIssuerEvidence),
    issuer: sourcedText('HashiCorp', terraformIssuerEvidence),
    kind: 'professional-certification',
    kindLabel: sourcedText('Professional certification', terraformIssuerEvidence),
    status: 'earned-validity-unverified',
    statusLabel: sourcedText(
      'Earned · current validity not verified',
      terraformIssuerEvidence,
    ),
    dateLabel: sourcedText('Earned January 25, 2023', terraformIssuerEvidence),
    verification: pendingVerification,
  },
  {
    id: 'azure-fundamentals',
    name: sourcedText('Microsoft Certified: Azure Fundamentals', resumeEvidence),
    issuer: sourcedText('Microsoft', resumeEvidence),
    kind: 'professional-certification',
    kindLabel: sourcedText('Professional certification', resumeEvidence),
    status: 'resume-reported',
    statusLabel: sourcedText('Resume-reported · issuer verification pending', resumeEvidence),
    dateLabel: sourcedText('Resume reports January 2024', resumeEvidence),
    verification: pendingVerification,
  },
  {
    id: 'lfca',
    name: sourcedText('Linux Foundation Certified IT Associate (LFCA)', resumeEvidence),
    issuer: sourcedText('The Linux Foundation', resumeEvidence),
    kind: 'professional-certification',
    kindLabel: sourcedText('Professional certification', resumeEvidence),
    status: 'resume-reported',
    statusLabel: sourcedText('Resume-reported · issuer verification pending', resumeEvidence),
    dateLabel: sourcedText('Resume reports September 2024', resumeEvidence),
    verification: pendingVerification,
  },
  {
    id: 'lfs200',
    name: sourcedText(
      'LFS200: Fundamentals of Open Source IT and Cloud Computing',
      resumeEvidence,
    ),
    issuer: sourcedText('The Linux Foundation', resumeEvidence),
    kind: 'course-completion',
    kindLabel: sourcedText('Course completion', resumeEvidence),
    status: 'resume-reported',
    statusLabel: sourcedText('Resume-reported · issuer verification pending', resumeEvidence),
    dateLabel: sourcedText('Resume reports September 2024', resumeEvidence),
    verification: pendingVerification,
  },
  {
    id: 'udacity-aws-ai-practitioner-challenge',
    name: sourcedText('AWS AI Practitioner Challenge', udacityIssuerEvidence),
    issuer: sourcedText('Udacity', udacityIssuerEvidence),
    kind: 'course-completion',
    kindLabel: sourcedText('Course completion', udacityIssuerEvidence),
    status: 'completed',
    statusLabel: sourcedText('Completed', udacityIssuerEvidence),
    dateLabel: sourcedText('Completed June 23, 2026', udacityIssuerEvidence),
    detail: sourcedText(
      'Udacity course completion; this is not the AWS Certified AI Practitioner certification.',
      udacityIssuerEvidence,
    ),
    verification: verifiedLink(
      'Verify course completion with Udacity',
      'https://www.udacity.com/certificate/e/cb982b6e-3278-11f1-8e93-c320b758d7f5',
      udacityIssuerEvidence,
    ),
  },
  {
    id: 'aws-solutions-architect-knowledge-badge-assessment',
    name: sourcedText('Solutions Architect Knowledge Badge Assessment', awsAssessmentEvidence),
    issuer: sourcedText('AWS Certification', awsAssessmentEvidence),
    kind: 'assessment-completion',
    kindLabel: sourcedText('Assessment completion', awsAssessmentEvidence),
    status: 'completed',
    statusLabel: sourcedText('Completed', awsAssessmentEvidence),
    dateLabel: sourcedText('Certificate of completion dated May 3, 2023', awsAssessmentEvidence),
    detail: sourcedText(
      'This documents assessment completion and is not presented as an AWS professional certification.',
      awsAssessmentEvidence,
    ),
    verification: pendingVerification,
  },
  {
    id: 'ibt-devops-engineer-advanced',
    name: sourcedText('IBT Certified DevOps Engineer – Advanced', ibtIssuerEvidence),
    issuer: sourcedText('IBT', ibtIssuerEvidence),
    kind: 'professional-certification',
    kindLabel: sourcedText('Professional certification', ibtIssuerEvidence),
    status: 'earned-validity-unverified',
    statusLabel: sourcedText(
      'Earned · current validity not stated',
      ibtIssuerEvidence,
    ),
    dateLabel: sourcedText('Certificate dated December 13, 2023', ibtIssuerEvidence),
    verification: pendingVerification,
  },
] as const) satisfies readonly CertificationRecord[];
