import { describe, expect, expectTypeOf, it } from 'vitest';

import type { CertificationRecord } from '../domain/certification.ts';
import { certificationRecords } from './certifications.ts';

function recordById(id: string): CertificationRecord {
  const record = certificationRecords.find((candidate) => candidate.id === id);
  if (record === undefined) {
    throw new Error(`Missing certification fixture: ${id}`);
  }
  return record;
}

describe('centralized certification evidence', () => {
  it('keeps one typed collection with unique public records and no private IDs', () => {
    expect(certificationRecords).toHaveLength(10);
    expect(new Set(certificationRecords.map(({ id }) => id)).size).toBe(10);
    expectTypeOf(certificationRecords).toExtend<readonly CertificationRecord[]>();

    const serialized = JSON.stringify(certificationRecords);
    expect(serialized).not.toContain('Certificate ID No.');
    expect(serialized).not.toMatch(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    );
    expect(serialized).not.toContain('.pdf');
  });

  it('uses issuer evidence for the expired CKA record and exact supported link', () => {
    const record = recordById('cka');

    expect(record.status).toBe('expired');
    expect(record.statusLabel.value).toBe('Expired');
    expect(record.dateLabel.value).toBe(
      'Issued December 3, 2022 · expired December 3, 2025',
    );
    expect(record.verification.kind).toBe('verified');
    if (record.verification.kind !== 'verified') {
      throw new Error('Expected the owner-supplied CKA verification link.');
    }
    expect(record.verification.url.value).toBe(
      'https://www.credly.com/go/Wr5GF1fB',
    );
  });

  it('distinguishes issuer-earned, resume-reported, and pending validity states', () => {
    const terraform = recordById('terraform-associate-002');
    expect(terraform.dateLabel.value).toBe('Earned January 25, 2023');
    expect(terraform.statusLabel.value).toBe(
      'Earned · current validity not verified',
    );
    expect(terraform.verification.kind).toBe('pending');

    const solutionsArchitect = recordById('aws-solutions-architect-associate');
    expect(solutionsArchitect.status).toBe('resume-reported');
    expect(solutionsArchitect.dateLabel.value).toBe(
      'Resume reports June 2025–June 2028',
    );
    expect(solutionsArchitect.verification.kind).toBe('pending');

    const cloudPractitioner = recordById('aws-cloud-practitioner');
    expect(cloudPractitioner.dateLabel.value).toBe(
      'Resume reports earned April 2023',
    );
    expect(cloudPractitioner.status).toBe('earned-validity-unverified');
  });

  it('labels Udacity as course completion rather than an AWS certification', () => {
    const record = recordById('udacity-aws-ai-practitioner-challenge');

    expect(record.kind).toBe('course-completion');
    expect(record.dateLabel.value).toBe('Completed June 23, 2026');
    expect(record.detail?.value).toContain(
      'not the AWS Certified AI Practitioner certification',
    );
    expect(record.verification.kind).toBe('verified');
    if (record.verification.kind !== 'verified') {
      throw new Error('Expected the owner-supplied Udacity verification link.');
    }
    expect(record.verification.url.value).toBe(
      'https://www.udacity.com/certificate/e/cb982b6e-3278-11f1-8e93-c320b758d7f5',
    );
  });

  it('publishes only the two supplied issuer verification destinations', () => {
    const links = certificationRecords.flatMap((record) =>
      record.verification.kind === 'verified'
        ? [record.verification.url.value]
        : [],
    );

    expect(links).toEqual([
      'https://www.credly.com/go/Wr5GF1fB',
      'https://www.udacity.com/certificate/e/cb982b6e-3278-11f1-8e93-c320b758d7f5',
    ]);
  });
});
