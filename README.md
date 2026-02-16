# Chronoscape Clock Suite

Chronoscape is a modern, single-page clock dashboard built with vanilla HTML, CSS, and JavaScript. It combines a live digital clock, analog clock, world clocks, stopwatch, and countdown timer in a responsive UI.

## Highlights
- Timezone-aware primary clock (`Local`, `UTC`, and major regions).
- 12-hour / 24-hour display toggle.
- Live date and context greeting based on selected timezone.
- Animated analog clock with generated tick marks.
- Built-in world clock panel.
- Stopwatch with start, pause, and reset.
- Countdown timer with validation and status feedback.
- Responsive, production-style asset structure.

## Tech Stack
- HTML5
- CSS3 (custom properties, responsive grid, animation)
- Vanilla JavaScript (DOM APIs + `Intl.DateTimeFormat`)

## Project Structure
```text
Clock-webapp/
├── index.html
├── README.md
└── assets/
    ├── css/
    │   └── style.css
    ├── images/
    │   └── bg.jpeg
    └── js/
        └── app.js
```

## Getting Started
1. Clone or download this repository.
2. Open `index.html` directly in a modern browser.

No bundler, package manager, or build step is required.

## Customization
- Update theme variables in `assets/css/style.css` under `:root`.
- Add/remove timezone options in `index.html` (`#timezone-select`).
- Change world-clock cities in `assets/js/app.js` (`worldClockZones`).

## Roadmap
- Persistent preferences via `localStorage`.
- Alarm support with notification sound.
- Keyboard shortcuts for timer/stopwatch controls.

## License
No license file is currently included. Add a `LICENSE` file (for example, MIT) if you plan to distribute this publicly.
