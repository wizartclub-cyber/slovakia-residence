import { useTranslation } from 'react-i18next';
import { authorityById, sourceById, thresholds } from '../../lib/content';
import { derivedAmount } from '../../lib/content/thresholds';
import { site } from '../../lib/content/site';
import type { Document, FeeRule, Procedure } from '../../lib/content/schema';

type LocalizedText = { uk: string; sk: string };
import { publicStatus } from '../../lib/content/schema';

/**
 * Пам'ятка маршруту на один аркуш A4 (ТЗ «26 односторінкових пам'яток», зони §1.2).
 *
 * Два правила, які тут важливіші за верстку:
 *  1. Жодного юридичного числа в коді. Суми, строки й пороги приходять із
 *     content/**; пороги рахуються з чинного життєвого мінімуму, а не
 *     зберігаються обчисленими.
 *  2. Порожнє поле показується як «ще не встановлено», а не як «0», «безкоштовно»
 *     чи прочерк: пам'ятку беруть в орган, і мовчазна прогалина там дорожча
 *     за визнану.
 *
 * Пояснення кроків скорочені до одного речення (ТЗ §6). Скорочення позначене
 * трикрапкою — щоб було видно, що це не повний текст, і людина пішла на сторінку.
 */

const PHASES = ['before', 'submission', 'decision', 'after'] as const;

export function RouteMemo({
  procedure,
  lang,
  title,
  documents,
  routeFees,
}: {
  procedure: Procedure;
  lang: string | undefined;
  title: string;
  documents: Document[];
  routeFees: FeeRule[];
}) {
  const { t } = useTranslation();
  const local = (value: LocalizedText) => (lang === 'sk' ? value.sk : value.uk);
  const status = publicStatus(procedure.reviewStatus);

  const groups = [
    {
      key: 'required',
      items: documents.filter((d) => !d.afterDecision && d.requirement === 'required'),
    },
    {
      key: 'conditional',
      items: documents.filter((d) => !d.afterDecision && d.requirement !== 'required'),
    },
    { key: 'after', items: documents.filter((d) => d.afterDecision) },
  ].filter((g) => g.items.length > 0);

  const steps = [...procedure.steps].sort((a, b) => a.order - b.order);
  const deadlines = procedure.deadlines ?? [];
  const thresholdRefs = documents.flatMap((d) =>
    (d.thresholds ?? []).map((ref) => ({ ...ref, docTitle: local(d.title) })),
  );

  return (
    <section aria-hidden="true" className="memo">
      <MemoHeader lang={lang} procedure={procedure} status={status} title={title} />

      <FactCards lang={lang} procedure={procedure} routeFees={routeFees} />

      <div className="memo__columns">
        <div className="memo__col">
          <MemoBlockTitle icon="→" text={t('memo.journey')} />
          {steps.length === 0 ? (
            <p className="memo__missing">{t('memo.stepsMissing')}</p>
          ) : (
            <ol className="memo__steps">
              {steps.map((step) => (
                <li key={step.id}>
                  <strong>{local(step.title)}</strong>
                  {step.body && <span className="memo__dim"> {clamp(firstSentence(local(step.body)), 90)}</span>}
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="memo__col">
          <MemoBlockTitle
            icon="☑"
            text={`${t('memo.documents')} · ${documents.length}`}
          />
          {documents.length === 0 ? (
            <p className="memo__warn">{t('memo.documentsMissing')}</p>
          ) : (
            groups.map((group) => (
              <div className="memo__group" key={group.key}>
                <p className="memo__group-title">{t(`memo.group.${group.key}`)}</p>
                <ul className="memo__docs">
                  {group.items.map((doc) => (
                    <li key={doc.id}>
                      <span aria-hidden="true" className="memo__box" />
                      {clamp(local(doc.title), 80)}
                      <MemoDocMeta doc={doc} />
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>

      {thresholdRefs.length > 0 && (
        <div className="memo__thresholds">
          <MemoBlockTitle icon="€" text={t('memo.thresholds')} />
          <ul>
            {thresholdRefs.map((ref, index) => {
              const base = thresholds.find((th) => th.id === ref.thresholdId);
              if (!base) return null;
              return (
                <li key={index}>
                  <strong>{derivedAmount(base.baseValue, ref.multiplier).toFixed(2)} EUR</strong>
                  <span className="memo__dim">
                    {' '}
                    {ref.multiplier} × {base.baseValue.toFixed(2)} · {clamp(firstSentence(local(ref.appliesWhen)), 90)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {deadlines.length > 0 && (
        <div className="memo__deadlines">
          <MemoBlockTitle icon="◷" text={t('memo.deadlines')} />
          <ol className="memo__strip">
            {PHASES.map((phase) => {
              const items = deadlines.filter((d) => d.phase === phase);
              if (items.length === 0) return null;
              return (
                <li key={phase}>
                  <p className="memo__phase">{t(`deadlines.phase.${phase}`)}</p>
                  {items.map((d) => (
                    <p className="memo__phase-item" key={d.id}>
                      {d.days !== null && <strong>{d.days} </strong>}
                      {clamp(firstSentence(local(d.label)), 90)}
                    </p>
                  ))}
                </li>
              );
            })}
          </ol>
          <p className="memo__dim memo__strip-note">{t('memo.deadlinesNotSummed')}</p>
        </div>
      )}

      <MemoRisks procedure={procedure} />

      <footer className="memo__foot">
        <p>
          <strong>{t('memo.notAdvice')}</strong> {t('memo.fullRoute')}
        </p>
        <p className="memo__url">{typeof window === 'undefined' ? '' : window.location.href}</p>
      </footer>
    </section>
  );
}

function MemoHeader({
  procedure,
  status,
  title,
  lang,
}: {
  procedure: Procedure;
  status: string;
  title: string;
  lang: string | undefined;
}) {
  const { t } = useTranslation();
  return (
    <header className="memo__head">
      <p className="memo__status">
        <span>
          {t('baseline.label')}: {formatDate(site.legalBaseline.date)}
        </span>
        <span className={status === 'reviewed' ? 'memo__ok' : 'memo__flag'}>
          {status === 'reviewed' ? '✓' : '!'} {t(`results.status.${status}`)}
        </span>
      </p>
      <p className="memo__eyebrow">
        {t(`catalogue.category.${procedure.category}`)} · {procedure.legalBasis.join(' · ')}
      </p>
      <h2 className="memo__title">{title}</h2>
      <p className="memo__lede">{t('memo.lede')}</p>
      <MemoForms lang={lang} procedure={procedure} />
    </header>
  );
}

function MemoForms({ procedure, lang }: { procedure: Procedure; lang: string | undefined }) {
  const { t } = useTranslation();
  const forms = procedure.formSourceIds.map((id) => sourceById(id)).filter((s) => s !== undefined);
  if (forms.length === 0) return null;
  void lang;
  return (
    <p className="memo__forms">
      <strong>{t('memo.form')}:</strong> {forms.map((f) => f.title).join(' · ')}
    </p>
  );
}

function FactCards({
  procedure,
  routeFees,
  lang,
}: {
  procedure: Procedure;
  routeFees: FeeRule[];
  lang: string | undefined;
}) {
  const { t } = useTranslation();
  const local = (value: LocalizedText) => (lang === 'sk' ? value.sk : value.uk);
  const authorities = procedure.authorityIds
    .map((id) => authorityById(id)?.officialName)
    .filter((n): n is string => n !== undefined);

  return (
    <dl className="memo__facts">
      <Fact
        icon="◷"
        label={t('route.grantedFor')}
        value={procedure.grantedFor ? clamp(firstSentence(local(procedure.grantedFor)), 110) : null}
      />
      <Fact
        icon="◷"
        label={t('route.decisionDeadline')}
        value={procedure.decisionDeadline ? clamp(firstSentence(local(procedure.decisionDeadline)), 110) : null}
      />
      <Fact icon="€" label={t('route.fees')} value={null}>
        {routeFees.length === 0 ? null : (
          <ul className="memo__fee-list">
            {routeFees.map((fee) => (
              <li key={fee.id}>
                <strong>
                  {fee.amount.toFixed(2)} {fee.currency}
                </strong>{' '}
                <span className="memo__dim">
                  {fee.filingChannel.map((c) => t(`route.channel.${c}`)).join(' · ')}
                </span>
                {fee.reductionRule && (
                  <span className="memo__dim">
                    {' · '}
                    {t('memo.electronic')}{' '}
                    {Math.max(
                      fee.amount - fee.reductionRule.maxReductionEur,
                      (fee.amount * fee.reductionRule.percent) / 100,
                    ).toFixed(2)}{' '}
                    {fee.currency}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Fact>
      <Fact
        icon="⌂"
        label={t('summary.where')}
        value={authorities.length > 0 ? clamp(authorities.join(' · '), 100) : null}
      />
    </dl>
  );
}

function Fact({
  icon,
  label,
  value,
  children,
}: {
  icon: string;
  label: string;
  value: string | null;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const empty = children === undefined ? value === null : children === null;
  return (
    <div className="memo__fact">
      <dt>
        <span aria-hidden="true">{icon}</span> {label}
      </dt>
      <dd className={empty ? 'memo__flag' : undefined}>
        {empty ? `! ${t('memo.notEstablished')}` : (children ?? value)}
      </dd>
    </div>
  );
}

function MemoRisks({ procedure }: { procedure: Procedure }) {
  const { t } = useTranslation();
  // Не більше трьох застережень (ТЗ §1.2.7): четверте вже не читають.
  const risks: string[] = [];
  if (!procedure.conditionsComplete) risks.push(t('memo.risk.conditions'));
  for (const question of procedure.openQuestions) {
    if (risks.length >= 2) break;
    risks.push(question);
  }
  risks.push(t('memo.risk.checkAtOffice'));

  return (
    <div className="memo__risks">
      <MemoBlockTitle icon="!" text={t('memo.risks')} />
      <ul>
        {risks.slice(0, 3).map((risk) => (
          <li key={risk}>{risk}</li>
        ))}
      </ul>
    </div>
  );
}

// Свідомо лише строк давності. Пояснення «коли саме потрібен» буває на
// кілька рядків: воно роздуває аркуш і виштовхує з нього інші документи.
// Читати його треба на сторінці маршруту, а не в пам'ятці.
function MemoDocMeta({ doc }: { doc: Document }) {
  const { t } = useTranslation();
  if (doc.maxAgeDays === null || doc.maxAgeDays === undefined) return null;
  return <span className="memo__dim"> · {t('route.maxAge', { days: doc.maxAgeDays })}</span>;
}

function MemoBlockTitle({ icon, text }: { icon: string; text: string }) {
  return (
    <p className="memo__block-title">
      <span aria-hidden="true">{icon}</span> {text}
    </p>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/**
 * Перше речення тексту; трикрапка показує, що це скорочення, а не весь текст.
 *
 * Наївний пошук крапки різав на «§32 ods. 2» і «Z. z.» — у словацьких
 * посиланнях на закон крапка стоїть у скороченні, а не в кінці думки.
 * Тому кінцем речення вважається крапка, після якої йде велика літера.
 */
const ABBREVIATIONS = /\b(?:ods|písm|č|bod|Z|z|zb|napr|resp|tzv|s|str)\.$/i;

/**
 * Обрізає до потрібної довжини по межі слова.
 *
 * Потрібне саме тут, а не в CSS: картки фактів стоять у сітці 1/4 ширини,
 * і довга норма на кшталт §33 ods. 8 переносилася на п'ятнадцять рядків,
 * задираючи висоту всього ряду і виштовхуючи пам'ятку на другий аркуш.
 * Обрізання видиме (трикрапка), повний текст — на сторінці маршруту.
 */
function clamp(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxChars).replace(/[,;:·]$/, '')} …`;
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  for (const match of trimmed.matchAll(/[.!?](?=\s|$)/g)) {
    const end = match.index + 1;
    const head = trimmed.slice(0, end);
    if (ABBREVIATIONS.test(head)) continue;
    const rest = trimmed.slice(end).trim();
    // Крапка всередині «§33 ods. 2 і 3).» — далі йде не нове речення.
    if (rest.length > 0 && !/^[«"(]?[A-ZА-ЯЇІЄҐŠČŤŽÁÉÍÓÚÝĎĹŇŔ]/.test(rest)) continue;
    return rest.length === 0 ? head : `${head} …`;
  }
  return trimmed;
}
