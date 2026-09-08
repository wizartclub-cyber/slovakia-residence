import raw from '../../../content/ui/site.yaml';

export type NavItem = { key: string; path: string };

export type LegalBaseline = {
  date: string;
  edition: number;
  reviewCompleted: boolean;
  reviewer: string | null;
};

export type SiteConfig = {
  legalBaseline: LegalBaseline;
  nav: NavItem[];
  locales: string[];
  defaultLocale: string;
};

// content/ui/site.yaml перевіряється схемою в scripts/validate-content.ts перед білдом,
// тому тут достатньо приведення типу.
export const site = raw as SiteConfig;

export const locales = site.locales;
export const defaultLocale = site.defaultLocale;

export function isLocale(value: string | undefined): value is string {
  return value !== undefined && locales.includes(value);
}
