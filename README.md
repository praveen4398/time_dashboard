# ⏱️ Time Dashboard & Stop Watch

A premium, interactive web-based Time Tracking & Habit Visualization dashboard. This application combines a precision stopwatch with a 30-day habit matrix, helping you build consistency, track focus hours, and visualize daily productivity with a sleek, modern glassmorphic interface.

![Aesthetic Dark Theme](https://img.shields.io/badge/Aesthetics-Dark%20Mode-blueviolet?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Tech%20Stack-HTML%20%7C%20CSS%20%7C%20JS-gold?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)

---

## ✨ Features

### ⏱️ Precision Stopwatch
*   **Intuitive Controls:** Start, pause, resume, and reset.
*   **Dynamic Visual Ring:** An animated SVG progress ring rotates gracefully, tracking the seconds visually.
*   **Lap Recorder:** Capture precise interval splits and review them under the **Laps** tab.
*   **Session Archiver:** Save tracked focus sessions to your local **History** with custom timestamps.

### 📅 30-Day Visualization Board
*   **Interactive Habit Grid:** A monthly grid displaying focus blocks color-coded by performance thresholds.
*   **Custom Thresholds:**
    *   🔴 **Uncompleted (Red):** Less than 1 hour of focus.
    *   🟡 **Partially Completed (Yellow):** Between 1 and 3 hours of focus.
    *   🟢 **Completed (Green):** 3 or more hours of focus.
*   **Interactive Drawer Panel:** Click on any day to log details, add manual focus hours, change the day's completion state, and write down notes or daily achievements.
*   **Hover Tooltips:** Get a quick summary of any day's focus duration and logs just by hovering over its grid block.

### 📊 Weekly Focus Sparkline Chart
*   Displays a dynamic bar chart showcasing your weekly focus trends to help you monitor short-term momentum.

### 💾 Local Persistence
*   All data is stored directly in your browser's `localStorage`. Your stopwatch state, lap logs, session history, and daily tracking entries persist across page reloads.

---

## 🛠️ Technology Stack
*   **Structure:** HTML5 (Semantic elements)
*   **Styling:** Modern Vanilla CSS (Featuring HSL variables, fluid glassmorphism, flexbox/grid layout, and custom scrollbars)
*   **Icons:** Lucide Icons (Rendered dynamically)
*   **Typography:** Google Fonts (*Outfit* for general UI, *JetBrains Mono* for the digital timer readout)
*   **Logic:** Pure Vanilla JavaScript (Zero external dependencies or frameworks)

---

## 🚀 Getting Started

Since this is a client-side web application, it runs entirely in the browser with no build step required.

### Quick Start
1.  **Clone or download** this repository.
2.  Open the directory in your terminal.
3.  Serve the application locally (recommended to avoid browser caching or CORS issues on resources):
    *   **If you have Node.js installed:**
        ```bash
        npx serve
        ```
    *   **If you have Python installed:**
        ```bash
        python -m http.server 8000
        ```
4.  Open the local address (e.g. `http://localhost:3000` or `http://localhost:8000`) in your web browser.

---

## 📁 Project Structure

```
stop-watch/
├── index.html   # Main dashboard markup and structures
├── style.css    # Clean dark-mode styles, layout grids, and animations
├── app.js       # App state, stopwatch logic, and local storage binding
└── README.md    # Documentation (you are here)
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
