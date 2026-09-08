import { useTranslation } from 'react-i18next';
import { site } from '../lib/content/site';

// Рядок «стан права» — spec §2 вимагає показувати дату baseline на видному місці.
export function LegalBaselineNotice() {
  const { t } = useTranslation();
  const { date, reviewCompleted } = site.legalBaseline;

  return (
    <div className="baseline" role="note">
      <span>
        {t('baseline.label')}: <span className="baseline__date">{formatDate(date)}</span>
      </span>
      <span className={`badge badge--${reviewCompleted ? 'success' : 'warning'}`}>
        {reviewCompleted ? t('baseline.reviewDone') : t('baseline.reviewPending')}
      </span>
      <span>{t('baseline.warning')}</span>
    </div>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
