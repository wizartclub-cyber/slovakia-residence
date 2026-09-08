/**
 * Движок правил: відповіді → перелік маршрутів.
 *
 * Чисті функції, без React (spec §10). Нічого не сортує «за якістю»:
 * ранжувати маршрути як гарантований результат заборонено (spec §8),
 * тому порядок детермінований — за категорією та id.
 */
import type { Procedure } from '../content/schema';
import { publicStatus } from '../content/schema';
import { evaluateCondition, isInForce } from './conditions';
import type { Answers, EligibilityRule, RouteMatch, TransitionRule } from './types';

export function evaluateProcedure(procedure: Procedure, answers: Answers): RouteMatch {
  const rules = procedure.eligibilityRules as unknown as EligibilityRule[];
  const transitions = procedure.transitionRules as unknown as TransitionRule[];

  const status = publicStatus(procedure.reviewStatus);
  const base = {
    procedureId: procedure.id,
    category: procedure.category,
    status,
  };

  // Маршрут, який на цю дату не діяв (або вже не діє), не оцінюємо взагалі:
  // застосовувати сьогоднішні умови до вчорашнього права — помилка.
  if (!isInForce(procedure.validFrom, procedure.validTo, answers.asOfDate)) {
    return {
      ...base,
      outcome: 'not_applicable',
      unresolvedRuleIds: [],
      failedRuleIds: [],
      transitionRuleIds: [],
      sourceIds: procedure.sourceIds,
    };
  }

  const unresolved: string[] = [];
  const failed: string[] = [];
  const usedSources = new Set<string>(procedure.sourceIds);
  let excluded = false;

  for (const rule of rules) {
    const truth = evaluateCondition(rule.when, answers);
    for (const id of rule.sourceIds) usedSources.add(id);

    if (rule.effect === 'exclude') {
      if (truth === 'yes') {
        excluded = true;
        failed.push(rule.id);
      } else if (truth === 'unknown') {
        unresolved.push(rule.id);
      }
      continue;
    }

    if (truth === 'no') failed.push(rule.id);
    else if (truth === 'unknown') unresolved.push(rule.id);
  }

  const transitionRuleIds: string[] = [];
  for (const rule of transitions) {
    if (evaluateCondition(rule.when, answers) === 'yes') {
      transitionRuleIds.push(rule.id);
      for (const id of rule.sourceIds) usedSources.add(id);
    }
  }

  const outcome = excluded
    ? 'excluded'
    : failed.length > 0
      ? 'not_eligible'
      : unresolved.length > 0
        ? 'possible'
        : 'eligible';

  return {
    ...base,
    outcome,
    unresolvedRuleIds: unresolved,
    failedRuleIds: failed,
    transitionRuleIds,
    sourceIds: [...usedSources].sort(),
  };
}

/**
 * Оцінює всі маршрути. Повертає ВСІ результати, включно з тими, що не підходять:
 * інтерфейс сам вирішує, що показати, а що лишити в «інші варіанти».
 */
export function evaluate(procedures: Procedure[], answers: Answers): RouteMatch[] {
  return procedures
    .map((p) => evaluateProcedure(p, answers))
    .sort((a, b) => a.category.localeCompare(b.category) || a.procedureId.localeCompare(b.procedureId));
}

/** Маршрути, які має сенс показати людині першими. */
export function offeredRoutes(matches: RouteMatch[]): RouteMatch[] {
  return matches.filter((m) => m.outcome === 'eligible' || m.outcome === 'possible');
}
