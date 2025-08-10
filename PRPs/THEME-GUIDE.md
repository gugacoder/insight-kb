# Theme Customization Guide

This guide provides instructions on how to customize the visual appearance of the application. By following these steps, you can modify the color scheme, fonts, logos, and other visual elements to match your desired branding.

## 1. Color Palette

The application uses a theming system with support for both light and dark modes. The color palette is defined using CSS custom variables in `client/src/style.css`.

To change the colors, you need to modify the values of the CSS variables within the `:root` (for light theme) and `.dark` (for dark theme) selectors in this file.

### Light Theme

Edit the variables inside the `:root` selector in `client/src/style.css`:

```css
:root {
  --white: #fff;
  --black: #000;
  --gray-20: #ececf1;
  /* ... more colors */
  --brand-purple: #ab68ff;
  /* ... more colors */
}

html {
  --brand-purple: #ab68ff;
  --presentation: var(--white);
  --text-primary: var(--gray-800);
  /* ... more theme variables */
}
```

### Dark Theme

Edit the variables inside the `.dark` selector in `client/src/style.css`:

```css
.dark {
  --brand-purple: #ab68ff;
  --presentation: var(--gray-800);
  --text-primary: var(--gray-100);
  /* ... more theme variables */
}
```

## 2. Tailwind CSS Configuration

The application uses Tailwind CSS for styling. The configuration file is `client/tailwind.config.cjs`. While most color definitions are in `style.css`, you can customize other aspects of the theme in the `tailwind.config.cjs` file, such as fonts, breakpoints, and spacing.

Example of `client/tailwind.config.cjs`:

```javascript
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    '../packages/client/src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: ['class'],
  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      mono: ['Roboto Mono', 'monospace'],
    },
    extend: {
      colors: {
        'brand-purple': 'var(--brand-purple)',
        // ... other colors that reference css variables
      },
      // ... other theme extensions
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('tailwindcss-radix'),
  ],
};
```

## 3. Fonts

The application uses custom fonts defined in `client/src/style.css` using the `@font-face` rule. The font files are located in the `client/public/fonts` directory (though this directory is not present in the initial project structure, the `@font-face` rules in `style.css` point to it).

To change the fonts, you can:

1.  Add your custom font files to the `client/public/fonts` directory.
2.  Update the `@font-face` rules in `client/src/style.css` to point to your new font files.
3.  Update the `fontFamily` configuration in `client/tailwind.config.cjs` to use your new font families.

The `style.css` file also contains instructions on how to use the proprietary "Söhne" font, which is the default font for ChatGPT.

## 4. Favicons and Logo

The favicons and application logo are located in the `client/public/assets/` directory.

To replace the favicons, you need to replace the following files:

-   `client/public/assets/favicon-32x32.png`
-   `client/public/assets/favicon-16x16.png`
-   `client/public/assets/apple-touch-icon-180x180.png`

The main application logo is `client/public/assets/logo.svg`. You can replace this file with your own logo.

The favicons are linked in the `<head>` of `client/index.html`:

```html
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png" />
<link rel="apple-touch-icon" href="/assets/apple-touch-icon-180x180.png" />
```

The application title can also be changed in `client/index.html`:

```html
<title>LibreChat</title>
```

## 5. Image Assets

Other image assets, such as logos for different AI models and services, are also located in the `client/public/assets/` directory. You can replace these images if needed.

## 6. Custom CSS

For any additional custom styles, you can add them to the `client/src/style.css` file. This file is loaded globally and can be used to override existing styles or add new ones.
