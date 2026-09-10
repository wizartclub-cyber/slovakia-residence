import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { procedures, sourceById } from '../../lib/content';
import type { Faq } from '../../lib/content/schema';

/**
 * Список питань з акордеоном.
 *
 * Кожне питання — справжня <button> з aria-expanded і aria-controls, а не
 * div із onClick: інакше клавіатура і скрінрідер не бачать, що це керування.
 * Розкриття зроблено через grid-template-rows 0fr → 1fr, щоб висота не
 * стрибала і сторінка не смикалася під час анімації.
 */
export function FaqList({
  items,
  lang,
  openIds,
  onToggle,
  headingLevel = 3,
}: {
  items: Faq[];
  lang: string | undefined;
  openIds: Set<string>;
  onToggle: (id: string) => void;
  headingLevel?: 3 | 4;
}) {
  return (
    <ul className="faq-list">
      {items.map((item) => (
        <FaqItem
          headingLevel={headingLevel}
          item={item}
          key={item.id}
          lang={lang}
          onToggle={onToggle}
          open={openIds.has(item.id)}
        />
      ))}
    </ul>
  );
}

function FaqItem({
  item,
  lang,
  open,
  onToggle,
  headingLevel,
}: {
  item: Faq;
  lang: string | undefined;
  open: boolean;
  onToggle: (id: string) => void;
  headingLevel: 3 | 4;
}) {
  const { t } = useTranslation();
  const local = (value: { uk: string; sk: string }) => (lang === 'sk' ? value.sk : value.uk);
  // Не useId(): він повертає ідентифікатори з двокрапками, і такий id
  // не можна використати в CSS-селекторі без екранування. Тут id і так
  // унікальний — це id самого питання.
  const panelId = `panel-${item.id}`;
  const headingRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const Heading = headingLevel === 3 ? 'h3' : 'h4';

  // Пряме посилання з hash має не лише розкрити відповідь, а й перевести на неї
  // фокус — інакше людина з клавіатурою опиняється на початку сторінки.
  const deepLinked = useRef(false);
  useEffect(() => {
    // Один раз на монтуванні: далі hash міняє вже сам користувач, і
    // повторне розкриття перебивало б його вибір.
    if (deepLinked.current) return;
    deepLinked.current = true;
    if (window.location.hash.slice(1) !== item.id) return;
    if (!open) onToggle(item.id);
    headingRef.current?.focus();
  }, [item.id, open, onToggle]);

  const routes = (item.routeIds ?? [])
    .map((id) => procedures.find((p) => p.id === id))
    .filter((p) => p !== undefined);
  const sources = item.sourceIds.map((id) => sourceById(id)).filter((s) => s !== undefined);

  function copyLink(): void {
    const url = `${window.location.origin}${window.location.pathname}#${item.id}`;
    history.replaceState(null, '', `#${item.id}`);
    void navigator.clipboard?.writeText(url).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  }

  return (
    <li className="faq-item" id={item.id}>
      <Heading className="faq-item__heading">
        <button
          aria-controls={panelId}
          aria-expanded={open}
          className="faq-item__button"
          onClick={() => onToggle(item.id)}
          ref={headingRef}
          type="button"
        >
          <span>{local(item.question)}</span>
          <span aria-hidden="true" className="faq-item__chevron" data-open={open} />
        </button>
      </Heading>

      <div className="faq-item__panel" data-open={open} id={panelId} role="region">
        <div className="faq-item__panel-inner">
          <p>{local(item.shortAnswer)}</p>

          {item.meansForYou && (
            <p className="faq-item__means">
              <strong>{t('faq.meansForYou')}:</strong> {local(item.meansForYou)}
            </p>
          )}

          {(item.steps ?? []).length > 0 && (
            <ol className="faq-item__steps">
              {(item.steps ?? []).map((step) => (
                <li key={step.uk}>{local(step)}</li>
              ))}
            </ol>
          )}

          {item.caveat && (
            <p className="faq-item__caveat">
              <strong>{t('faq.caveat')}:</strong> {local(item.caveat)}
            </p>
          )}

          <dl className="faq-item__meta">
            {item.legalBasis.length > 0 && (
              <div>
                <dt>{t('faq.legalBasis')}</dt>
                <dd>{item.legalBasis.join(' · ')}</dd>
              </div>
            )}
            <div>
              <dt>{t('faq.sources')}</dt>
              <dd>
                {sources.map((source, i) => (
                  <span key={source.id}>
                    {i > 0 && ' · '}
                    <Link to={`/${lang}/sources#${source.id}`}>{source.title}</Link>
                  </span>
                ))}
              </dd>
            </div>
            {item.reviewedAt && (
              <div>
                <dt>{t('sources.checkedAt')}</dt>
                <dd>{formatDate(item.reviewedAt)}</dd>
              </div>
            )}
          </dl>

          {routes.length > 0 && (
            <p className="faq-item__routes">
              <strong>{t('faq.relatedRoutes')}:</strong>{' '}
              {routes.map((route, i) => (
                <span key={route.id}>
                  {i > 0 && ' · '}
                  <Link to={`/${lang}/route/${route.id}`}>
                    {lang === 'sk' ? route.title.sk : route.title.uk}
                  </Link>
                </span>
              ))}
            </p>
          )}

          <p>
            <button className="faq-item__copy" onClick={copyLink} type="button">
              {copied ? t('faq.copied') : t('faq.copyLink')}
            </button>
          </p>
        </div>
      </div>
    </li>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
