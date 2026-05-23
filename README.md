# Forex & Indices Trading Journal

A modern, high-performance, dark-themed trading journal SPA designed to track trades for pairs like `XAUUSD`, `US30`, `NAS100`, `EURUSD`, and more. Built with vanilla HTML/CSS/JS and Chart.js, and powered by a secure Google Sheets backend via Google Apps Script. Ready for GitHub Pages deployment.

## Features
- **Modern Dark UI**: Premium dark glassmorphism styling with clean typography and responsive layout.
- **Analytics Widgets**: Win ratio gauge, performance R-multiples, profit factor, and total trades tracker.
- **Interactive Charts**: Cumulative equity curve (R-multiple), pair win/loss distribution, and session time analytics.
- **Easy Logging**: Interactive form to add multiple trades per day.
- **No-Build Deployment**: Static files ready to be hosted on GitHub Pages in seconds.
- **Demo Mode**: Built-in mock data mode so you can preview the dashboard immediately before setting up the backend.

---

## Setup Instructions

### 1. Create the Google Sheet
1. Open [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Rename the spreadsheet to `Trading Journal DB` (or any name you prefer).
3. Create **three sheets (tabs)** in the document, named exactly:
   - **`Users`**
   - **`Trades`**
   - **`Pairs`**

4. Set up the column headers in the first row of each tab:
   - **`Users`**:
     - Cell `A1`: `Username`
     - Cell `B1`: `Password`
     - *Add a row with your desired credentials in row 2 (e.g. `admin` and `password123`).*
   - **`Trades`**:
     - Cell `A1`: `ID`
     - Cell `B1`: `Timestamp`
     - Cell `C1`: `Date`
     - Cell `D1`: `Pair`
     - Cell `E1`: `Outcome` (Will store "Profit" or "Loss")
     - Cell `F1`: `RR` (Will store ratios like "1:1", "1:2", "1:3", "1:4")
     - Cell `G1`: `TimeSlot` (Will store "10:30 AM", "2:30 PM", or "6:30 PM")
   - **`Pairs`**:
     - Cell `A1`: `PairName`
     - *Add default pairs in column A (e.g., `XAUUSD`, `US30`, `NAS100`, `EURUSD`, `GBPUSD`, `USDJPY`).*

---

### 2. Deploy Google Apps Script Backend
1. In your Google Sheet, click **Extensions** -> **Apps Script**.
2. Delete any default code in the editor (`Code.gs`) and paste the contents of the `backend.js` file from this project repository.
3. Click the **Save** icon (disk button) or press `Ctrl + S`.
4. Click the **Deploy** button in the top right, then select **New deployment**.
5. Click the **Gear icon (Select type)** and choose **Web app**.
6. Configure the deployment settings:
   - **Description**: `Trading Journal API`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` *(This is required so your frontend can communicate with the sheet)*
7. Click **Deploy**.
8. **Authorize Access**: Google will ask you to authorize permissions. Click *Authorize access*, log into your account, click *Advanced* (small grey text), then click *Go to Untitled project (unsafe)*, and finally click *Allow*.
9. Copy the **Web App URL** generated in the deployment screen (it will end in `/exec`).

---

### 3. Connect Frontend to the Backend
1. Open the file `config.js` in your text editor.
2. Replace the empty string in `API_URL` with your copied Google Web App URL:
   ```javascript
   API_URL: "https://script.google.com/macros/s/YOUR_DEPLOIED_ID/exec",
   ```
3. Set `USE_MOCK_DATA` to `false` to switch from demo mode to your live Google Sheet:
   ```javascript
   USE_MOCK_DATA: false,
   ```

---

### 4. Deploying to GitHub Pages
Since this is a fully client-side static application, deployment is straightforward:
1. Initialize a Git repository in the folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. Create a repository on GitHub, add the remote origin, and push your code.
3. On GitHub, go to your repository's **Settings** tab.
4. Scroll down to **Pages** in the left sidebar.
5. Under **Build and deployment**, set the Source to **Deploy from a branch**.
6. Select your branch (e.g., `main` or `master`) and folder `/ (root)`, then click **Save**.
7. Wait 1-2 minutes. GitHub will display a live link to your deployed trading journal.
