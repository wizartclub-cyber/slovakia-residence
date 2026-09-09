/**
 * Розбір збережених копій законів зі Slov-Lex.
 *
 * Потрібен для гейта, який звіряє посилання в наших даних із текстом закону:
 * якщо в маршруті написано «404/2011 §99», а такої статті немає, білд має впасти.
 * Помилкове посилання на неіснуючу норму — найгірше, що може статися з
 * юридичним довідником, і людина його не помітить.
 */
import { readFileSync } from 'node:fs';

/** Груба конверсія HTML → текст; для пошуку заголовків цього досить. */
export function htmlToText(html: string): string {
  let text = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(p|div|li|tr|td|h[1-6])>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return text.replace(/[ \t ]+/g, ' ').replace(/ *\n */g, '\n');
}

/** Номери статей (§), наявні в тексті закону. */
export function sectionsIn(text: string): Set<string> {
  const found = new Set<string>();
  for (const m of text.matchAll(/§\s?(\d{1,3}[a-z]?)\b/g)) found.add(m[1]!);
  return found;
}

/** Номери позицій тарифу (Položka N), наявні в тексті. */
export function tariffItemsIn(text: string): Set<string> {
  const found = new Set<string>();
  for (const m of text.matchAll(/Položka\s+(\d{1,3})\b/g)) found.add(m[1]!);
  return found;
}

export type Statute = { sections: Set<string>; tariffItems: Set<string> };

export function loadStatute(snapshotPath: string): Statute {
  const text = htmlToText(readFileSync(snapshotPath, 'utf8'));
  return { sections: sectionsIn(text), tariffItems: tariffItemsIn(text) };
}

/**
 * Розбирає посилання виду «404/2011 §23», «404/2011 §33 ods. 8»,
 * «145/1995 položka 24 písm. a) bod 2».
 */
export function parseReference(
  raw: string,
): { law: string; kind: 'section' | 'tariffItem'; value: string } | null {
  const law = /(\d{1,4}\/\d{4})/.exec(raw);
  if (!law) return null;

  const section = /§\s?(\d{1,3}[a-z]?)/.exec(raw);
  if (section) return { law: law[1]!, kind: 'section', value: section[1]! };

  const item = /polo[žz]ka\s+(\d{1,3})/i.exec(raw);
  if (item) return { law: law[1]!, kind: 'tariffItem', value: item[1]! };

  return null;
}
