import { useDeferredValue, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../app/usePageTitle';
import { faq, publishedFaq } from '../../lib/content';
import type { Faq } from '../../lib/content/schema';
import { FaqList } from './FaqList';
import './faq.css';

const CATEGORIES = ['start', 'finance', 'rules', 'after'] as const;

/** Пошук має пробачати регістр і діакритику: «zilina» і «Žilina» — те саме. */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}

function haystack(item: Faq, lang: string | undefined): string {
  const pick = (v: { uk: string; sk: string } | null | undefined) =>
    v ? (lang === 'sk' ? v.sk : v.uk) : '';
  return fold(
    [
      pick(item.question),
      pick(item.shortAnswer),
      pick(item.meansForYou),
      pick(item.caveat),
      ...(item.tags ?? []),
      ...item.legalBasis,
    ].join(' '),
  );
}

export function FaqPage() {
  const { t } = useTranslation();
  const { lang } = useParams();
  usePageTitle(t('faq.title'));

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | (typeof CATEGORIES)[number]>('all');
  // useDeferredValue замість debounce: список маленький, а введення лишається
  // плавним без таймерів, які довелося б прибирати за собою.
  const deferred = useDeferredValue(query);
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(publishedFaq.filter((item) => item.popular).slice(0, 2).map((item) => item.id)),
  );

  const needle = fold(deferred.trim());
  const visible = useMemo(
    () =>
      publishedFaq.filter(
        (item) =>
          (category === 'all' || item.category === category) &&
          (needle.length < 2 || haystack(item, lang).includes(needle)),
      ),
    [category, needle, lang],
  );

  const draftCount = faq.length - publishedFaq.length;

  function toggle(id: string): void {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <h1 tabIndex={-1}>{t('faq.title')}</h1>
      <p>{t('faq.intro')}</p>
      <div className="route-page__warning">{t('faq.disclaimer')}</div>

      <div className="faq-controls">
        <label className="faq-search" htmlFor="faq-search">
          {t('faq.searchLabel')}
        </label>
        <input
          autoComplete="off"
          id="faq-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('faq.searchPlaceholder')}
          type="search"
          value={query}
        />

        <div aria-label={t('faq.filterLabel')} className="faq-filters" role="group">
          <FilterButton active={category === 'all'} onClick={() => setCategory('all')}>
            {t('faq.category.all')}
          </FilterButton>
          {CATEGORIES.map((key) => (
            <FilterButton active={category === key} key={key} onClick={() => setCategory(key)}>
              {t(`faq.category.${key}`)}
            </FilterButton>
          ))}
        </div>

        <p className="route-page__note" role="status">
          {t('faq.found', { count: visible.length })}
        </p>
      </div>

      {visible.length === 0 ? (
        <p className="route-page__missing">{t('faq.nothingFound')}</p>
      ) : (
        <FaqList items={visible} lang={lang} onToggle={toggle} openIds={openIds} />
      )}

      {/* JSON-LD лише для питань, які справді видимі на сторінці (ТЗ §3.5):
          розмітка не має обіцяти пошуковику того, чого людина тут не побачить. */}
      <script
        dangerouslySetInnerHTML={{ __html: faqJsonLd(visible, lang) }}
        type="application/ld+json"
      />

      {draftCount > 0 && (
        <p className="route-page__note faq-drafts">{t('faq.drafts', { count: draftCount })}</p>
      )}
    </>
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

function faqJsonLd(items: Faq[], lang: string | undefined): string {
  const pick = (v: { uk: string; sk: string }) => (lang === 'sk' ? v.sk : v.uk);
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: pick(item.question),
      acceptedAnswer: { '@type': 'Answer', text: pick(item.shortAnswer) },
    })),
  });
}
