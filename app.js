import CONFIG from './config.js';

// Application State
const STATE = {
  user: null,
  trades: [],
  pairs: [],
  charts: {
    equity: null,
    session: null,
    pairPerf: null,
    pairWinLoss: null,
    sessionPerf: null
  },
  isDemoMode: true
};

// ================= DOM ELEMENT REFERENCES =================
const DOMElements = {
  authPage: document.getElementById('auth-page'),
  appPage: document.getElementById('app-page'),
  loginForm: document.getElementById('login-form'),
  loginUsername: document.getElementById('login-username'),
  loginPassword: document.getElementById('login-password'),
  loginSubmitBtn: document.getElementById('login-submit-btn'),
  
  logoutBtn: document.getElementById('logout-btn'),
  userNameLbl: document.getElementById('user-name-lbl'),
  userAvatarLbl: document.getElementById('user-avatar-lbl'),
  todayDateStr: document.getElementById('today-date-str'),
  
  // Connections status
  connStatusText: document.getElementById('conn-status-text'),
  connStatusSidebar: document.getElementById('conn-status-sidebar'),
  demoIndicatorMobile: document.getElementById('demo-indicator-mobile'),
  syncDataBtn: document.getElementById('sync-data-btn'),
  syncBtnIcon: document.getElementById('sync-btn-icon'),
  globalLoader: document.getElementById('global-loader'),
  toastContainer: document.getElementById('toast-container'),

  // Metrics
  winRatioRing: document.getElementById('win-ratio-ring'),
  winRatioPercentage: document.getElementById('win-ratio-percentage'),
  winCountLbl: document.getElementById('win-count-lbl'),
  lossCountLbl: document.getElementById('loss-count-lbl'),
  netRLbl: document.getElementById('net-r-lbl'),
  netRSubtitle: document.getElementById('net-r-subtitle'),
  totalTradesLbl: document.getElementById('total-trades-lbl'),
  tradesDescLbl: document.getElementById('trades-desc-lbl'),
  profitFactorLbl: document.getElementById('profit-factor-lbl'),
  profitFactorDesc: document.getElementById('profit-factor-desc'),

  // Form Elements
  tradeForm: document.getElementById('trade-form'),
  tradePairInput: document.getElementById('trade-pair'),
  tradeRRSelect: document.getElementById('trade-rr'),
  tradeTimeslotSelect: document.getElementById('trade-timeslot'),
  tradeDateInput: document.getElementById('trade-date'),
  
  // Table
  tradesTableBody: document.getElementById('trades-table-body'),
  tableEmptyState: document.getElementById('table-empty-state'),
  historyCount: document.getElementById('history-count'),

  // Responsive Layout Swapping
  desktopFormWrapper: document.getElementById('desktop-trade-form-wrapper'),
  mobileFormContainer: document.getElementById('mobile-form-container'),
  mobileModal: document.getElementById('mobile-modal'),
  mobileAddBtn: document.getElementById('mobile-add-btn'),
  closeModalBtn: document.getElementById('close-modal-btn'),
  
  mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay')
};

// ================= APP INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
  setupAppModes();
  setupEventListeners();
  checkAuthSession();
  updateDateDisplay();
  handleResponsiveLayout();
});

// Configure API & Demo Modes
function setupAppModes() {
  // If API URL is empty, enforce Demo Mode
  if (!CONFIG.API_URL || CONFIG.USE_MOCK_DATA) {
    STATE.isDemoMode = true;
    STATE.pairs = [...CONFIG.DEFAULT_PAIRS];
  } else {
    STATE.isDemoMode = false;
  }
  
  // Initialize dynamic connection status displays
  updateConnectionStatusUI();
}

function updateConnectionStatusUI() {
  if (STATE.isDemoMode) {
    DOMElements.connStatusText.textContent = "Demo Mode";
    DOMElements.connStatusSidebar.className = "badge badge-profit";
    DOMElements.connStatusSidebar.style.background = "rgba(16, 185, 129, 0.1)";
    DOMElements.connStatusSidebar.style.color = "var(--success)";
    if (DOMElements.demoIndicatorMobile) {
      DOMElements.demoIndicatorMobile.style.display = 'inline-flex';
      DOMElements.demoIndicatorMobile.textContent = "DEMO";
    }
  } else {
    DOMElements.connStatusText.textContent = "Live Connected";
    DOMElements.connStatusSidebar.className = "badge badge-info";
    DOMElements.connStatusSidebar.style.background = "rgba(6, 182, 212, 0.1)";
    DOMElements.connStatusSidebar.style.color = "var(--primary)";
    if (DOMElements.demoIndicatorMobile) {
      DOMElements.demoIndicatorMobile.style.display = 'inline-flex';
      DOMElements.demoIndicatorMobile.textContent = "LIVE";
      DOMElements.demoIndicatorMobile.className = "badge badge-info";
    }
  }
}

// Display Date
function updateDateDisplay() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  DOMElements.todayDateStr.textContent = new Date().toLocaleDateString('en-US', options);
  
  // Set default form date to today
  const today = new Date().toISOString().split('T')[0];
  DOMElements.tradeDateInput.value = today;
}

// ================= AUTHENTICATION FLOW =================
function checkAuthSession() {
  const savedUser = localStorage.getItem('journal_session_user');
  if (savedUser) {
    STATE.user = { username: savedUser };
    loadDashboardView();
  } else {
    DOMElements.authPage.style.display = 'flex';
    DOMElements.appPage.style.display = 'none';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const username = DOMElements.loginUsername.value.trim();
  const password = DOMElements.loginPassword.value;
  
  if (!username || !password) return;
  
  showLoader(true);
  
  try {
    if (STATE.isDemoMode) {
      // Mock Auth
      await delay(800); // Simulate API latency
      if (username.toLowerCase() === 'admin' && password === 'admin123') {
        loginSuccess(username);
      } else {
        showToast("Invalid credentials! (For Demo mode use: admin / admin123)", "error");
      }
    } else {
      // Live Sheet Auth
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // Avoid CORS preflight in Apps Script
        body: JSON.stringify({
          action: 'login',
          username: username,
          password: password
        })
      });
      
      const result = await response.json();
      if (result.success) {
        loginSuccess(result.username || username);
      } else {
        showToast(result.error || "Invalid username or password.", "error");
      }
    }
  } catch (err) {
    console.error("Login error:", err);
    showToast("Server connection failed. Review your API URL or check console.", "error");
  } finally {
    showLoader(false);
  }
}

function loginSuccess(username) {
  localStorage.setItem('journal_session_user', username);
  STATE.user = { username: username };
  showToast("Logged in successfully!", "success");
  loadDashboardView();
}

function handleLogout() {
  localStorage.removeItem('journal_session_user');
  STATE.user = null;
  STATE.trades = [];
  
  // Reset fields
  DOMElements.loginUsername.value = '';
  DOMElements.loginPassword.value = '';
  
  DOMElements.authPage.style.display = 'flex';
  DOMElements.appPage.style.display = 'none';
  showToast("Logged out successfully.", "info");
}

function loadDashboardView() {
  DOMElements.authPage.style.display = 'none';
  DOMElements.appPage.style.display = 'flex';
  
  // Set User labels
  const userInit = STATE.user.username.charAt(0).toUpperCase();
  DOMElements.userAvatarLbl.textContent = userInit;
  DOMElements.userNameLbl.textContent = STATE.user.username;
  
  // Fetch Data
  fetchData();
}

// ================= DATA SYNC & CRUD OPERATIONS =================
async function fetchData() {
  showLoader(true);
  
  try {
    if (STATE.isDemoMode) {
      // Fetch mock data
      await delay(600);
      loadMockData();
      showToast("Synchronized demo data successfully.", "success");
    } else {
      // Fetch dynamic spreadsheet data
      const username = STATE.user ? STATE.user.username : '';
      const response = await fetch(`${CONFIG.API_URL}?action=getDashboardData&username=${encodeURIComponent(username)}`);
      const result = await response.json();
      
      if (result.success) {
        STATE.trades = result.trades || [];
        STATE.pairs = result.pairs || CONFIG.DEFAULT_PAIRS;
        showToast("Synchronized sheet data successfully.", "success");
      } else {
        showToast(result.error || "Failed to load sheet data.", "error");
        // Fallback to default configurations
        STATE.pairs = [...CONFIG.DEFAULT_PAIRS];
      }
    }
    
    // Refresh GUI
    renderPairSelectOptions();
    calculateAndRenderDashboard();
  } catch (err) {
    console.error("Sync error:", err);
    showToast("Network synchronization failed. Using fallback config.", "error");
    STATE.pairs = [...CONFIG.DEFAULT_PAIRS];
    renderPairSelectOptions();
    calculateAndRenderDashboard();
  } finally {
    showLoader(false);
  }
}

async function handleAddTrade(e) {
  e.preventDefault();
  
  const pair = DOMElements.tradePairInput.value;
  const outcome = document.querySelector('input[name="outcome"]:checked').value;
  const rr = DOMElements.tradeRRSelect.value;
  const timeSlot = DOMElements.tradeTimeslotSelect.value;
  const date = DOMElements.tradeDateInput.value;
  
  const newTrade = { pair, outcome, rr, timeSlot, date };
  
  showLoader(true);
  closeMobileModal();
  
  try {
    if (STATE.isDemoMode) {
      await delay(500);
      
      // Save locally
      const mockId = "M-" + Date.now();
      const mockTrade = {
        ID: mockId,
        Timestamp: new Date().toISOString(),
        Date: date + "T00:00:00.000Z",
        Pair: pair,
        Outcome: outcome,
        RR: rr,
        TimeSlot: timeSlot
      };
      
      STATE.trades.unshift(mockTrade);
      localStorage.setItem('journal_mock_trades', JSON.stringify(STATE.trades));
      showToast("Trade added locally (Demo Mode)!", "success");
    } else {
      // Send to sheet
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'addTrade',
          username: STATE.user.username,
          trade: newTrade
        })
      });
      
      const result = await response.json();
      if (result.success) {
        showToast("Trade saved to Google Sheet!", "success");
        // Refresh full dataset from sheet to ensure database consistency
        await fetchData();
        return;
      } else {
        showToast(result.error || "Failed to log trade to sheet.", "error");
      }
    }
    
    calculateAndRenderDashboard();
  } catch (err) {
    console.error("Add trade error:", err);
    showToast("Failed to communicate trade entry.", "error");
  } finally {
    showLoader(false);
  }
}

async function handleDeleteTrade(tradeId) {
  if (!confirm("Are you sure you want to delete this trade?")) return;
  
  showLoader(true);
  
  try {
    if (STATE.isDemoMode) {
      await delay(400);
      STATE.trades = STATE.trades.filter(t => String(t.ID) !== String(tradeId));
      localStorage.setItem('journal_mock_trades', JSON.stringify(STATE.trades));
      showToast("Trade deleted from local database.", "info");
    } else {
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'deleteTrade',
          tradeId: tradeId,
          username: STATE.user.username
        })
      });
      
      const result = await response.json();
      if (result.success) {
        showToast("Trade deleted from Google Sheet.", "info");
        await fetchData();
        return;
      } else {
        showToast(result.error || "Failed to delete trade.", "error");
      }
    }
    
    calculateAndRenderDashboard();
  } catch (err) {
    console.error("Delete trade error:", err);
    showToast("Network deletion failed.", "error");
  } finally {
    showLoader(false);
  }
}

// ================= ANALYTICS & RENDERING ENGINE =================
function calculateAndRenderDashboard() {
  const trades = STATE.trades;
  const total = trades.length;
  
  let wins = 0;
  let losses = 0;
  let netR = 0.0;
  let grossWinR = 0.0;
  let grossLossR = 0.0;
  
  trades.forEach(trade => {
    const isWin = trade.Outcome.trim().toLowerCase() === 'profit';
    
    // Parse RR multiplier
    const rrVal = parseRR(trade.RR);
    
    if (isWin) {
      wins++;
      netR += rrVal;
      grossWinR += rrVal;
    } else {
      losses++;
      const riskAmount = CONFIG.RISK_PER_TRADE_R;
      netR -= riskAmount;
      grossLossR += riskAmount;
    }
  });

  // Calculate Win Ratio
  const winRatio = total > 0 ? Math.round((wins / total) * 100) : 0;
  
  // Calculate Profit Factor
  let profitFactor = 0;
  if (grossLossR > 0) {
    profitFactor = grossWinR / grossLossR;
  } else if (grossWinR > 0) {
    profitFactor = 99.9; // Infinity representation
  }
  
  // Update Indicators Text
  DOMElements.winCountLbl.textContent = wins;
  DOMElements.lossCountLbl.textContent = losses;
  DOMElements.winRatioPercentage.textContent = `${winRatio}%`;
  
  // Update circular gauge
  const radius = DOMElements.winRatioRing.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (winRatio / 100) * circumference;
  DOMElements.winRatioRing.style.strokeDashoffset = strokeDashoffset;
  
  // Update Net R
  const prefix = netR >= 0 ? "+" : "";
  DOMElements.netRLbl.textContent = `${prefix}${netR.toFixed(1)}R`;
  if (netR >= 0) {
    DOMElements.netRLbl.style.color = "var(--success)";
    DOMElements.netRSubtitle.textContent = "Profitable account performance.";
  } else {
    DOMElements.netRLbl.style.color = "var(--danger)";
    DOMElements.netRSubtitle.textContent = "Drawdown account performance.";
  }
  
  // Update Total Trades
  DOMElements.totalTradesLbl.textContent = total;
  DOMElements.tradesDescLbl.textContent = `${total} trades logged in history.`;
  
  // Update Profit Factor
  DOMElements.profitFactorLbl.textContent = profitFactor === 99.9 ? "∞" : profitFactor.toFixed(2);
  if (profitFactor >= 1.5) {
    DOMElements.profitFactorLbl.style.color = "var(--success)";
    DOMElements.profitFactorDesc.textContent = "Healthy trading factor (> 1.5).";
  } else if (profitFactor >= 1.0) {
    DOMElements.profitFactorLbl.style.color = "var(--primary)";
    DOMElements.profitFactorDesc.textContent = "Breakeven performance.";
  } else {
    DOMElements.profitFactorLbl.style.color = "var(--danger)";
    DOMElements.profitFactorDesc.textContent = "Unprofitable factor (< 1.0).";
  }
  
  // Render Visual Charts
  renderCharts();
  
  // Render Trades Table
  renderTradesTable();
}

// Populate pair select dropdown options
function renderPairSelectOptions() {
  const select = DOMElements.tradePairInput;
  if (!select) return;
  select.innerHTML = '';
  STATE.pairs.forEach((pair) => {
    const option = document.createElement('option');
    option.value = pair;
    option.textContent = pair;
    select.appendChild(option);
  });
}

// HTML Trades Table Loader
function renderTradesTable() {
  const tbody = DOMElements.tradesTableBody;
  tbody.innerHTML = '';
  
  const trades = STATE.trades;
  
  if (trades.length === 0) {
    DOMElements.tableEmptyState.style.display = 'flex';
    DOMElements.historyCount.textContent = "Showing 0 trades";
    return;
  }
  
  DOMElements.tableEmptyState.style.display = 'none';
  DOMElements.historyCount.textContent = `Showing ${trades.length} trades`;
  
  trades.forEach(trade => {
    const row = document.createElement('tr');
    
    // Parse values
    const isWin = trade.Outcome.trim().toLowerCase() === 'profit';
    const dateFormatted = formatDate(trade.Date);
    const rVal = isWin ? `+${parseRR(trade.RR).toFixed(1)}R` : `-${CONFIG.RISK_PER_TRADE_R.toFixed(1)}R`;
    
    row.innerHTML = `
      <td>${dateFormatted}</td>
      <td style="font-weight:600;">${trade.Pair}</td>
      <td>
        <span class="badge ${isWin ? 'badge-profit' : 'badge-loss'}">${trade.Outcome}</span>
      </td>
      <td>${trade.RR}</td>
      <td>${trade.TimeSlot}</td>
      <td style="font-weight:700; color: ${isWin ? 'var(--success)' : 'var(--danger)'};">${rVal}</td>
      <td style="text-align:center;">
        <button class="delete-action-btn" data-id="${trade.ID}" title="Delete trade">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px; height:16px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </td>
    `;
    
    // Wire delete trigger
    const deleteBtn = row.querySelector('.delete-action-btn');
    deleteBtn.addEventListener('click', () => handleDeleteTrade(trade.ID));
    
    tbody.appendChild(row);
  });
}

// Chart drawing via Chart.js integration
function renderCharts() {
  const trades = [...STATE.trades];
  
  // Chronological sort for equity curve (oldest first)
  trades.sort((a, b) => new Date(a.Date || a.Timestamp) - new Date(b.Date || b.Timestamp));
  
  // 1. Equity Curve Calculation
  let currentR = 0;
  const equityData = [0];
  const equityLabels = ["Start"];
  
  trades.forEach((trade, idx) => {
    const isWin = trade.Outcome.trim().toLowerCase() === 'profit';
    const rVal = isWin ? parseRR(trade.RR) : -CONFIG.RISK_PER_TRADE_R;
    currentR += rVal;
    equityData.push(currentR);
    
    // Form date labels
    const d = new Date(trade.Date || trade.Timestamp);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    equityLabels.push(`T-${idx + 1} (${dateStr})`);
  });
  
  // Render / Update Equity Curve Chart
  if (STATE.charts.equity) {
    STATE.charts.equity.destroy();
  }
  
  const ctxEquity = document.getElementById('equity-curve-chart').getContext('2d');
  const gradient = ctxEquity.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
  gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
  
  STATE.charts.equity = new Chart(ctxEquity, {
    type: 'line',
    data: {
      labels: equityLabels,
      datasets: [{
        label: 'Net R-Multiple Balance',
        data: equityData,
        borderColor: '#6366f1',
        borderWidth: 2.5,
        backgroundColor: gradient,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#6366f1',
        pointHoverRadius: 6,
        pointRadius: equityLabels.length > 20 ? 1 : 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: '#94a3b8', font: { size: 10 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: '#94a3b8', font: { size: 10 } }
        }
      }
    }
  });

  // 2. Session Time Slot performance (Wins vs Losses grouping)
  const slots = ["10:30 AM", "2:30 PM", "6:30 PM"];
  const winsBySlot = [0, 0, 0];
  const lossesBySlot = [0, 0, 0];
  
  STATE.trades.forEach(trade => {
    const slotIdx = slots.indexOf(trade.TimeSlot);
    if (slotIdx !== -1) {
      if (trade.Outcome.trim().toLowerCase() === 'profit') {
        winsBySlot[slotIdx]++;
      } else {
        lossesBySlot[slotIdx]++;
      }
    }
  });
  
  if (STATE.charts.session) {
    STATE.charts.session.destroy();
  }
  
  const ctxSession = document.getElementById('session-time-chart').getContext('2d');
  STATE.charts.session = new Chart(ctxSession, {
    type: 'bar',
    data: {
      labels: slots,
      datasets: [
        {
          label: 'Profits (Wins)',
          data: winsBySlot,
          backgroundColor: '#10b981',
          borderRadius: 4
        },
        {
          label: 'Losses',
          data: lossesBySlot,
          backgroundColor: '#f43f5e',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#f8fafc', boxWidth: 12 }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: '#94a3b8', stepSize: 1 }
        }
      }
    }
  });

  // 3. Asset Pair Performance Chart (Net R-multiple earned on each pair)
  const pairPerfData = {};
  // Pre-fill with configured pairs
  STATE.pairs.forEach(p => {
    pairPerfData[p] = 0.0;
  });

  // Calculate R-multiple sums
  trades.forEach(trade => {
    const isWin = trade.Outcome.trim().toLowerCase() === 'profit';
    const rVal = isWin ? parseRR(trade.RR) : -CONFIG.RISK_PER_TRADE_R;
    const pair = trade.Pair.toUpperCase();
    if (pairPerfData[pair] !== undefined) {
      pairPerfData[pair] += rVal;
    } else {
      pairPerfData[pair] = rVal;
    }
  });

  if (STATE.charts.pairPerf) {
    STATE.charts.pairPerf.destroy();
  }

  // Custom inline plugin to draw datalabels at the tips of horizontal bars
  const datalabelsPlugin = {
    id: 'datalabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);
        meta.data.forEach((bar, index) => {
          const val = dataset.data[index];
          // Format as e.g. +3.0R or -1.0R
          const formattedVal = (val >= 0 ? '+' : '') + val.toFixed(1) + 'R';
          ctx.fillStyle = '#94a3b8';
          ctx.font = '600 11px Inter, sans-serif';
          ctx.textBaseline = 'middle';
          
          const padding = 6;
          let x = bar.x + padding;
          ctx.textAlign = 'left';
          
          if (val < 0) {
            x = bar.x - padding;
            ctx.textAlign = 'right';
          }
          
          const y = bar.y;
          ctx.fillText(formattedVal, x, y);
        });
      });
    }
  };

  const ctxPairPerf = document.getElementById('pair-performance-chart').getContext('2d');
  const bgColors = Object.values(pairPerfData).map(val => val >= 0 ? '#10b981' : '#f43f5e');

  STATE.charts.pairPerf = new Chart(ctxPairPerf, {
    type: 'bar',
    data: {
      labels: Object.keys(pairPerfData),
      datasets: [{
        label: 'Net R-Multiple',
        data: Object.values(pairPerfData),
        backgroundColor: bgColors,
        borderRadius: 4
      }]
    },
    plugins: [datalabelsPlugin],
    options: {
      indexAxis: 'y', // Makes it horizontal
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: '#94a3b8' },
          grace: '15%' // adds padding at the scale edge so labels don't clip
        },
        y: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });

  // 4. Wins vs Losses by Asset Pair (Grouped vertical bar chart)
  const pairWins = {};
  const pairLosses = {};
  // Pre-fill with configured pairs
  STATE.pairs.forEach(p => {
    pairWins[p] = 0;
    pairLosses[p] = 0;
  });

  trades.forEach(trade => {
    const isWin = trade.Outcome.trim().toLowerCase() === 'profit';
    const pair = trade.Pair.toUpperCase();
    if (pairWins[pair] !== undefined) {
      if (isWin) {
        pairWins[pair]++;
      } else {
        pairLosses[pair]++;
      }
    }
  });

  if (STATE.charts.pairWinLoss) {
    STATE.charts.pairWinLoss.destroy();
  }

  const ctxPairWinLoss = document.getElementById('pair-winloss-chart').getContext('2d');
  STATE.charts.pairWinLoss = new Chart(ctxPairWinLoss, {
    type: 'bar',
    data: {
      labels: Object.keys(pairWins),
      datasets: [
        {
          label: 'Profits (Wins)',
          data: Object.values(pairWins),
          backgroundColor: '#10b981',
          borderRadius: 4
        },
        {
          label: 'Losses',
          data: Object.values(pairLosses),
          backgroundColor: '#f43f5e',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#f8fafc', boxWidth: 12 }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: '#94a3b8', stepSize: 1 }
        }
      }
    }
  });

  // 5. Net Performance by Session Time (Vertical bar chart showing Net R per session)
  const sessionPerfData = {
    "10:30 AM": 0.0,
    "2:30 PM": 0.0,
    "6:30 PM": 0.0
  };

  trades.forEach(trade => {
    const isWin = trade.Outcome.trim().toLowerCase() === 'profit';
    const rVal = isWin ? parseRR(trade.RR) : -CONFIG.RISK_PER_TRADE_R;
    if (sessionPerfData[trade.TimeSlot] !== undefined) {
      sessionPerfData[trade.TimeSlot] += rVal;
    }
  });

  if (STATE.charts.sessionPerf) {
    STATE.charts.sessionPerf.destroy();
  }

  const ctxSessionPerf = document.getElementById('session-perf-chart').getContext('2d');
  const sessionBgColors = Object.values(sessionPerfData).map(val => val >= 0 ? '#10b981' : '#f43f5e');

  STATE.charts.sessionPerf = new Chart(ctxSessionPerf, {
    type: 'bar',
    data: {
      labels: Object.keys(sessionPerfData),
      datasets: [{
        label: 'Net R-Multiple',
        data: Object.values(sessionPerfData),
        backgroundColor: sessionBgColors,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

// ================= HELPERS & SETUP UTILITIES =================

// Parse RR String (e.g., "1:2" => 2.0)
function parseRR(rrStr) {
  if (!rrStr) return 1.0;
  const parts = rrStr.split(':');
  if (parts.length < 2) return 1.0;
  const reward = parseFloat(parts[1]);
  return isNaN(reward) ? 1.0 : reward;
}

// Format ISO string/Date object to clean YYYY-MM-DD
function formatDate(dateVal) {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal).split('T')[0];
  
  const year = d.getFullYear();
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  
  return [year, month, day].join('-');
}

// Generate Mock Data for first-time launch
function loadMockData() {
  const localMock = localStorage.getItem('journal_mock_trades');
  
  if (localMock) {
    STATE.trades = JSON.parse(localMock);
    return;
  }
  
  // Set up default trades to make the dashboard charts look amazing initially!
  const defaultTrades = [
    { ID: "M1", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 240).toISOString(), Date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString().split('T')[0] + "T00:00:00.000Z", Pair: "XAUUSD", Outcome: "Profit", RR: "1:2", TimeSlot: "10:30 AM" },
    { ID: "M2", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 210).toISOString(), Date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString().split('T')[0] + "T00:00:00.000Z", Pair: "US30", Outcome: "Loss", RR: "1:2", TimeSlot: "2:30 PM" },
    { ID: "M3", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 180).toISOString(), Date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString().split('T')[0] + "T00:00:00.000Z", Pair: "NAS100", Outcome: "Profit", RR: "1:3", TimeSlot: "6:30 PM" },
    { ID: "M4", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 150).toISOString(), Date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0] + "T00:00:00.000Z", Pair: "EURUSD", Outcome: "Profit", RR: "1:1", TimeSlot: "10:30 AM" },
    { ID: "M5", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), Date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString().split('T')[0] + "T00:00:00.000Z", Pair: "USDJPY", Outcome: "Loss", RR: "1:3", TimeSlot: "2:30 PM" },
    { ID: "M6", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), Date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0] + "T00:00:00.000Z", Pair: "GBPUSD", Outcome: "Profit", RR: "1:2", TimeSlot: "10:30 AM" },
    { ID: "M7", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(), Date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString().split('T')[0] + "T00:00:00.000Z", Pair: "USDCHF", Outcome: "Loss", RR: "1:2", TimeSlot: "6:30 PM" },
    { ID: "M8", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(), Date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0] + "T00:00:00.000Z", Pair: "AUDUSD", Outcome: "Profit", RR: "1:3", TimeSlot: "2:30 PM" },
    { ID: "M9", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(), Date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString().split('T')[0] + "T00:00:00.000Z", Pair: "USDCAD", Outcome: "Loss", RR: "1:1", TimeSlot: "10:30 AM" },
    { ID: "M10", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), Date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString().split('T')[0] + "T00:00:00.000Z", Pair: "NZDUSD", Outcome: "Profit", RR: "1:2", TimeSlot: "6:30 PM" }
  ];
  
  // Sort reverse chronological initially to display newest in list
  STATE.trades = defaultTrades.reverse();
  localStorage.setItem('journal_mock_trades', JSON.stringify(STATE.trades));
}

// Delay generator
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Loader Toggler
function showLoader(isActive) {
  if (isActive) {
    DOMElements.globalLoader.classList.add('active');
  } else {
    DOMElements.globalLoader.classList.remove('active');
  }
}

// Notification Toast trigger
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '';
  if (type === 'success') {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="var(--success)" style="width:20px; height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
  } else if (type === 'error') {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="var(--danger)" style="width:20px; height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
  } else {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="var(--primary)" style="width:20px; height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
  }

  toast.innerHTML = `
    ${icon}
    <div style="font-size:0.85rem; font-weight:500;">${message}</div>
    <button class="toast-close" aria-label="Close message">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:14px; height:14px;">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" stroke-linecap="round" />
      </svg>
    </button>
  `;
  
  // Close actions
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.style.animation = 'slideIn 0.2s ease reverse forwards';
    setTimeout(() => toast.remove(), 200);
  });
  
  DOMElements.toastContainer.appendChild(toast);
  
  // Auto-remove after 4.5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'slideIn 0.2s ease reverse forwards';
      setTimeout(() => toast.remove(), 200);
    }
  }, 4500);
}

// DOM Form Repositioning for Screen Responsiveness
function handleResponsiveLayout() {
  const isMobileOrTablet = window.innerWidth < 1200;
  const formElement = DOMElements.tradeForm;
  
  if (isMobileOrTablet) {
    // If tradeForm is currently in desktop container, move to mobile
    if (DOMElements.desktopFormWrapper.contains(formElement)) {
      DOMElements.mobileFormContainer.appendChild(formElement);
    }
  } else {
    // If tradeForm is in mobile container, move to desktop
    if (DOMElements.mobileFormContainer.contains(formElement)) {
      DOMElements.desktopFormWrapper.appendChild(formElement);
    }
    // Close modal if size changes
    closeMobileModal();
  }
}

// Modal handling triggers
function openMobileModal() {
  DOMElements.mobileModal.classList.add('open');
}

function closeMobileModal() {
  DOMElements.mobileModal.classList.remove('open');
}

// Toggle mobile navigation drawer
function toggleSidebar() {
  DOMElements.sidebar.classList.toggle('open');
  DOMElements.sidebarOverlay.classList.toggle('active');
}

function closeSidebar() {
  DOMElements.sidebar.classList.remove('open');
  DOMElements.sidebarOverlay.classList.remove('active');
}

// ================= GLOBAL EVENT LISTENERS =================
function setupEventListeners() {
  // Login Form Submit
  DOMElements.loginForm.addEventListener('submit', handleLogin);
  
  // Log Trade Form Submit (works for both desktop and mobile locations due to reference-retention)
  DOMElements.tradeForm.addEventListener('submit', handleAddTrade);
  
  // Logout Btn
  DOMElements.logoutBtn.addEventListener('click', handleLogout);
  
  // Sync Data Btn
  DOMElements.syncDataBtn.addEventListener('click', () => {
    // Animate sync icon rotation
    DOMElements.syncBtnIcon.style.transition = 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)';
    DOMElements.syncBtnIcon.style.transform = 'rotate(360deg)';
    setTimeout(() => {
      DOMElements.syncBtnIcon.style.transition = 'none';
      DOMElements.syncBtnIcon.style.transform = 'rotate(0deg)';
    }, 1000);
    
    fetchData();
  });
  
  // Responsive Resizing trigger
  window.addEventListener('resize', handleResponsiveLayout);
  
  // Mobile Modal triggers
  DOMElements.mobileAddBtn.addEventListener('click', openMobileModal);
  DOMElements.closeModalBtn.addEventListener('click', closeMobileModal);
  
  // Mobile Side Navigation Menu triggers
  DOMElements.mobileMenuToggle.addEventListener('click', toggleSidebar);
  DOMElements.sidebarOverlay.addEventListener('click', closeSidebar);
}
