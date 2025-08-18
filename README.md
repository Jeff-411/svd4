# See Vivaldi

## Description

**See Vivaldi** enhances visual accessibility for some panels and internal Vivaldi pages.

**Repository**: https://github.com/Jeff-411/svd3

## Scope

1. This project is being developed to meet the needs of one specific client with a specific visual disability, and specific UX requirements.
2. The client is working in a Windows 10/11 OS.
3. Vivaldi is the client's default browser.

## Code Injection

1. **CSS**:
   - `scss/main.css` compiles to `main.css`
   - Once the Steps in [Setup CSS](#setup-css) have been completed, `main.css` is read by **Vivaldi's custom CSS feature** and injected into the Vivaldi DOM.
2. **JavaScript**:
   - Once the Steps in [Setup JavaScript](#setup-javascript) have been completed, the `npm run build` script injects the code in the `src/scripts/` folder.
   - The code in the `scripts/update-handler/` folder auto-detects Vivaldi updates and re-injects the custom JavaScript. See the `docs/update-handler-v1` folder for setup and usage details.

## Usage

### Setup

#### Setup CSS

1. Open Vivaldi and type "**vivaldi://experiments**" (without the quotes) into the search bar.
2. Hit the &lt;enter&gt; key and select the "**Allow CSS modifications**" option.
3. Open "**Settings**" (ctrl + F12) and select the "**Appearance**" menu item.
4. Scroll down to the "**CUSTOM UI MODIFICATIONS**" section and
   1. Click the "**Select Folder...**" button
   2. Navigate the tree until you can see your project folder
   3. Click your project folder to select it
   4. Click the "**Select Folder**" button.
5. Restart Vivaldi to apply the custom css.

#### Setup JavaScript

1. Close Vivaldi
2. Setup auto-detection and handling of Vivaldi updates
   - Copy `scripts/start-vivaldi-monitor.bat` to `"C:\Users\johnj\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\start-vivaldi-monitor.bat"`
3. Run: `npm run build` to inject the custom JavaScript
4. Restart Vivaldi to apply the custom JavaScript.

### Open DevTools for internal pages

To access **DevTools** for Vivaldi's internal pages:

1. Type `vivaldi:history` in Vivaldi's URL bar, and
2. Press `crtl + shift + J`.

This will open a new **DevTools Window** that provides unfiltered access to all UI elements, including internal pages.

### Run SCSS

To start auto-compiling `src/scss/main.scss` to `main.css` run:

```bash
sass --watch src/scss/main.scss main.css --no-source-map
```

Local alias: `sav`
