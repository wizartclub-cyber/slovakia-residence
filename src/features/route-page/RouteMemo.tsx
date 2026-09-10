import { useTranslation } from 'react-i18next';
import { authorityById, sourceById } from '../../lib/content';
import type { Document, FeeRule, Procedure } from '../../lib/content/schema';
import { publicStatus } from '../../lib/content/schema';

/**
 * Пам'ятка на один аркуш A4 — те, з чим людина йде в орган.
 *
 * Це НЕ стиснута сторінка маршруту. Свідомо взято лише назви: кроки без
 * пояснень, документи без описів, джерела зведені до рядка з адресою сайту.
 * Усе, що не вміщається в аркуш, лишається на екрані — там воно нікуди не
 * дівається, а на папері пачка ховає головне.
 *
 * На екрані блок схований; показує його лише друк у режимі «пам'ятка».
 * Обмеження в один аркуш перевіряє e2e, який друкує кожен маршрут обома
 * мовами і рахує сторінки, — інакше наступний доданий рядок тихо зробить два.
 */
export function RouteMemo({
  procedure,
  lang,
  title,
  attachments,
  routeFees,
}: {
  procedure: Procedure;
  lang: string | undefined;
  title: string;
  attachments: Document[];
  routeFees: FeeRule[];
}) {
  const { t } = useTranslation();
  const localized = (value: { uk: string; sk: string }) => (lang === 'sk' ? value.sk : value.uk);

  const authorities = procedure.authorityIds
    .map((id) => authorityById(id))
    .filter((a): a is NonNullable<typeof a> => a !== undefined);
  const forms = procedure.formSourceIds.map((sid) => sourceById(sid)).filter((s) => s !== undefined);
  const steps = [...procedure.steps]
    .filter((s) => !s.afterDecision)
    .sort((a, b) => a.order - b.order);
  const deadlines = procedure.deadlines ?? [];
  const href = typeof window === 'undefined' ? '' : window.location.href;

  return (
    <section aria-hidden="true" className="route-memo">
      <header className="route-memo__head">
        <h2 className="route-memo__title">{title}</h2>
        <p className="route-memo__basis">
          {procedure.legalBasis.join(' · ')} · {t(`results.status.${publicStatus(procedure.reviewStatus)}`)}
        </p>
      </header>

      <dl className="route-memo__facts">
        <Fact label={t('route.grantedFor')} value={procedure.grantedFor ? localized(procedure.grantedFor) : null} />
        <Fact
          label={t('route.decisionDeadline')}
          value={procedure.decisionDeadline ? localized(procedure.decisionDeadline) : null}
        />
        <Fact
          label={t('route.fees')}
          value={routeFees.length > 0 ? routeFees.map((f) => `${f.amount.toFixed(2)} ${f.currency}`).join(' · ') : null}
        />
      </dl>

      <div className="route-memo__columns">
        <div>
          <h3>{t('route.documents')}</h3>
          {attachments.length === 0 ? (
            <p className="route-memo__missing">{t('route.documentsMissing')}</p>
          ) : (
            <ul className="route-memo__checklist">
              {attachments.map((doc) => (
                <li key={doc.id}>
                  <span aria-hidden="true" className="route-memo__box" />
                  {localized(doc.title)}
                  {doc.maxAgeDays !== null && doc.maxAgeDays !== undefined && (
                    <span className="route-memo__dim"> · {t('route.maxAge', { days: doc.maxAgeDays })}</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {forms.length > 0 && (
            <>
              <h3>{t('route.form')}</h3>
              <ul className="route-memo__plain">
                {forms.map((form) => (
                  <li key={form.id}>
                    {form.title}
                    {form.url && <span className="route-memo__url">{form.url}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div>
          <h3>{t('route.authority')}</h3>
          {authorities.length === 0 ? (
            <p className="route-memo__missing">{t('summary.needsCheck')}</p>
          ) : (
            <ul className="route-memo__plain">
              {authorities.map((a) => (
                <li key={a.id}>
                  {a.officialName}
                  {a.address && <span className="route-memo__dim"> · {a.address}</span>}
                  {(a.phones ?? []).length > 0 && (
                    <span className="route-memo__dim"> · {(a.phones ?? [])[0]}</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {deadlines.length > 0 && (
            <>
              <h3>{t('deadlines.title')}</h3>
              <ul className="route-memo__plain">
                {deadlines.map((d) => (
                  <li key={d.id}>
                    {d.days !== null && <strong>{d.days} </strong>}
                    {localized(d.label)}
                  </li>
                ))}
              </ul>
            </>
          )}

          {steps.length > 0 && (
            <>
              <h3>{t('route.steps')}</h3>
              <ol className="route-memo__plain">
                {steps.map((step) => (
                  <li key={step.id}>{localized(step.title)}</li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>

      <footer className="route-memo__foot">
        <p>{t('route.memoDisclaimer')}</p>
        <p className="route-memo__url">{href}</p>
      </footer>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  const { t } = useTranslation();
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value ?? `⚠ ${t('summary.needsCheck')}`}</dd>
    </div>
  );
}
