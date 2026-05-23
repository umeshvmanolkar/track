/**
 * Google Apps Script Backend for Forex & Indices Trading Journal
 * Deploy this script as a Web App with access set to "Anyone".
 */

// Helper to return JSON responses with standard structure
function buildResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Global sheet retriever with error checks
function getSheetByName(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    // Attempt to create sheet if it doesn't exist
    sheet = ss.insertSheet(name);
    // Initialize default headers
    if (name === "Users") {
      sheet.appendRow(["Username", "Password"]);
      sheet.appendRow(["admin", "admin123"]); // default fallback user
    } else if (name === "Trades") {
      sheet.appendRow(["ID", "Timestamp", "Date", "Pair", "Outcome", "RR", "TimeSlot"]);
    } else if (name === "Pairs") {
      sheet.appendRow(["PairName"]);
      var defaults = ["XAUUSD", "NAS100", "US30", "EURUSD", "USDJPY", "GBPUSD", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD"];
      defaults.forEach(function(p) { sheet.appendRow([p]); });
    }
  }
  return sheet;
}

// Handle GET requests (fetching dashboard data)
function doGet(e) {
  try {
    var action = e.parameter.action;
    
    if (action === "getDashboardData") {
      return getDashboardData();
    }
    
    return buildResponse({ success: false, error: "Invalid action. Use action=getDashboardData" });
  } catch (err) {
    return buildResponse({ success: false, error: err.toString() });
  }
}

// Handle POST requests (actions: login, addTrade, deleteTrade)
function doPost(e) {
  try {
    var requestData;
    if (e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    } else {
      return buildResponse({ success: false, error: "Empty request body" });
    }
    
    var action = requestData.action;
    
    if (action === "login") {
      return handleLogin(requestData.username, requestData.password);
    } else if (action === "addTrade") {
      return handleAddTrade(requestData.trade);
    } else if (action === "deleteTrade") {
      return handleDeleteTrade(requestData.tradeId);
    }
    
    return buildResponse({ success: false, error: "Invalid action: " + action });
  } catch (err) {
    return buildResponse({ success: false, error: err.toString() });
  }
}

// Action Handlers

// 1. User login validation
function handleLogin(username, password) {
  if (!username || !password) {
    return buildResponse({ success: false, error: "Username and password are required" });
  }
  
  var sheet = getSheetByName("Users");
  var data = sheet.getDataRange().getValues();
  
  // Skip header row
  for (var i = 1; i < data.length; i++) {
    var sheetUser = String(data[i][0]).trim().toLowerCase();
    var sheetPass = String(data[i][1]).trim();
    
    if (sheetUser === username.toLowerCase() && sheetPass === password) {
      return buildResponse({ success: true, message: "Login successful", username: username });
    }
  }
  
  return buildResponse({ success: false, error: "Invalid username or password" });
}

// 2. Fetch all trade records and pair list
function getDashboardData() {
  var tradesSheet = getSheetByName("Trades");
  var pairsSheet = getSheetByName("Pairs");
  
  // Read Trades
  var tradesData = tradesSheet.getDataRange().getValues();
  var trades = [];
  if (tradesData.length > 1) {
    var headers = tradesData[0];
    for (var i = 1; i < tradesData.length; i++) {
      var row = tradesData[i];
      var trade = {};
      for (var j = 0; j < headers.length; j++) {
        var val = row[j];
        // Format date and timestamp to readable strings
        if (headers[j] === "Timestamp" || headers[j] === "Date") {
          if (val instanceof Date) {
            val = val.toISOString();
          }
        }
        trade[headers[j]] = val;
      }
      trades.push(trade);
    }
  }
  
  // Read Configured Pairs
  var pairsData = pairsSheet.getDataRange().getValues();
  var pairs = [];
  for (var k = 1; k < pairsData.length; k++) {
    if (pairsData[k][0]) {
      pairs.push(String(pairsData[k][0]).trim());
    }
  }
  
  return buildResponse({
    success: true,
    trades: trades,
    pairs: pairs.length > 0 ? pairs : ["XAUUSD", "NAS100", "US30", "EURUSD", "USDJPY", "GBPUSD", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD"]
  });
}

// 3. Log a new trade
function handleAddTrade(trade) {
  if (!trade || !trade.pair || !trade.outcome || !trade.rr || !trade.timeSlot) {
    return buildResponse({ success: false, error: "Missing required trade fields" });
  }
  
  var sheet = getSheetByName("Trades");
  
  // Generate Unique ID
  var tradeId = "T-" + new Date().getTime() + "-" + Math.floor(Math.random() * 1000);
  var timestamp = new Date().toISOString();
  var dateStr = trade.date || new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
  
  // Append new trade: ID, Timestamp, Date, Pair, Outcome, RR, TimeSlot
  sheet.appendRow([
    tradeId,
    timestamp,
    dateStr,
    trade.pair,
    trade.outcome, // "Profit" or "Loss"
    trade.rr,      // "1:1", "1:2", etc.
    trade.timeSlot // "10:30 AM", "2:30 PM", "6:30 PM"
  ]);
  
  return buildResponse({ success: true, message: "Trade added successfully", tradeId: tradeId });
}

// 4. Delete an existing trade
function handleDeleteTrade(tradeId) {
  if (!tradeId) {
    return buildResponse({ success: false, error: "Missing trade ID" });
  }
  
  var sheet = getSheetByName("Trades");
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(tradeId)) {
      sheet.deleteRow(i + 1); // Sheets is 1-indexed, header is row 1, data starts at index 1 -> matches index + 1
      return buildResponse({ success: true, message: "Trade deleted successfully" });
    }
  }
  
  return buildResponse({ success: false, error: "Trade not found" });
}
