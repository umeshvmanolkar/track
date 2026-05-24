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
      sheet.appendRow(["ID", "Timestamp", "Date", "Pair", "Outcome", "RR", "TimeSlot", "Username"]);
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
    var username = e.parameter.username;
    
    if (action === "getDashboardData") {
      return getDashboardData(username);
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
    var username = requestData.username;
    
    if (action === "login") {
      return handleLogin(requestData.username, requestData.password);
    } else if (action === "addTrade") {
      return handleAddTrade(requestData.trade, username);
    } else if (action === "deleteTrade") {
      return handleDeleteTrade(requestData.tradeId, username);
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
function getDashboardData(username) {
  if (!username) {
    return buildResponse({ success: false, error: "Username parameter is required" });
  }
  
  var tradesSheet = getSheetByName("Trades");
  var pairsSheet = getSheetByName("Pairs");
  
  // Read Trades
  var tradesData = tradesSheet.getDataRange().getValues();
  var trades = [];
  if (tradesData.length > 1) {
    var headers = tradesData[0];
    var usernameColIdx = headers.indexOf("Username");
    
    for (var i = 1; i < tradesData.length; i++) {
      var row = tradesData[i];
      
      // Filter by username (case-insensitive)
      if (usernameColIdx !== -1) {
        var rowUser = String(row[usernameColIdx] || "").trim().toLowerCase();
        if (rowUser !== username.toLowerCase()) {
          continue;
        }
      }
      
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
function handleAddTrade(trade, username) {
  if (!trade || !trade.pair || !trade.outcome || !trade.rr || !trade.timeSlot) {
    return buildResponse({ success: false, error: "Missing required trade fields" });
  }
  if (!username) {
    return buildResponse({ success: false, error: "Username is required to log a trade" });
  }
  
  var sheet = getSheetByName("Trades");
  var headers = sheet.getDataRange().getValues()[0];
  
  // If the sheet doesn't have the Username header, add it
  var usernameColIdx = headers.indexOf("Username");
  if (usernameColIdx === -1) {
    sheet.getRange(1, headers.length + 1).setValue("Username");
    usernameColIdx = headers.length;
  }
  
  // Generate Unique ID
  var tradeId = "T-" + new Date().getTime() + "-" + Math.floor(Math.random() * 1000);
  var timestamp = new Date().toISOString();
  var dateStr = trade.date || new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
  
  // Prepare row data according to columns
  var rowData = new Array(Math.max(8, headers.length));
  rowData[0] = tradeId;
  rowData[1] = timestamp;
  rowData[2] = dateStr;
  rowData[3] = trade.pair;
  rowData[4] = trade.outcome; // "Profit" or "Loss"
  rowData[5] = trade.rr;      // "1:1", "1:2", etc.
  rowData[6] = trade.timeSlot; // "10:30 AM", "2:30 PM", "6:30 PM"
  rowData[usernameColIdx] = username;
  
  sheet.appendRow(rowData);
  
  return buildResponse({ success: true, message: "Trade added successfully", tradeId: tradeId });
}

// 4. Delete an existing trade
function handleDeleteTrade(tradeId, username) {
  if (!tradeId) {
    return buildResponse({ success: false, error: "Missing trade ID" });
  }
  if (!username) {
    return buildResponse({ success: false, error: "Username is required to delete a trade" });
  }
  
  var sheet = getSheetByName("Trades");
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var usernameColIdx = headers.indexOf("Username");
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(tradeId)) {
      // If Username column exists, verify ownership
      if (usernameColIdx !== -1) {
        var tradeUser = String(data[i][usernameColIdx] || "").trim().toLowerCase();
        if (tradeUser !== username.toLowerCase()) {
          return buildResponse({ success: false, error: "Unauthorized to delete this trade" });
        }
      }
      sheet.deleteRow(i + 1); // Sheets is 1-indexed, header is row 1, data starts at index 1 -> matches index + 1
      return buildResponse({ success: true, message: "Trade deleted successfully" });
    }
  }
  
  return buildResponse({ success: false, error: "Trade not found" });
}
