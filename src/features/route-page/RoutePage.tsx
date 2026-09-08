import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authorityById, fees, procedureById, sourceById } from '../../lib/content';
import { publicStatus } from '../../lib/content/schema';
import type { FeeRule, Source } from '../../lib/content/schema';
import './route-page.css';

export function RoutePage() {
  const { lang, id } = useParams();
  const { t } = useTranslation();
  const procedure = id ? procedureById(id) : undefined;

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

      <Section title={t('route.steps')}>
        {procedure.steps.length === 0 ? (
          <p className="route-page__missing">{t('route.stepsMissing')}</p>
        ) : (
          <ol>
            {procedure.steps.map((step) => (
              <li key={step.id}>{step.localizedContentKey}</li>
            ))}
          </ol>
        )}
      </Section>

      <Section title={t('route.documents')}>
        <p className="route-page__missing">{t('route.documentsMissing')}</p>
      </Section>

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
              <FeeBlock key={fee.id} fee={fee} />
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

function FeeBlock({ fee }: { fee: FeeRule }) {
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
      <p className="route-page__note">{t('route.feeExemptionsUnknown')}</p>
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
