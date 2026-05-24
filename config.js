// Application Configuration
const CONFIG = {
  // Paste your deployed Google Apps Script Web App URL here
  API_URL: "https://script.google.com/macros/s/AKfycbwL14IapyEMGWvkHFzh_CD6DJTkA_aE9QkGy7i-ZfPTFosU1R7uu9S-TtjYtl3edwJNgw/exec",

  // When true or when API_URL is empty, the app will run in "Demo Mode" with local mock data.
  // This allows previewing the dashboard immediately without setting up Google Sheets first.
  USE_MOCK_DATA: false,

  // Default pairs if not fetched from sheet
  DEFAULT_PAIRS: ["XAUUSD", "NAS100", "US30", "EURUSD", "USDJPY", "GBPUSD", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD"],

  // R-Multiple calculations settings
  RISK_PER_TRADE_R: 1.0 // Each loss deducts 1R. Profit adds the selected RR (e.g., 2R, 3R).
};

export default CONFIG;
