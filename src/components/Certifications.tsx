import { certificationRecords } from '../content/certifications.ts';
import type { CertificationRecord } from '../domain/certification.ts';

interface CertificationsProps {
  readonly records?: readonly CertificationRecord[];
}

function CertificationCard({ record }: { readonly record: CertificationRecord }) {
  return (
    <article className="certification-card" data-status={record.status}>
      <div className="certification-card__topline">
        <span className="certification-card__kind">{record.kindLabel.value}</span>
        <span className="certification-card__status">
          {record.statusLabel.value}
        </span>
      </div>
      <h4>{record.name.value}</h4>
      <p className="certification-card__issuer">{record.issuer.value}</p>
      <p className="certification-card__date">{record.dateLabel.value}</p>
      {record.detail === undefined ? null : (
        <p className="certification-card__detail">{record.detail.value}</p>
      )}
      <div className="certification-card__verification">
        {record.verification.kind === 'verified' ? (
          <a href={record.verification.url.value}>
            {record.verification.label.value}
            <span aria-hidden="true"> ↗</span>
          </a>
        ) : (
          <span className="certification-card__pending">
            {record.verification.label}
          </span>
        )}
      </div>
    </article>
  );
}

export function Certifications({ records = certificationRecords }: CertificationsProps) {
  return (
    <section className="certifications" aria-labelledby="certifications-title">
      <div className="certifications__heading">
        <p className="section-kicker">Credentials &amp; continued learning</p>
        <h3 id="certifications-title">Certifications</h3>
        <p>
          Status comes from issuer documents where available. Resume-only
          entries and credentials without current issuer evidence are labeled
          verification pending. Course completions are identified separately
          from professional certifications.
        </p>
      </div>
      <ul className="certification-grid">
        {records.map((record) => (
          <li key={record.id}>
            <CertificationCard record={record} />
          </li>
        ))}
      </ul>
    </section>
  );
}
