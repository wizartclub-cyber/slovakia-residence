import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../app/usePageTitle';
import { bookingProblems, bookingSteps, sourceById } from '../../lib/content';
import type { BookingProblem } from '../../lib/content/schema';
import './booking.css';

const OFFICIAL_URL = 'https://www.minv.sk/?objednavaci-system-na-ocp';
const KINDS = ['blocked', 'no-slots', 'rules', 'cancel'] as const;

export function BookingPage() {
  const { t } = useTranslation();
  const { lang } = useParams();
  usePageTitle(t('booking.title'));
  const local = (value: { uk: string; sk: string }) => (lang === 'sk' ? value.sk : value.uk);

  const [kind, setKind] = useState<'all' | (typeof KINDS)[number]>('all');
  const problems = useMemo(
    () => bookingProblems.filter((p) => kind === 'all' || p.kind === kind),
    [kind],
  );

  return (
    <>
      <h1 tabIndex={-1}>{t('booking.title')}</h1>
      <p>{t('booking.intro')}</p>
      <div className="route-page__warning">{t('booking.disclaimer')}</div>

      <p>
        <a
          className="button"
          href={OFFICIAL_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t('booking.openOfficial')}
        </a>
      </p>

      <h2>{t('booking.stepsTitle')}</h2>
      <ol className="booking-steps">
        {bookingSteps.map((step) => (
          <li className="card booking-step" key={step.id}>
            <h3>{local(step.title)}</h3>
            <p>{local(step.body)}</p>
            {step.tip && <p className="booking-step__tip">{local(step.tip)}</p>}
            <SourceLine checkedAt={step.checkedAt} lang={lang} sourceIds={step.sourceIds} />
          </li>
        ))}
      </ol>

      <h2>{t('booking.problemsTitle')}</h2>
      <div aria-label={t('booking.filterLabel')} className="booking-filters" role="group">
        <FilterButton active={kind === 'all'} onClick={() => setKind('all')}>
          {t('booking.kind.all')}
        </FilterButton>
        {KINDS.filter((k) => bookingProblems.some((p) => p.kind === k)).map((k) => (
          <FilterButton active={kind === k} key={k} onClick={() => setKind(k)}>
            {t(`booking.kind.${k}`)}
          </FilterButton>
        ))}
      </div>

      <ul className="booking-problems">
        {problems.map((problem) => (
          <ProblemCard key={problem.id} lang={lang} problem={problem} />
        ))}
      </ul>
    </>
  );
}

function ProblemCard({ problem, lang }: { problem: BookingProblem; lang: string | undefined }) {
  const { t } = useTranslation();
  const local = (value: { uk: string; sk: string }) => (lang === 'sk' ? value.sk : value.uk);

  return (
    <li className="card booking-problem" id={problem.id}>
      {/* Позначка серйозності завжди має слово поруч зі знаком: кольору самого
          по собі недосить — його не побачать ані в ч/б, ані при дальтонізмі. */}
      <p className={`booking-problem__severity booking-problem__severity--${problem.severity}`}>
        <span aria-hidden="true">{problem.severity === 'info' ? '✓' : '!'}</span>{' '}
        {t(`booking.severity.${problem.severity}`)}
      </p>
      <h3>{local(problem.situation)}</h3>

      <dl className="booking-problem__grid">
        <div>
          <dt>{t('booking.cause')}</dt>
          <dd>{local(problem.cause)}</dd>
        </div>
        <div>
          <dt>{t('booking.whatToDo')}</dt>
          <dd>{local(problem.whatToDo)}</dd>
        </div>
      </dl>

      {problem.myth && (
        <p className="booking-problem__myth">
          <strong>{t('booking.myth')}:</strong> {local(problem.myth)}
        </p>
      )}

      <SourceLine checkedAt={problem.checkedAt} lang={lang} sourceIds={problem.sourceIds} />
    </li>
  );
}

function SourceLine({
  sourceIds,
  checkedAt,
  lang,
}: {
  sourceIds: string[];
  checkedAt: string;
  lang: string | undefined;
}) {
  const { t } = useTranslation();
  const sources = sourceIds.map((id) => sourceById(id)).filter((s) => s !== undefined);
  return (
    <p className="route-page__note booking-source">
      {t('faq.sources')}:{' '}
      {sources.map((source, i) => (
        <span key={source.id}>
          {i > 0 && ' · '}
          <a href={`/${lang}/sources#${source.id}`}>{source.title}</a>
        </span>
      ))}{' '}
      · {t('sources.checkedAt')}: {formatDate(checkedAt)}
    </p>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button aria-pressed={active} className="faq-filter" onClick={onClick} type="button">
      {children}
    </button>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
