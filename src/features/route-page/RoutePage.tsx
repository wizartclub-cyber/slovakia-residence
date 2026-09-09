import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../app/usePageTitle';
import {
  authorityById,
  documentById,
  fees,
  notesForProcedure,
  procedureById,
  sourceById,
  thresholds,
} from '../../lib/content';
import { publicStatus } from '../../lib/content/schema';
import type { Document, FeeRule, Source } from '../../lib/content/schema';
import { derivedAmount } from '../../lib/content/thresholds';
import './route-page.css';

export function RoutePage() {
  const { lang, id } = useParams();
  const { t } = useTranslation();
  const procedure = id ? procedureById(id) : undefined;
  const pageTitle = procedure
    ? (lang === 'sk' ? procedure.title.sk : procedure.title.uk)
    : t('route.notFound');
  usePageTitle(pageTitle);

  if (!procedure) {
    return (
      <>
        <h1>{t('route.notFound')}</h1>
        <p>
          <Link to={`/${lang}/finder`}>{t('route.backToFinder')}</Link>
        </p>
      </>
    );
  }

  const status = publicStatus(procedure.reviewStatus);
  const title = lang === 'sk' ? procedure.title.sk : procedure.title.uk;
  const routeFees = fees.filter((f) => procedure.feeRuleIds.includes(f.id));
  const docs = procedure.documentIds.map((did) => documentById(did)).filter(isDocument);
  const attachments = docs.filter((d) => !d.afterDecision);
  const afterDecisionDocs = docs.filter((d) => d.afterDecision);
  const steps = [...procedure.steps].sort((a, b) => a.order - b.order);
  const notes = notesForProcedure(procedure.id);
  const stepsBefore = steps.filter((s) => !s.afterDecision);
  const stepsAfter = steps.filter((s) => s.afterDecision);
  const forms = procedure.formSourceIds.map((sid) => sourceById(sid)).filter(isSource);
  const allSources = [...new Set([...procedure.sourceIds, ...procedure.formSourceIds])]
    .map((sid) => sourceById(sid))
    .filter(isSource);

  return (
    <article className="route-page">
      <p className="route-page__back no-print">
        <Link to={`/${lang}/finder`}>{t('route.backToFinder')}</Link>
      </p>

      <h1>{title}</h1>

      <p className="route-page__badges">
        <span className={`badge badge--${status === 'reviewed' ? 'success' : 'warning'}`}>
          {t(`results.status.${status}`)}
        </span>
        {procedure.legalBasis.length > 0 && (
          <span className="route-page__basis">{procedure.legalBasis.join(' · ')}</span>
        )}
      </p>

      <div className="disclaimer">
        <p>{t('route.disclaimer')}</p>
        {!procedure.conditionsComplete && <p>{t('route.conditionsIncomplete')}</p>}
      </div>

      <p className="no-print">
        <button type="button" className="button" onClick={() => window.print()}>
          {t('route.print')}
        </button>
      </p>

      {(procedure.grantedFor || procedure.decisionDeadline) && (
        <Section title={t('route.keyFacts')}>
          <dl className="route-page__facts">
            {procedure.grantedFor && (
              <div>
                <dt>{t('route.grantedFor')}</dt>
                <dd>{localized(procedure.grantedFor, lang)}</dd>
              </div>
            )}
            {procedure.decisionDeadline && (
              <div>
                <dt>{t('route.decisionDeadline')}</dt>
                <dd>{localized(procedure.decisionDeadline, lang)}</dd>
              </div>
            )}
          </dl>
        </Section>
      )}

      <Section title={t('route.steps')}>
        {stepsBefore.length === 0 ? (
          <p className="route-page__missing">{t('route.stepsMissing')}</p>
        ) : (
          <ol className="route-page__steps">
            {stepsBefore.map((step) => (
              <li key={step.id}>
                <strong>{localized(step.title, lang)}</strong>
                {step.body && <p>{localized(step.body, lang)}</p>}
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title={t('route.documents')}>
        {attachments.length === 0 ? (
          <p className="route-page__missing">{t('route.documentsMissing')}</p>
        ) : (
          <>
            <p className="route-page__note">{t('route.documentsChecklistHint')}</p>
            <ul className="checklist">
              {attachments.map((doc) => (
                <DocumentItem key={doc.id} doc={doc} lang={lang} />
              ))}
            </ul>
          </>
        )}
      </Section>

      {(afterDecisionDocs.length > 0 || stepsAfter.length > 0) && (
        <Section title={t('route.afterDecision')}>
          <p className="route-page__note">{t('route.afterDecisionHint')}</p>
          {stepsAfter.map((step) => (
            <div key={step.id} className="route-page__after-step">
              <strong>{localized(step.title, lang)}</strong>
              {step.body && <p>{localized(step.body, lang)}</p>}
            </div>
          ))}
          <ul className="checklist">
            {afterDecisionDocs.map((doc) => (
              <DocumentItem key={doc.id} doc={doc} lang={lang} />
            ))}
          </ul>
        </Section>
      )}

      <Section title={t('route.form')}>
        {forms.length === 0 ? (
          <p className="route-page__missing">{t('route.formNone')}</p>
        ) : (
          forms.map((form) => <FormBlock key={form.id} form={form} />)
        )}
      </Section>

      <Section title={t('route.fees')}>
        {routeFees.length === 0 ? (
          <p className="route-page__missing">{t('route.feesNone')}</p>
        ) : (
          <>
            <p className="route-page__warning">{t('route.feesWarning')}</p>
            {routeFees.map((fee) => (
              <FeeBlock key={fee.id} fee={fee} lang={lang} />
            ))}
          </>
        )}
      </Section>

      {notes.map((note) => (
        <Section key={note.id} title={localized(note.title, lang)}>
          {note.intro && <p>{localized(note.intro, lang)}</p>}
          <ol className="route-page__grounds">
            {note.items.map((item) => (
              <li key={item.id}>{localized(item.text, lang)}</li>
            ))}
          </ol>
        </Section>
      ))}

      <Section title={t('route.authority')}>
        {procedure.authorityIds.map((aid) => {
          const authority = authorityById(aid);
          if (!authority) return null;
          return (
            <div key={aid} className="route-page__authority">
              <h3>{authority.officialName}</h3>
              {authority.infoUrl && (
                <p>
                  <a href={authority.infoUrl} rel="noreferrer noopener" target="_blank">
                    {authority.infoUrl}
                  </a>
                </p>
              )}
              {authority.notes && <p className="route-page__note">{authority.notes}</p>}
            </div>
          );
        })}
      </Section>

      {procedure.openQuestions.length > 0 && (
        <Section title={t('route.openQuestions')}>
          <ul className="route-page__open">
            {procedure.openQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={t('route.sources')}>
        <ul className="route-page__sources">
          {allSources.map((source) => (
            <li key={source.id}>
              <Link to={`/${lang}/sources#${source.id}`}>{source.title}</Link>
              {source.checkedAt && (
                <span className="route-page__note">
                  {' '}
                  · {t('sources.checkedAt')}: {formatDate(source.checkedAt)}
                </span>
              )}
              {/* Для друку адреса має бути видимою: на папері посилання не клікнеш. */}
              {(source.staticUrl ?? source.pinnedUrl ?? source.url) && (
                <span className="print-only route-page__url">
                  {source.staticUrl ?? source.pinnedUrl ?? source.url}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
}

function DocumentItem({ doc, lang }: { doc: Document; lang: string | undefined }) {
  const { t } = useTranslation();

  return (
    <li className="checklist__item">
      {/* Порожній квадрат, а не <input>: чеклист має бути придатним для друку. */}
      <span className="checklist__box" aria-hidden="true" />
      <div>
        <p className="checklist__title">
          {localized(doc.title, lang)}
          {doc.maxAgeDays !== null && (
            <span className="badge badge--warning">
              {t('route.maxAge', { days: doc.maxAgeDays })}
            </span>
          )}
        </p>
        <p className="route-page__note checklist__official">{doc.officialName}</p>
        {doc.explanation && <p>{localized(doc.explanation, lang)}</p>}
        {doc.requiredWhen && (
          <p className="route-page__note">
            {t('route.requiredWhen')}: {localized(doc.requiredWhen, lang)}
          </p>
        )}
        {doc.thresholds.map((ref, i) => {
          const base = thresholds.find((th) => th.id === ref.thresholdId);
          if (!base) return null;
          return (
            <p key={i} className="checklist__amount">
              <strong>
                {derivedAmount(base.baseValue, ref.multiplier).toFixed(2)} EUR
              </strong>{' '}
              <span className="route-page__note">
                ({ref.multiplier} × {base.baseValue.toFixed(2)}) — {localized(ref.appliesWhen, lang)}
              </span>
            </p>
          );
        })}
      </div>
    </li>
  );
}

function localized(value: { uk: string; sk: string }, lang: string | undefined): string {
  return lang === 'sk' ? value.sk : value.uk;
}

function isDocument(value: Document | undefined): value is Document {
  return value !== undefined;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="route-page__section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function FormBlock({ form }: { form: Source }) {
  const { t } = useTranslation();
  const href = form.url ?? form.staticUrl ?? form.pinnedUrl;

  return (
    <div className="route-page__form">
      <h3>
        {form.title}
        {form.formCode && <span className="route-page__note"> · {form.formCode}</span>}
      </h3>

      {form.completionLanguage === 'sk' && (
        <p className="route-page__warning">{t('route.formLanguage')}</p>
      )}

      {href ? (
        <p>
          <a className="button no-print" href={href} rel="noreferrer noopener" target="_blank">
            {t('route.formOpen')}
          </a>
          <span className="print-only route-page__url">{href}</span>
        </p>
      ) : (
        <p className="route-page__missing">{t('sources.noUrl')}</p>
      )}

      {form.sha256 === null && <p className="route-page__note">{t('route.formSnapshotMissing')}</p>}
      <p className="route-page__note">{t('route.formFieldsPending')}</p>
    </div>
  );
}

function FeeBlock({ fee, lang }: { fee: FeeRule; lang: string | undefined }) {
  const { t } = useTranslation();

  return (
    <div className="route-page__fee">
      <p className="route-page__fee-amount">
        {fee.amount.toFixed(2)} {fee.currency}
        {fee.tariffItem && <span className="route-page__note"> · {fee.tariffItem}</span>}
      </p>
      {fee.filingChannel.length > 0 && (
        <p className="route-page__note">
          {fee.filingChannel.map((c) => t(`route.channel.${c}`)).join(' · ')}
        </p>
      )}
      {fee.notes && <p className="route-page__note">{fee.notes}</p>}

      {fee.reductionRule && (
        <p className="route-page__fee-reduction">
          <strong>
            {t('route.feeReduction', {
              amount: Math.max(
                fee.amount - fee.reductionRule.maxReductionEur,
                (fee.amount * fee.reductionRule.percent) / 100,
              ).toFixed(2),
            })}
          </strong>{' '}
          {localized(fee.reductionRule.condition, lang)}
        </p>
      )}

      {fee.exemptions.length > 0 ? (
        <div className="route-page__fee-exemptions">
          <p className="route-page__fee-exemptions-title">{t('route.feeExemptions')}</p>
          <ul>
            {fee.exemptions.map((ex) => (
              <li key={ex.id}>{localized(ex.description, lang)}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="route-page__note">{t('route.feeExemptionsUnknown')}</p>
      )}

      {fee.waiverNote && <p className="route-page__note">{localized(fee.waiverNote, lang)}</p>}
    </div>
  );
}

function isSource(value: Source | undefined): value is Source {
  return value !== undefined;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
