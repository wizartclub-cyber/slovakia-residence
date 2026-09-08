import { useTranslation } from 'react-i18next';
import type { FinderConfig } from '../../lib/content/schema';

type Step = FinderConfig['steps'][number];

// Радіокнопки, а не «плитки з onClick»: так працює клавіатура (стрілки),
// і скрінрідер оголошує групу як вибір одного з варіантів (WCAG 2.2).
export function QuestionStep({
  step,
  value,
  onChange,
}: {
  step: Step;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const { t } = useTranslation();

  return (
    <fieldset className="question">
      <legend className="question__legend">{t(`finder.q.${step.id}`)}</legend>

      <div className="question__options">
        {step.options.map((option) => (
          <label
            key={option}
            className={`option${value === option ? ' option--selected' : ''}`}
            htmlFor={`${step.id}-${option}`}
          >
            <input
              type="radio"
              id={`${step.id}-${option}`}
              name={step.id}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <span>{t(`answer.${step.field}.${option}`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
