// ---------- Storage ----------
const STORAGE_KEY = "dailyTracker_v1";

function loadAllData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
function saveAllData(obj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

// Data shape:
// data["2026-01-17"] = { sleep: 7.5, study: 2, exercise: 1 }

// ---------- Date helpers ----------
function toISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fromISODate(str) {
  // "YYYY-MM-DD"
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDaysISO(iso, days) {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

function startOfWeekMonday(dateObj) {
  const d = new Date(dateObj);
  const day = d.getDay(); // Sun=0, Mon=1...
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

function weekDatesFor(dateObj) {
  const monday = startOfWeekMonday(dateObj);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function labelForDate(d) {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return dayNames[d.getDay()];
}

// ---------- UI elements ----------
const form = document.getElementById("trackerForm");
const dateInput = document.getElementById("dateInput");
const studyInput = document.getElementById("studyInput");
const exerciseInput = document.getElementById("exerciseInput");
const sleepInput = document.getElementById("sleepInput");
const statusEl = document.getElementById("status");
const weekLabelEl = document.getElementById("weekLabel");
const prevWeekBtn = document.getElementById("prevWeekBtn");
const nextWeekBtn = document.getElementById("nextWeekBtn");
const clearBtn = document.getElementById("clearBtn");

// default date = today
dateInput.value = toISODate(new Date());

let allData = loadAllData();

// Text color
Chart.defaults.color = "#e8eef6";

// Axis border color
Chart.defaults.borderColor = "#2a2a2e";

// Grid line color
Chart.defaults.scale.grid.color = "#2a2a2e";



// ---------- Build charts ----------
function makeBarChart(canvasId, title, labels, values) {
  const ctx = document.getElementById(canvasId);
  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: title,
        data: values,
        backgroundColor: "rgba(96, 165, 250, 0.8)",   // light blue
        borderColor: "rgba(96, 165, 250, 1)",        // slightly darker edge
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}


let exerciseChart, sleepChart, studyChart;

function getWeekArrays(selectedISO) {
  const selectedDate = fromISODate(selectedISO);
  const weekDates = weekDatesFor(selectedDate);

  const labels = weekDates.map(labelForDate);
  const isoDates = weekDates.map(toISODate);

  const exercise = isoDates.map(iso => allData[iso]?.exercise ?? 0);
  const sleep = isoDates.map(iso => allData[iso]?.sleep ?? 0);
  const study = isoDates.map(iso => allData[iso]?.study ?? 0);

  // Week label (Mon -> Sun)
  const startText = weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const endText = weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  weekLabelEl.textContent = `Week: ${startText} → ${endText}`;


  return { labels, isoDates, exercise, sleep, study };
}

function renderOrUpdateCharts() {
  const { labels, exercise, sleep, study } = getWeekArrays(dateInput.value);

  if (!exerciseChart) {
    studyChart = makeBarChart("studyChart", "Study (hours)", labels, study);
    exerciseChart = makeBarChart("exerciseChart", "Exercise (hours)", labels, exercise);
    sleepChart = makeBarChart("sleepChart", "Sleep (hours)", labels, sleep);
    return;
  }

  exerciseChart.data.labels = labels;
  sleepChart.data.labels = labels;
  studyChart.data.labels = labels;

  exerciseChart.data.datasets[0].data = exercise;
  sleepChart.data.datasets[0].data = sleep;
  studyChart.data.datasets[0].data = study;

  studyChart.update();
  exerciseChart.update();
  sleepChart.update();
}

function fillInputsForSelectedDate() {
  const iso = dateInput.value;
  const entry = allData[iso];

  sleepInput.value = entry?.sleep ?? "";
  studyInput.value = entry?.study ?? "";
  exerciseInput.value = entry?.exercise ?? "";
}

// When date changes: fill fields + update charts
dateInput.addEventListener("change", () => {
  statusEl.textContent = "";
  fillInputsForSelectedDate();
  renderOrUpdateCharts();
});

// Save submission
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const iso = dateInput.value;
  allData[iso] = {
    sleep: Number(sleepInput.value),
    study: Number(studyInput.value),
    exercise: Number(exerciseInput.value)
  };

  saveAllData(allData);
  statusEl.textContent = `Saved ${iso} ✅`;
  renderOrUpdateCharts();
});

// Clear all data
clearBtn.addEventListener("click", () => {
  const confirmed = confirm(
    "Are you sure you want to clear all data?\nThis cannot be undone."
  );

  if (!confirmed) return; // user clicked Cancel

  allData = {};
  saveAllData(allData);

  statusEl.textContent = "Cleared all saved data ✅";
  fillInputsForSelectedDate();
  renderOrUpdateCharts();
});

prevWeekBtn.addEventListener("click", () => {
  // move the selected date back 7 days
  dateInput.value = addDaysISO(dateInput.value, -7);
  statusEl.textContent = "";
  fillInputsForSelectedDate();
  renderOrUpdateCharts();
});

nextWeekBtn.addEventListener("click", () => {
  // move the selected date forward 7 days
  dateInput.value = addDaysISO(dateInput.value, 7);
  statusEl.textContent = "";
  fillInputsForSelectedDate();
  renderOrUpdateCharts();
});

// Initial load
fillInputsForSelectedDate();
renderOrUpdateCharts();

