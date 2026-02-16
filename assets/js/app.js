const STORAGE_KEY = "chronoscape.preferences.v1";
const SLOT_MS = 30 * 60 * 1000;

const timezoneSelect = document.getElementById("timezone-select");
const formatToggle = document.getElementById("format-toggle");
const activeZone = document.getElementById("active-zone");
const themeIndicator = document.getElementById("theme-indicator");
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

const plannerSummary = document.getElementById("planner-summary");
const plannerSlots = document.getElementById("planner-slots");
const plannerDate = document.getElementById("planner-date");
const plannerZoneA = document.getElementById("planner-zone-a");
const plannerZoneB = document.getElementById("planner-zone-b");
const plannerStartA = document.getElementById("planner-start-a");
const plannerEndA = document.getElementById("planner-end-a");
const plannerStartB = document.getElementById("planner-start-b");
const plannerEndB = document.getElementById("planner-end-b");

const worldClockZones = [
    { label: "New York", zone: "America/New_York" },
    { label: "Los Angeles", zone: "America/Los_Angeles" },
    { label: "London", zone: "Europe/London" },
    { label: "Mumbai", zone: "Asia/Kolkata" },
    { label: "Tokyo", zone: "Asia/Tokyo" }
];

let selectedZone = "local";
let use24Hour = true;

let stopwatchElapsed = 0;
let stopwatchStartStamp = 0;
let stopwatchIntervalId = null;

let timerRemainingMs = 0;
let timerEndStamp = 0;
let timerIntervalId = null;

function clampNumber(value, min, max, fallback) {
    const parsed = Number(value);

    if (Number.isNaN(parsed)) {
        return fallback;
    }

    return Math.min(Math.max(parsed, min), max);
}

function optionExists(selectElement, optionValue) {
    return Array.from(selectElement.options).some((option) => option.value === optionValue);
}

function getTodayInputValue() {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

    return localDate.toISOString().slice(0, 10);
}

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

function updateAutoTheme(now) {
    const hour = getTimeParts(now, selectedZone).hour;
    const theme = hour >= 6 && hour < 18 ? "day" : "night";

    document.body.dataset.theme = theme;
    themeIndicator.textContent = `Auto Theme: ${theme === "day" ? "Day" : "Night"}`;
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
    updateAutoTheme(now);
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
    const minValue = clampNumber(timerMinutesInput.value, 0, 999, 5);
    const secValue = clampNumber(timerSecondsInput.value, 0, 59, 0);

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

function sanitizePlannerInputs() {
    const startA = clampNumber(plannerStartA.value, 0, 23, 9);
    const startB = clampNumber(plannerStartB.value, 0, 23, 9);

    let endA = clampNumber(plannerEndA.value, 1, 24, 17);
    let endB = clampNumber(plannerEndB.value, 1, 24, 17);

    if (endA <= startA) {
        endA = Math.min(24, startA + 1);
    }

    if (endB <= startB) {
        endB = Math.min(24, startB + 1);
    }

    plannerStartA.value = String(startA);
    plannerEndA.value = String(endA);
    plannerStartB.value = String(startB);
    plannerEndB.value = String(endB);
}

function parsePlannerDateToUtc() {
    if (!plannerDate.value) {
        plannerDate.value = getTodayInputValue();
    }

    const parts = plannerDate.value.split("-").map((item) => Number(item));

    if (parts.length !== 3 || parts.some((item) => Number.isNaN(item))) {
        plannerDate.value = getTodayInputValue();
        return parsePlannerDateToUtc();
    }

    const [year, month, day] = parts;
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

function getDecimalHourInZone(date, zone) {
    const parts = getTimeParts(date, zone);
    return parts.hour + parts.minute / 60;
}

function formatRangeForZone(start, end, zone) {
    const formatter = new Intl.DateTimeFormat(
        "en-US",
        withZone(
            {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: !use24Hour
            },
            zone
        )
    );

    return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function getPlannerOverlaps() {
    sanitizePlannerInputs();

    const baseUtcDate = parsePlannerDateToUtc();
    const zoneA = plannerZoneA.value;
    const zoneB = plannerZoneB.value;
    const startA = Number(plannerStartA.value);
    const endA = Number(plannerEndA.value);
    const startB = Number(plannerStartB.value);
    const endB = Number(plannerEndB.value);

    const ranges = [];
    let activeRange = null;

    for (let slot = 0; slot < 48; slot += 1) {
        const slotStart = new Date(baseUtcDate.getTime() + slot * SLOT_MS);
        const slotEnd = new Date(slotStart.getTime() + SLOT_MS);
        const hourA = getDecimalHourInZone(slotStart, zoneA);
        const hourB = getDecimalHourInZone(slotStart, zoneB);

        const inRangeA = hourA >= startA && hourA < endA;
        const inRangeB = hourB >= startB && hourB < endB;

        if (!inRangeA || !inRangeB) {
            activeRange = null;
            continue;
        }

        if (activeRange !== null && activeRange.end.getTime() === slotStart.getTime()) {
            activeRange.end = slotEnd;
            continue;
        }

        activeRange = { start: slotStart, end: slotEnd };
        ranges.push(activeRange);
    }

    return ranges;
}

function formatMinutes(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
        return `${minutes}m`;
    }

    if (minutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
}

function getSelectedLabel(selectElement) {
    return selectElement.options[selectElement.selectedIndex].text;
}

function updateMeetingPlanner() {
    const overlaps = getPlannerOverlaps();
    const zoneALabel = getSelectedLabel(plannerZoneA);
    const zoneBLabel = getSelectedLabel(plannerZoneB);

    plannerSlots.innerHTML = "";

    if (overlaps.length === 0) {
        plannerSummary.textContent = "No overlap";

        const empty = document.createElement("li");
        empty.className = "planner-empty";
        empty.textContent = "No overlap found for the selected date and working windows.";
        plannerSlots.appendChild(empty);
        return;
    }

    let totalMinutes = 0;

    overlaps.slice(0, 8).forEach((range, index) => {
        const item = document.createElement("li");
        const localLine = document.createElement("strong");
        const zoneALine = document.createElement("span");
        const zoneBLine = document.createElement("span");

        const slotMinutes = Math.round((range.end.getTime() - range.start.getTime()) / 60000);
        totalMinutes += slotMinutes;

        item.className = "planner-slot";
        localLine.textContent = `Window ${index + 1} (${formatMinutes(slotMinutes)}) Local: ${formatRangeForZone(range.start, range.end, "local")}`;
        zoneALine.textContent = `${zoneALabel}: ${formatRangeForZone(range.start, range.end, plannerZoneA.value)}`;
        zoneBLine.textContent = `${zoneBLabel}: ${formatRangeForZone(range.start, range.end, plannerZoneB.value)}`;

        item.append(localLine, zoneALine, zoneBLine);
        plannerSlots.appendChild(item);
    });

    if (overlaps.length > 8) {
        const extra = document.createElement("li");
        extra.className = "planner-empty";
        extra.textContent = `Showing first 8 of ${overlaps.length} overlap windows.`;
        plannerSlots.appendChild(extra);
    }

    for (const range of overlaps.slice(8)) {
        totalMinutes += Math.round((range.end.getTime() - range.start.getTime()) / 60000);
    }

    plannerSummary.textContent = `${overlaps.length} windows | ${formatMinutes(totalMinutes)} total overlap`;
}

function savePreferences() {
    const preferences = {
        selectedZone,
        use24Hour,
        timerMinutes: Number(timerMinutesInput.value),
        timerSeconds: Number(timerSecondsInput.value),
        planner: {
            date: plannerDate.value,
            zoneA: plannerZoneA.value,
            startA: Number(plannerStartA.value),
            endA: Number(plannerEndA.value),
            zoneB: plannerZoneB.value,
            startB: Number(plannerStartB.value),
            endB: Number(plannerEndB.value)
        }
    };

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (_error) {
        // Ignore storage failures (private mode, blocked storage, quota issues).
    }
}

function loadPreferences() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return;
        }

        const parsed = JSON.parse(raw);

        if (typeof parsed.use24Hour === "boolean") {
            use24Hour = parsed.use24Hour;
        }

        if (typeof parsed.selectedZone === "string" && optionExists(timezoneSelect, parsed.selectedZone)) {
            selectedZone = parsed.selectedZone;
            timezoneSelect.value = parsed.selectedZone;
        }

        timerMinutesInput.value = String(clampNumber(parsed.timerMinutes, 0, 999, 5));
        timerSecondsInput.value = String(clampNumber(parsed.timerSeconds, 0, 59, 0));

        if (parsed.planner && typeof parsed.planner === "object") {
            if (typeof parsed.planner.zoneA === "string" && optionExists(plannerZoneA, parsed.planner.zoneA)) {
                plannerZoneA.value = parsed.planner.zoneA;
            }

            if (typeof parsed.planner.zoneB === "string" && optionExists(plannerZoneB, parsed.planner.zoneB)) {
                plannerZoneB.value = parsed.planner.zoneB;
            }

            plannerStartA.value = String(clampNumber(parsed.planner.startA, 0, 23, 9));
            plannerEndA.value = String(clampNumber(parsed.planner.endA, 1, 24, 17));
            plannerStartB.value = String(clampNumber(parsed.planner.startB, 0, 23, 9));
            plannerEndB.value = String(clampNumber(parsed.planner.endB, 1, 24, 17));

            if (typeof parsed.planner.date === "string") {
                plannerDate.value = parsed.planner.date;
            }
        }
    } catch (_error) {
        // Ignore malformed storage data.
    }
}

function wireEvents() {
    timezoneSelect.addEventListener("change", () => {
        selectedZone = timezoneSelect.value;
        updateActiveZoneLabel();
        updateClockSuite();
        savePreferences();
    });

    formatToggle.addEventListener("click", () => {
        use24Hour = !use24Hour;
        updateToggleLabel();
        updateClockSuite();
        updateMeetingPlanner();
        savePreferences();
    });

    stopwatchStart.addEventListener("click", startStopwatch);
    stopwatchStop.addEventListener("click", pauseStopwatch);
    stopwatchReset.addEventListener("click", resetStopwatch);

    timerStart.addEventListener("click", () => {
        startTimer();
        savePreferences();
    });

    timerStop.addEventListener("click", pauseTimer);

    timerReset.addEventListener("click", () => {
        resetTimer();
        savePreferences();
    });

    timerMinutesInput.addEventListener("change", () => {
        if (timerIntervalId === null) {
            resetTimer();
            savePreferences();
        }
    });

    timerSecondsInput.addEventListener("change", () => {
        if (timerIntervalId === null) {
            resetTimer();
            savePreferences();
        }
    });

    const plannerControls = [
        plannerDate,
        plannerZoneA,
        plannerStartA,
        plannerEndA,
        plannerZoneB,
        plannerStartB,
        plannerEndB
    ];

    for (const control of plannerControls) {
        control.addEventListener("change", () => {
            updateMeetingPlanner();
            savePreferences();
        });
    }
}

function init() {
    addClockTicks();
    renderWorldClockRows();

    plannerDate.value = plannerDate.value || getTodayInputValue();

    loadPreferences();
    selectedZone = timezoneSelect.value;

    sanitizeTimerInputs();
    sanitizePlannerInputs();

    updateActiveZoneLabel();
    updateToggleLabel();

    timerRemainingMs = timerMsFromInputs();
    renderTimer();
    renderStopwatch();

    updateMeetingPlanner();
    updateClockSuite();

    wireEvents();

    window.setInterval(updateClockSuite, 250);
}

init();
