import { useState } from 'react';
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
import type { Document, FeeRule, Procedure, Source } from '../../lib/content/schema';
import { derivedAmount } from '../../lib/content/thresholds';
import { earliestIssueDate } from '../../lib/content/dates';
import { site } from '../../lib/content/site';
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
        <h1 tabIndex={-1}>{t('route.notFound')}</h1>
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

      <h1 tabIndex={-1}>{title}</h1>

      <p className="route-page__badges">
        <span className={`badge badge--${status === 'reviewed' ? 'success' : 'warning'}`}>
          {t(`results.status.${status}`)}
        </span>
      </p>

      <div className="disclaimer">
        <p>{t('route.disclaimer')}</p>
        {!procedure.conditionsComplete && <p>{t('route.conditionsIncomplete')}</p>}
      </div>

      <div className="no-print route-page__save">
        <button type="button" className="button" onClick={() => window.print()}>
          {t('route.saveAsPdf')}
        </button>
        <p className="route-page__note">{t('route.saveAsPdfHint')}</p>
      </div>

      {/* На папері не видно, звідки аркуш. Друкуємо адресу сторінки,
          щоб людина могла повернутися до неї або показати її в органі. */}
      <p className="print-only route-page__print-source">
        {typeof window === 'undefined' ? '' : window.location.href}
      </p>

      <SummaryPanel procedure={procedure} lang={lang} />

      <DeadlineTimeline procedure={procedure} lang={lang} />

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
            <Checklist docs={attachments} lang={lang} withPlanner />
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
          <Checklist docs={afterDecisionDocs} lang={lang} />
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

      <Section title={t('route.authority')}>
        {procedure.authorityIds.map((aid) => {
          const authority = authorityById(aid);
          if (!authority) return null;
          return (
            <div key={aid} className="route-page__authority">
              <h3>{authority.officialName}</h3>
              {authority.address && <p className="route-page__authority-address">{authority.address}</p>}
              {(authority.phones ?? []).length > 0 && (
                <p className="route-page__note">
                  {t('authorities.phone')}: {(authority.phones ?? []).join(' \u00b7 ')}
                </p>
              )}
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

      {notes.length > 0 && (
        <section className="route-page__section route-page__legal-notes">
          <h2>{t('route.legalNotes')}</h2>
          <p className="route-page__note">{t('route.legalNotesHint')}</p>
          {notes.map((note) => (
            <CollapsibleNote
              key={note.id}
              title={localized(note.title, lang)}
              count={note.items.length}
            >
              {note.intro && <p>{localized(note.intro, lang)}</p>}
              {/* Дані з YAML читаються без Zod, тож поля може не бути. */}
              {(note.thresholds ?? []).map((ref, i) => {
                const base = thresholds.find((th) => th.id === ref.thresholdId);
                if (!base) return null;
                return (
                  <p key={i} className="checklist__amount">
                    <strong>{derivedAmount(base.baseValue, ref.multiplier).toFixed(2)} EUR</strong>{' '}
                    <span className="route-page__note">
                      ({ref.multiplier} × {base.baseValue.toFixed(2)}) —{' '}
                      {localized(ref.appliesWhen, lang)}
                    </span>
                  </p>
                );
              })}
              <ol className="route-page__grounds">
                {note.items.map((item) => (
                  <li key={item.id}>{localized(item.text, lang)}</li>
                ))}
              </ol>
            </CollapsibleNote>
          ))}
        </section>
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

/**
 * Спільні примітки із закону згорнуті: їх десять, і розгорнуті вони ховали б
 * головне — кроки, документи і збори — під десятьма екранами тексту.
 * Друкується те, що людина розгорнула.
 */
function CollapsibleNote({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="legal-note">
      <button
        type="button"
        className="legal-note__toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <span className="legal-note__count">{t('route.legalNoteCount', { count })}</span>
      </button>
      {open && <div className="legal-note__body">{children}</div>}
    </div>
  );
}

/**
 * «Паспорт процедури»: шість полів, які людина шукає найперше. Значення
 * беруться з даних маршруту; якщо в даних поля немає — так і написано
 * «потребує перевірки», а не порожньо і не припущення.
 */
/**
 * Шкала ключових строків. Строки НЕ додаються один до одного: паралельні
 * (наприклад 90 днів поліції і 60 днів висновку міністерства) показані як
 * окремі точки, бо закон не встановлює їхньої суми.
 */
function DeadlineTimeline({ procedure, lang }: { procedure: Procedure; lang: string | undefined }) {
  const { t } = useTranslation();
  const phases = ['before', 'submission', 'decision', 'after'] as const;
  const all = procedure.deadlines ?? [];
  if (all.length === 0) return null;

  return (
    <Section title={t('deadlines.title')}>
      <p className="route-page__note">{t('deadlines.hint')}</p>
      <ol className="deadlines">
        {phases.map((phase) => {
          const items = all.filter((d) => d.phase === phase);
          if (items.length === 0) return null;
          return (
            <li key={phase} className={`deadlines__phase deadlines__phase--${phase}`}>
              <p className="deadlines__phase-name">{t(`deadlines.phase.${phase}`)}</p>
              <ul>
                {items.map((d) => (
                  <li key={d.id}>
                    {d.days !== null && <strong className="deadlines__days">{d.days} </strong>}
                    {localized(d.label, lang)}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

function SummaryPanel({ procedure, lang }: { procedure: Procedure; lang: string | undefined }) {
  const { t } = useTranslation();
  const status = publicStatus(procedure.reviewStatus);

  const authorities = procedure.authorityIds
    .map((id) => authorityById(id)?.officialName)
    .filter((n): n is string => n !== undefined);

  const rows: Array<[string, string | null]> = [
    [t('summary.category'), t(`catalogue.category.${procedure.category}`)],
    [t('summary.basis'), procedure.legalBasis.join(' · ') || null],
    [t('route.grantedFor'), procedure.grantedFor ? localized(procedure.grantedFor, lang) : null],
    [
      t('route.decisionDeadline'),
      procedure.decisionDeadline ? localized(procedure.decisionDeadline, lang) : null,
    ],
    [t('summary.where'), authorities.length > 0 ? authorities.join(' · ') : null],
  ];

  return (
    <section className="summary" aria-labelledby="summary-title">
      <h2 id="summary-title" className="summary__title">
        {t('summary.title')}
      </h2>
      <dl className="summary__grid">
        {rows.map(([label, value]) => (
          <div key={label} className="summary__row">
            <dt>{label}</dt>
            <dd className={value === null ? 'summary__unverified' : undefined}>
              {value ?? `⚠ ${t('summary.needsCheck')}`}
            </dd>
          </div>
        ))}
        <div className="summary__row">
          <dt>{t('summary.dataState')}</dt>
          <dd>
            <span className={`badge badge--${status === 'reviewed' ? 'success' : 'warning'}`}>
              {t(`results.status.${status}`)}
            </span>{' '}
            <span className="route-page__note">
              {t('baseline.label')}: {formatDate(site.legalBaseline.date)}
            </span>
          </dd>
        </div>
      </dl>
    </section>
  );
}

/**
 * Чеклист із живими чекбоксами. Відмітки живуть ТІЛЬКИ в пам'яті вкладки:
 * жодного localStorage — це заборонено CLAUDE.md §2.1, і тест це перевіряє.
 * «Збереженням» лишається друк на папері, тому відмітки видно і при друці.
 */
function Checklist({
  docs,
  lang,
  withPlanner = false,
}: {
  docs: Document[];
  lang: string | undefined;
  withPlanner?: boolean;
}) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submission, setSubmission] = useState('');
  const done = docs.filter((d) => checked[d.id]).length;
  const datedDocs = docs.filter((d) => d.maxAgeDays !== null);

  return (
    <>
      {withPlanner && datedDocs.length > 0 && (
        <div className="planner no-print">
          <label htmlFor="planned-submission">{t('planner.label')}</label>
          <input
            id="planned-submission"
            type="date"
            value={submission}
            onChange={(e) => setSubmission(e.target.value)}
          />
          <p className="route-page__note">{t('planner.hint')}</p>
        </div>
      )}

      <p className="checklist__progress" role="status" aria-live="polite">
        {t('route.checklistProgress', { done, total: docs.length })}
      </p>
      <ul className="checklist">
        {docs.map((doc) => (
          <DocumentItem
            key={doc.id}
            doc={doc}
            lang={lang}
            checked={checked[doc.id] ?? false}
            onToggle={() => setChecked((prev) => ({ ...prev, [doc.id]: !prev[doc.id] }))}
            submission={withPlanner ? submission : ''}
          />
        ))}
      </ul>
      {done > 0 && (
        <p className="no-print">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setChecked({})}
          >
            {t('route.checklistReset')}
          </button>
        </p>
      )}
    </>
  );
}

function DocumentItem({
  doc,
  lang,
  checked,
  onToggle,
  submission,
}: {
  doc: Document;
  lang: string | undefined;
  checked: boolean;
  onToggle: () => void;
  submission: string;
}) {
  const { t } = useTranslation();
  const inputId = `doc-${doc.id}`;
  const earliest =
    submission && doc.maxAgeDays !== null ? earliestIssueDate(submission, doc.maxAgeDays) : null;

  return (
    <li className="checklist__item">
      <input
        type="checkbox"
        id={inputId}
        className="checklist__input"
        checked={checked}
        onChange={onToggle}
      />
      <div>
        <label className="checklist__title" htmlFor={inputId}>
          {localized(doc.title, lang)}
          <span className={`badge badge--${doc.requirement === 'required' ? 'success' : 'warning'}`}>
            {t(`route.requirement.${doc.requirement ?? 'conditional'}`)}
          </span>
          {doc.maxAgeDays !== null && (
            <span className="badge badge--warning">
              {t('route.maxAge', { days: doc.maxAgeDays })}
            </span>
          )}
        </label>
        <p className="route-page__note checklist__official">{doc.officialName}</p>
        {doc.explanation && <p>{localized(doc.explanation, lang)}</p>}
        {earliest && (
          <p className="planner__result">
            {t('planner.notBefore', { date: formatDate(earliest) })}
          </p>
        )}
        {doc.requiredWhen && (
          <p className="route-page__note">
            {t('route.requiredWhen')}: {localized(doc.requiredWhen, lang)}
          </p>
        )}
        {(doc.thresholds ?? []).map((ref, i) => {
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
