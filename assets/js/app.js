const timezoneSelect = document.getElementById("timezone-select");
const formatToggle = document.getElementById("format-toggle");
const activeZone = document.getElementById("active-zone");
const digitalTime = document.getElementById("digital-time");
const fullDate = document.getElementById("full-date");
const greeting = document.getElementById("greeting");

const hourHand = document.getElementById("hour-hand");
const minuteHand = document.getElementById("minute-hand");
const secondHand = document.getElementById("second-hand");
const clockTicks = document.getElementById("clock-ticks");

const worldClockList = document.getElementById("world-clock-list");

const stopwatchDisplay = document.getElementById("stopwatch-display");
const stopwatchStart = document.getElementById("stopwatch-start");
const stopwatchStop = document.getElementById("stopwatch-stop");
const stopwatchReset = document.getElementById("stopwatch-reset");

const timerMinutesInput = document.getElementById("timer-minutes");
const timerSecondsInput = document.getElementById("timer-seconds");
const timerDisplay = document.getElementById("timer-display");
const timerStatus = document.getElementById("timer-status");
const timerStart = document.getElementById("timer-start");
const timerStop = document.getElementById("timer-stop");
const timerReset = document.getElementById("timer-reset");

const worldClockZones = [
    { label: "New York", zone: "America/New_York" },
    { label: "London", zone: "Europe/London" },
    { label: "Mumbai", zone: "Asia/Kolkata" },
    { label: "Tokyo", zone: "Asia/Tokyo" },
    { label: "Sydney", zone: "Australia/Sydney" }
];

let selectedZone = "local";
let use24Hour = true;

let stopwatchElapsed = 0;
let stopwatchStartStamp = 0;
let stopwatchIntervalId = null;

let timerRemainingMs = 0;
let timerEndStamp = 0;
let timerIntervalId = null;

function addClockTicks() {
    for (let i = 0; i < 60; i += 1) {
        const tick = document.createElement("span");
        tick.className = i % 5 === 0 ? "tick major" : "tick";
        tick.style.setProperty("--rotation", `${i * 6}deg`);
        clockTicks.appendChild(tick);
    }
}

function withZone(optionSet, zone) {
    if (zone === "local") {
        return optionSet;
    }

    return { ...optionSet, timeZone: zone };
}

function getTimeParts(now, zone) {
    const formatter = new Intl.DateTimeFormat(
        "en-US",
        withZone(
            {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            },
            zone
        )
    );

    const parts = formatter.formatToParts(now);
    const map = {};

    for (const item of parts) {
        if (item.type !== "literal") {
            map[item.type] = item.value;
        }
    }

    return {
        hour: Number(map.hour),
        minute: Number(map.minute),
        second: Number(map.second)
    };
}

function getGreetingByHour(hour) {
    if (hour < 5) {
        return "Burning midnight oil.";
    }

    if (hour < 12) {
        return "Good morning. Start strong.";
    }

    if (hour < 17) {
        return "Good afternoon. Keep the momentum.";
    }

    if (hour < 21) {
        return "Good evening. Finish with focus.";
    }

    return "Night mode energy.";
}

function formatMainTime(now, zone) {
    const formatter = new Intl.DateTimeFormat(
        "en-US",
        withZone(
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: !use24Hour
            },
            zone
        )
    );

    return formatter.format(now);
}

function formatMainDate(now, zone) {
    const formatter = new Intl.DateTimeFormat(
        "en-US",
        withZone(
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            },
            zone
        )
    );

    return formatter.format(now);
}

function updateMainClock(now) {
    const parts = getTimeParts(now, selectedZone);

    digitalTime.textContent = formatMainTime(now, selectedZone);
    fullDate.textContent = formatMainDate(now, selectedZone);
    greeting.textContent = getGreetingByHour(parts.hour);
}

function updateActiveZoneLabel() {
    const selectedText = timezoneSelect.options[timezoneSelect.selectedIndex].text;
    activeZone.textContent = selectedText;
}

function updateAnalog(now) {
    const parts = getTimeParts(now, selectedZone);
    const second = parts.second + now.getMilliseconds() / 1000;
    const minute = parts.minute + second / 60;
    const hour = (parts.hour % 12) + minute / 60;

    hourHand.style.transform = `translateX(-50%) rotate(${hour * 30}deg)`;
    minuteHand.style.transform = `translateX(-50%) rotate(${minute * 6}deg)`;
    secondHand.style.transform = `translateX(-50%) rotate(${second * 6}deg)`;
}

function renderWorldClockRows() {
    worldClockList.innerHTML = "";

    for (const city of worldClockZones) {
        const item = document.createElement("li");
        item.className = "world-clock-item";

        const cityName = document.createElement("span");
        cityName.className = "city-name";
        cityName.textContent = city.label;

        const cityTime = document.createElement("span");
        cityTime.className = "city-time";
        cityTime.dataset.zone = city.zone;
        cityTime.textContent = "--:--:--";

        item.append(cityName, cityTime);
        worldClockList.appendChild(item);
    }
}

function updateWorldClocks(now) {
    const times = worldClockList.querySelectorAll(".city-time");

    for (const cityTime of times) {
        const zone = cityTime.dataset.zone;

        cityTime.textContent = new Intl.DateTimeFormat(
            "en-US",
            withZone(
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: !use24Hour
                },
                zone
            )
        ).format(now);
    }
}

function updateClockSuite() {
    const now = new Date();

    updateMainClock(now);
    updateAnalog(now);
    updateWorldClocks(now);
}

function formatStopwatch(ms) {
    const tenths = Math.floor(ms / 100);
    const hours = Math.floor(tenths / 36000);
    const minutes = Math.floor((tenths % 36000) / 600);
    const seconds = Math.floor((tenths % 600) / 10);
    const deciseconds = tenths % 10;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${deciseconds}`;
}

function renderStopwatch() {
    stopwatchDisplay.textContent = formatStopwatch(stopwatchElapsed);
}

function tickStopwatch() {
    stopwatchElapsed = performance.now() - stopwatchStartStamp;
    renderStopwatch();
}

function startStopwatch() {
    if (stopwatchIntervalId !== null) {
        return;
    }

    stopwatchStartStamp = performance.now() - stopwatchElapsed;
    stopwatchIntervalId = window.setInterval(tickStopwatch, 80);
}

function pauseStopwatch() {
    if (stopwatchIntervalId === null) {
        return;
    }

    window.clearInterval(stopwatchIntervalId);
    stopwatchIntervalId = null;
}

function resetStopwatch() {
    pauseStopwatch();
    stopwatchElapsed = 0;
    renderStopwatch();
}

function sanitizeTimerInputs() {
    const minValue = Math.min(Math.max(Number(timerMinutesInput.value) || 0, 0), 999);
    const secValue = Math.min(Math.max(Number(timerSecondsInput.value) || 0, 0), 59);

    timerMinutesInput.value = String(minValue);
    timerSecondsInput.value = String(secValue);
}

function timerMsFromInputs() {
    sanitizeTimerInputs();

    const minutes = Number(timerMinutesInput.value) || 0;
    const seconds = Number(timerSecondsInput.value) || 0;

    return (minutes * 60 + seconds) * 1000;
}

function formatTimer(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderTimer() {
    timerDisplay.textContent = formatTimer(timerRemainingMs);
}

function stopTimer() {
    if (timerIntervalId !== null) {
        window.clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
}

function tickTimer() {
    timerRemainingMs = Math.max(0, timerEndStamp - Date.now());
    renderTimer();

    if (timerRemainingMs === 0) {
        stopTimer();
        timerStatus.textContent = "Time is up.";
        timerDisplay.classList.add("pulse");
        window.setTimeout(() => timerDisplay.classList.remove("pulse"), 1400);
    }
}

function startTimer() {
    if (timerIntervalId !== null) {
        return;
    }

    if (timerRemainingMs <= 0) {
        timerRemainingMs = timerMsFromInputs();
    }

    if (timerRemainingMs <= 0) {
        timerStatus.textContent = "Set a duration greater than 00:00.";
        return;
    }

    timerEndStamp = Date.now() + timerRemainingMs;
    timerStatus.textContent = "Countdown running.";
    timerIntervalId = window.setInterval(tickTimer, 120);
}

function pauseTimer() {
    if (timerIntervalId === null) {
        return;
    }

    stopTimer();
    timerRemainingMs = Math.max(0, timerEndStamp - Date.now());
    renderTimer();
    timerStatus.textContent = "Paused.";
}

function resetTimer() {
    stopTimer();
    timerRemainingMs = timerMsFromInputs();
    renderTimer();
    timerStatus.textContent = "Ready.";
}

function updateToggleLabel() {
    formatToggle.textContent = use24Hour ? "Switch to 12-Hour" : "Switch to 24-Hour";
    formatToggle.setAttribute("aria-pressed", String(!use24Hour));
}

function wireEvents() {
    timezoneSelect.addEventListener("change", () => {
        selectedZone = timezoneSelect.value;
        updateActiveZoneLabel();
        updateClockSuite();
    });

    formatToggle.addEventListener("click", () => {
        use24Hour = !use24Hour;
        updateToggleLabel();
        updateClockSuite();
    });

    stopwatchStart.addEventListener("click", startStopwatch);
    stopwatchStop.addEventListener("click", pauseStopwatch);
    stopwatchReset.addEventListener("click", resetStopwatch);

    timerStart.addEventListener("click", startTimer);
    timerStop.addEventListener("click", pauseTimer);
    timerReset.addEventListener("click", resetTimer);

    timerMinutesInput.addEventListener("change", () => {
        if (timerIntervalId === null) {
            resetTimer();
        }
    });

    timerSecondsInput.addEventListener("change", () => {
        if (timerIntervalId === null) {
            resetTimer();
        }
    });
}

function init() {
    addClockTicks();
    renderWorldClockRows();
    updateActiveZoneLabel();
    updateToggleLabel();

    timerRemainingMs = timerMsFromInputs();
    renderTimer();
    renderStopwatch();

    updateClockSuite();
    window.setInterval(updateClockSuite, 250);

    wireEvents();
}

init();
