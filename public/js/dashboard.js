// Dashboard Analytics — fetches /api/resources/stats and renders Chart.js visualizations

document.addEventListener('DOMContentLoaded', loadDashboard);

async function loadDashboard() {
  try {
    const res = await fetch('/api/resources/stats');
    const json = await res.json();

    if (!json.success) throw new Error(json.error || 'Failed to load stats');

    const stats = json.data;

    // Populate stat cards
    document.getElementById('stat-total').textContent = stats.totalResources;
    document.getElementById('stat-avg-rating').textContent = stats.averageRating > 0
      ? stats.averageRating.toFixed(1) + ' / 5'
      : 'N/A';
    document.getElementById('stat-categories').textContent = stats.byCategory.length;
    document.getElementById('stat-tags').textContent = stats.topTags.length > 0
      ? stats.topTags.length + '+'
      : '0';

    // Show content, hide loading
    document.getElementById('dashboard-loading').style.display = 'none';
    document.getElementById('dashboard-content').style.display = 'block';

    // Render charts
    renderCategoryChart(stats.byCategory);
    renderDifficultyChart(stats.byDifficulty);
    renderTimelineChart(stats.overTime);
    renderSourceChart(stats.sourceDistribution);
    renderTagsChart(stats.topTags);

  } catch (err) {
    document.getElementById('dashboard-loading').style.display = 'none';
    const errorBox = document.getElementById('error-box');
    errorBox.textContent = err.message;
    errorBox.style.display = 'block';
  }
}

// --- Helper to detect dark mode ---
function isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

function chartColors() {
  return {
    gridColor: isDark() ? 'rgba(148,163,184,0.15)' : 'rgba(0,0,0,0.08)',
    textColor: isDark() ? '#cbd5e1' : '#475569',
  };
}

// --- Category: Doughnut Chart ---
function renderCategoryChart(data) {
  const labels = data.map(d => d._id);
  const counts = data.map(d => d.count);
  const palette = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  new Chart(document.getElementById('chart-category'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: palette.slice(0, labels.length),
        borderWidth: 2,
        borderColor: isDark() ? '#111827' : '#ffffff',
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: chartColors().textColor, padding: 16 },
        },
      },
    },
  });
}

// --- Difficulty: Pie Chart ---
function renderDifficultyChart(data) {
  const difficultyOrder = ['Beginner', 'Intermediate', 'Advanced'];
  const colorMap = { Beginner: '#16a34a', Intermediate: '#f59e0b', Advanced: '#ef4444' };

  const sorted = difficultyOrder
    .map(d => data.find(item => item._id === d))
    .filter(Boolean);

  new Chart(document.getElementById('chart-difficulty'), {
    type: 'pie',
    data: {
      labels: sorted.map(d => d._id),
      datasets: [{
        data: sorted.map(d => d.count),
        backgroundColor: sorted.map(d => colorMap[d._id] || '#64748b'),
        borderWidth: 2,
        borderColor: isDark() ? '#111827' : '#ffffff',
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: chartColors().textColor, padding: 16 },
        },
      },
    },
  });
}

// --- Timeline: Line Chart (last 30 days) ---
function renderTimelineChart(data) {
  const { gridColor, textColor } = chartColors();

  // Fill in missing dates in the 30-day window
  const labels = [];
  const counts = [];
  const dataMap = {};
  data.forEach(d => { dataMap[d._id] = d.count; });

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    counts.push(dataMap[key] || 0);
  }

  new Chart(document.getElementById('chart-timeline'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Resources Created',
        data: counts,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: textColor, maxRotation: 45, maxTicksLimit: 10 },
          grid: { color: gridColor },
        },
        y: {
          beginAtZero: true,
          ticks: { color: textColor, stepSize: 1 },
          grid: { color: gridColor },
        },
      },
    },
  });
}

// --- Source Distribution: Bar Chart ---
function renderSourceChart(data) {
  const { gridColor, textColor } = chartColors();
  const colorMap = {
    'File Only': '#8b5cf6',
    'Link Only': '#2563eb',
    'Both': '#16a34a',
    'No Source': '#94a3b8',
  };

  new Chart(document.getElementById('chart-source'), {
    type: 'bar',
    data: {
      labels: data.map(d => d._id),
      datasets: [{
        label: 'Resources',
        data: data.map(d => d.count),
        backgroundColor: data.map(d => colorMap[d._id] || '#64748b'),
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { color: textColor, stepSize: 1 },
          grid: { color: gridColor },
        },
      },
    },
  });
}

// --- Top Tags: Horizontal Bar Chart ---
function renderTagsChart(data) {
  const { gridColor, textColor } = chartColors();

  new Chart(document.getElementById('chart-tags'), {
    type: 'bar',
    data: {
      labels: data.map(d => d._id),
      datasets: [{
        label: 'Usage Count',
        data: data.map(d => d.count),
        backgroundColor: ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderRadius: 6,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: textColor, stepSize: 1 },
          grid: { color: gridColor },
        },
        y: {
          ticks: { color: textColor },
          grid: { display: false },
        },
      },
    },
  });
}
