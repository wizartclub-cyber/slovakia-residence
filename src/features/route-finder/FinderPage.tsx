import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../app/usePageTitle';
import { finder, procedures } from '../../lib/content';
import { site } from '../../lib/content/site';
import { evaluate } from '../../lib/rules/evaluate';
import type { Answers } from '../../lib/rules/types';
import { QuestionStep } from './QuestionStep';
import { ResultsView } from './ResultsView';
import './route-finder.css';

type Draft = Omit<Partial<Answers>, 'asOfDate'>;

export function FinderPage() {
  const { t } = useTranslation();
  usePageTitle(t('finder.title'));

  // Відповіді живуть тільки тут, у пам'яті вкладки. Жодного localStorage,
  // жодного запису в адресу — перезавантаження сторінки їх стирає (CLAUDE.md §2.1).
  const [draft, setDraft] = useState<Draft>({});
  const [step, setStep] = useState(0);

  const steps = finder.steps;
  const total = steps.length;
  const onResults = step >= total;

  function setAnswer(field: string, value: string | undefined) {
    setDraft((prev) => {
      const next = { ...prev } as Record<string, string | undefined>;
      if (value === undefined) delete next[field];
      else next[field] = value;
      return next as Draft;
    });
  }

  function reset() {
    setDraft({});
    setStep(0);
  }

  // Оцінюємо за станом права на дату baseline, а не за сьогоднішньою датою:
  // контролює саме та редакція закону, яку ми переглянули (spec §2).
  const answers: Answers = { asOfDate: site.legalBaseline.date, ...draft };

  return (
    <>
      <h1 tabIndex={-1}>{t('finder.title')}</h1>

      {!onResults && (
        <>
          <p>{t('finder.intro')}</p>
          <p className="finder__privacy">{t('finder.privacyNote')}</p>

          <div className="card">
            {/* Смуга прогресу з aria-атрибутами: скрінрідер має знати, де людина
                в опитувальнику, а не лише читати «Питання 3 з 6». */}
            <div className="finder__progressbar">
              <div
                className="finder__progressbar-track"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={total}
                aria-valuenow={step + 1}
                aria-label={t('finder.progressLabel', {
                  current: step + 1,
                  total,
                  name: t(`finder.q.${steps[step]!.id}`),
                })}
              >
                <span
                  className="finder__progressbar-fill"
                  style={{ inlineSize: `${((step + 1) / total) * 100}%` }}
                />
              </div>
              <p className="finder__progress">{t('finder.stepOf', { current: step + 1, total })}</p>
            </div>

            <AnswerChips draft={draft} onJump={setStep} />

            <QuestionStep
              step={steps[step]!}
              value={(draft as Record<string, string | undefined>)[steps[step]!.field]}
              onChange={(value) => setAnswer(steps[step]!.field, value)}
            />

            <div className="finder__actions">
              {step > 0 && (
                <button type="button" className="button button--secondary" onClick={() => setStep(step - 1)}>
                  {t('finder.back')}
                </button>
              )}
              <button
                type="button"
                className="button button--secondary"
                onClick={() => {
                  setAnswer(steps[step]!.field, undefined);
                  setStep(step + 1);
                }}
              >
                {t('finder.skip')}
              </button>
              <button type="button" className="button" onClick={() => setStep(step + 1)}>
                {step + 1 === total ? t('finder.seeResults') : t('finder.next')}
              </button>
            </div>
          </div>
        </>
      )}

      {onResults && (
        <>
          <AnswerSummary draft={draft} />

          <div className="finder__actions">
            <button type="button" className="button button--secondary" onClick={() => setStep(total - 1)}>
              {t('finder.changeAnswers')}
            </button>
            <button type="button" className="button button--secondary" onClick={reset}>
              {t('finder.restart')}
            </button>
          </div>

          <ResultsView
            matches={evaluate(procedures, answers)}
            baselineDate={site.legalBaseline.date}
          />
        </>
      )}
    </>
  );
}

/**
 * Уже дані відповіді як chips. Кожен — кнопка: людина може повернутися саме
 * до того питання, не проходячи опитувальник спочатку.
 */
function AnswerChips({ draft, onJump }: { draft: Draft; onJump: (step: number) => void }) {
  const { t } = useTranslation();
  const values = draft as Record<string, string | undefined>;
  const answered = finder.steps
    .map((s, index) => ({ step: s, index, value: values[s.field] }))
    .filter((x) => x.value !== undefined);

  if (answered.length === 0) return null;

  return (
    <div className="chips">
      <p className="chips__label">{t('finder.yourSituation')}</p>
      <ul className="chips__list">
        {answered.map(({ step, index, value }) => (
          <li key={step.id}>
            <button type="button" className="chip" onClick={() => onJump(index)}>
              <span className="chip__q">{t(`finder.q.${step.id}`)}</span>
              <span className="chip__a">{t(`answer.${step.field}.${value}`)}</span>
              <span className="chip__edit" aria-hidden="true">✎</span>
              <span className="visually-hidden">{t('finder.changeThis')}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnswerSummary({ draft }: { draft: Draft }) {
  const { t } = useTranslation();
  const values = draft as Record<string, string | undefined>;

  return (
    <div className="card">
      <h2 className="finder__summary-title">{t('finder.yourAnswers')}</h2>
      <dl className="finder__summary">
        {finder.steps.map((s) => (
          <div key={s.id} className="finder__summary-row">
            <dt>{t(`finder.q.${s.id}`)}</dt>
            <dd>
              {values[s.field] ? t(`answer.${s.field}.${values[s.field]}`) : t('finder.notAnswered')}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
