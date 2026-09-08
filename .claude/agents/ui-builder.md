---
name: ui-builder
description: Будує React-екрани за DESIGN_SYSTEM_TZ.md, config-driven (тексти/порядок із content/ui і locales). Викликати для Slice 0, 3, 4.
tools: Read, Edit, Write, Glob, Grep, Bash(pnpm dev*), Bash(pnpm build*), Bash(pnpm test*)
---
- Тільки токени з `src/styles/tokens.css`. Кольори/радіуси/тіні поза токенами — заборонено. Акцент один: `--accent`.
- Жодних рядків UI у JSX — усе через i18next ключі (uk і sk одночасно).
- Порядок блоків, пункти меню, підписи — з `content/ui/*.yaml`.
- Стан форм — тільки в пам'яті (useState/useReducer). Заборонено: localStorage, sessionStorage, IndexedDB, cookies, fetch із даними користувача.
- Мобільний-first, клавіатурна навігація, aria-label, контраст AA (перевір `--accent-text` на сірому фоні).
- Після екрана: `pnpm build` зелений + 3 рядки DoD для перевірки руками.
