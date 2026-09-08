import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authorityById, procedureById } from '../../lib/content';
import { offeredRoutes } from '../../lib/rules/evaluate';
import type { RouteMatch } from '../../lib/rules/types';

export function ResultsView({
  matches,
  baselineDate,
}: {
  matches: RouteMatch[];
  baselineDate: string;
}) {
  const { t, i18n } = useTranslation();
  const [showOther, setShowOther] = useState(false);

  const offered = offeredRoutes(matches);
  const other = matches.filter((m) => m.outcome === 'not_eligible' || m.outcome === 'excluded');

  return (
    <section aria-labelledby="results-title">
      <h2 id="results-title">{t('results.title')}</h2>
      <p className="results__asof">{t('results.asOf', { date: formatDate(baselineDate) })}</p>

      <div className="disclaimer">
        <p>{t('results.disclaimer')}</p>
      </div>

      {offered.length === 0 ? (
        <p className="card">{t('results.none')}</p>
      ) : (
        <ul className="results__list">
          {offered.map((match) => (
            <RouteCard key={match.procedureId} match={match} locale={i18n.language} />
          ))}
        </ul>
      )}

      {other.length > 0 && (
        <>
          <button
            type="button"
            className="button button--secondary"
            aria-expanded={showOther}
            onClick={() => setShowOther((v) => !v)}
          >
            {showOther ? t('results.hideOther') : t('results.showOther', { count: other.length })}
          </button>

          {showOther && (
            <>
              <h3>{t('results.otherTitle')}</h3>
              <ul className="results__list">
                {other.map((match) => (
                  <RouteCard key={match.procedureId} match={match} locale={i18n.language} muted />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}

function RouteCard({
  match,
  locale,
  muted = false,
}: {
  match: RouteMatch;
  locale: string;
  muted?: boolean;
}) {
  const { t } = useTranslation();
  const { lang } = useParams();
  const procedure = procedureById(match.procedureId);
  if (!procedure) return null;

  const title = locale === 'sk' ? procedure.title.sk : procedure.title.uk;

  return (
    <li className={`card route-card${muted ? ' route-card--muted' : ''}`}>
      <h3 className="route-card__title">
        <Link to={`/${lang}/route/${procedure.id}`}>{title}</Link>
      </h3>

      <p className="route-card__badges">
        <span className={`badge badge--${match.status === 'reviewed' ? 'success' : 'warning'}`}>
          {t(`results.status.${match.status}`)}
        </span>
        <span className="route-card__outcome">{t(`results.outcome.${match.outcome}`)}</span>
      </p>

      {procedure.legalBasis.length > 0 && (
        <p className="route-card__meta">{procedure.legalBasis.join(' · ')}</p>
      )}

      {match.cappedByIncompleteConditions && (
        <p className="route-card__why">{t('results.whyIncomplete')}</p>
      )}
      {match.unresolvedRuleIds.length > 0 && (
        <p className="route-card__why">{t('results.whyUnknown')}</p>
      )}

      {procedure.authorityIds.length > 0 && (
        <p className="route-card__meta">
          {t('results.authority')}:{' '}
          {procedure.authorityIds
            .map((id) => authorityById(id)?.officialName ?? id)
            .join(' · ')}
        </p>
      )}

      {procedure.openQuestions.length > 0 && (
        <details className="route-card__open">
          <summary>{t('results.openQuestionsTitle')}</summary>
          <ul>
            {procedure.openQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </details>
      )}
    </li>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
