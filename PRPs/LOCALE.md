# LibreChat Localization Guide

This guide explains how to add new languages to LibreChat's localization system.

## File Structure

The localization files are located in the `client/src/locales` directory. Each language has its own subdirectory, which contains a `translation.json` file.

```
client/src/locales/
├───en/
│   └───translation.json
├───fr/
│   └───translation.json
└───...
```

The main i18n configuration file is `client/src/locales/i18n.ts`.

## i18n Framework

LibreChat uses `i18next` and `react-i18next` for internationalization.

## Adding a New Language

To add a new language to LibreChat, follow these steps:

### 1. Update the Language Selector Component

Edit `client/src/components/Nav/SettingsTabs/General/General.tsx` and add your new language option to the `languageOptions` array:

```typescript
{ value: 'language-code', label: localize('com_nav_lang_language_name') },
```

**Example:**

```typescript
{ value: 'pt-BR', label: localize('com_nav_lang_portuguese_br') },
```

**Note:** Use the appropriate language code format:

*   Use simple codes (e.g., `fr`) for languages without regional variants.
*   Use region-specific codes (e.g., `pt-BR`) when needed.

### 2. Add Localization Keys

In `client/src/locales/en/translation.json`, add the corresponding localization key for your language label:

```json
"com_nav_lang_language_name": "Native Language Name",
```

**Example:**

```json
"com_nav_lang_portuguese_br": "Português (Brasil)",
```

**Best Practice:** Use the native language name as the value.

### 3. Create the Translation File

Create a new directory and translation file:

```bash
mkdir -p client/src/locales/[language-code]
```

Create `client/src/locales/[language-code]/translation.json` with an empty JSON object:

```json
{}
```

**Example:**

```bash
mkdir -p client/src/locales/pt-BR
```

```json
// client/src/locales/pt-BR/translation.json
{}
```

### 4. Configure i18n

Update `client/src/locales/i18n.ts`:

1.  Import the new translation file:

```typescript
import translationLanguageCode from './language-code/translation.json';
```

2.  Add it to the `resources` object:

```typescript
export const resources = {
  // ... existing languages
  'language-code': { translation: translationLanguageCode },
} as const;
```

**Example:**

```typescript
import translationPt_BR from './pt-BR/translation.json';

export const resources = {
  // ... existing languages
  'pt-BR': { translation: translationPt_BR },
} as const;
```

## Modifying Translations

Only the English (`en`) translation file should be manually updated. Other language translations are managed externally. To modify a translation, edit the corresponding key in `client/src/locales/en/translation.json`.

## Using Translations in Code

To use a translation key in a React component, you can use the `useTranslation` hook from `react-i18next`:

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <h1>{t('com_ui_welcome')}</h1>;
}
```
