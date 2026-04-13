# Code AI – Chrome Extension

> Your AI-powered coding assistant. Highlight any code on the web and instantly understand, improve, or translate it.

---

## 🎬 Demo Video

[![Watch Demo](https://img.shields.io/badge/▶%20Watch%20Demo-Click%20Here-purple?style=for-the-badge)](https://youtu.be/WvEIkqgWdkc)

> _Replace the link above with your actual demo video URL (YouTube, Loom, etc.)_

---

## What does this do?

Ever landed on a piece of code online and had no idea what it does?

**Code AI** is a Chrome browser extension that lets you highlight any code snippet on any website — GitHub, Stack Overflow, documentation pages, blogs — and ask Google's Gemini AI to:

- **Explain** what the code does, step by step
- **Review** it for bugs, issues, and improvements
- **Convert** it to a different programming language

No copy-pasting into ChatGPT. No tab switching. Just highlight and click.

---

## Key Features

- 🔍 **Explain Code** — Get a plain-English breakdown of any code snippet
- ✅ **Review Code** — Find bugs, security issues, and get improvement suggestions with a score out of 10
- 🔄 **Convert Code** — Translate code into Python, JavaScript, Java, Go, Rust, and 8 more languages
- 🖱️ **Right-click shortcut** — Select code, right-click, and choose "Explain with Code AI ✨"
- 🔔 **Badge notification** — A `!` badge appears on the extension icon so you know when it's ready
- 📋 **Copy response** — Copy the AI's answer with one click
- 🌑 **Clean dark UI** — Easy on the eyes, built for developers

---

## Tech Stack

| What | Technology used |
|---|---|
| Browser extension | Google Chrome (Manifest V3) |
| AI model | Google Gemini 2.0 Flash |
| Language | HTML, CSS, JavaScript |
| Key setup script | Python 3 |

---

## Project Structure

```
chrome-extension/
│
├── manifest.json       → Extension settings and permissions
├── background.js       → Handles AI calls and right-click menu
├── content.js          → Reads selected text from the webpage
│
├── popup.html          → The popup window you see when clicking the icon
├── popup.css           → Styling for the popup
├── popup.js            → Logic for the popup (tabs, buttons, results)
│
├── options.html        → Settings page
├── options.css         → Styling for the settings page
├── options.js          → Checks if your API key is loaded
│
├── config.js           → ⚙️ Your API key lives here (auto-generated)
├── inject_key.py       → One-time script to load your key from .env into config.js
├── generate_icons.py   → Creates the extension icons
│
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Configuration — Setting up your API Key

The extension needs a free Google Gemini API key to work.  
The key is stored in **`config.js`** — a small file in the extension folder.

> You never type your key into the browser. It's loaded automatically from your `.env` file.

### Step 1 — Get a free API key

Go to 👉 [Google AI Studio](https://aistudio.google.com/app/apikey) and create a free API key.  
It will look like: `AIzaSyABC123...`

### Step 2 — Add the key to your `.env` file

Open the file `Project3/.env` and make sure this line is there:

```
GEMINI_API_KEY=AIzaSy...your-key-here
```

### Step 3 — Run the setup script

Open a terminal, go into the `chrome-extension` folder and run:

```bash
python inject_key.py
```

This reads the key from `.env` and writes it into `config.js`.  
You'll see: `OK  config.js written  (key: AIzaSyBS...)`

### Step 4 — Reload the extension

Open Chrome → go to `chrome://extensions` → find **Code AI** → click the **reload ↺** button.

That's it! Your key is now active.

> **Note:** If you ever change your API key in `.env`, just re-run `python inject_key.py` and reload the extension.

---

## Setup & Installation

### What you need
- Google Chrome browser
- Python 3 installed on your computer
- A free Gemini API key (see Configuration above)

### Install steps

**1. Download the extension folder**

Make sure you have the `chrome-extension/` folder on your computer.

**2. Set up your API key**

Follow the 4 steps in the **Configuration** section above.

**3. Load the extension into Chrome**

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** using the toggle in the top-right corner
3. Click **Load unpacked**
4. Select the `chrome-extension/` folder
5. The Code AI icon will appear in your Chrome toolbar ✓

---

## How to Use

### Option 1 — Click the toolbar icon

1. Go to any webpage with code (GitHub, Stack Overflow, etc.)
2. **Highlight** the code you want to analyse
3. Click the **Code AI icon** in the Chrome toolbar
4. The popup opens and shows the selected code
5. Pick what you want:
   - **Explain** → understand what it does
   - **Review** → find issues and improvements
   - **Convert** → pick a language and translate the code
6. Click the button and wait a few seconds for the AI response
7. Read the answer — click **Copy** to copy it

### Option 2 — Right-click shortcut

1. **Highlight** any code on a page
2. **Right-click** on the selection
3. Click **"Explain with Code AI ✨"** from the menu
4. The extension saves the code and shows a **`!` badge** on the icon
5. Click the icon — it opens with the code already loaded
6. Choose your mode and click the button

---

## Verify Everything is Working

1. Click the Code AI icon in the toolbar
2. Click the **⚙️ settings** icon (top-right of popup)
3. You'll see a status indicator:
   - 🟢 **"API key loaded"** — you're good to go
   - 🔴 **"No API key found"** — re-run `inject_key.py` and reload the extension

---

## Frequently Asked Questions


**Does it work on all websites?**  
Yes — it works on any webpage where you can highlight text, including GitHub, Stack Overflow, MDN, and documentation sites.

**Is my API key safe?**  
Your key is stored locally in `config.js` on your own computer and is only sent to Google's servers when you make a request. It is never shared with anyone else.

**Can I use it without highlighting code?**  
No — you need to highlight a code snippet first before opening the extension.

**What languages can it convert to?**  
Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust, Swift, Kotlin, Ruby, PHP.

---
