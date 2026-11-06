/**
 * ====================================================================
 * APLIKASI KASIR TOKO ECER & GROSIR (OFFLINE-FIRST DENGAN GOOGLE SHEETS)
 * ====================================================================
 */

// Initial Sample Data (Rokok & Sembako Multi-Satuan)
const DEFAULT_PRODUCTS = [
  {
    id: "PROD-001",
    name: "Rokok Sampoerna Mild 16",
    category: "Rokok",
    baseUnit: "Batang",
    stock: 3200, // 2 Bal (1 Bal = 10 slop = 100 bks = 1600 btg)
    units: [
      { unitName: "Batang", multiplier: 1, sellPrice: 2500, buyPrice: 1900 },
      { unitName: "Bungkus", multiplier: 16, sellPrice: 35000, buyPrice: 29500 },
      { unitName: "Slop (10 Bks)", multiplier: 160, sellPrice: 345000, buyPrice: 292000 },
      { unitName: "Bal (10 Slop)", multiplier: 1600, sellPrice: 3400000, buyPrice: 2900000 }
    ]
  },
  {
    id: "PROD-002",
    name: "Rokok Djarum Super 12",
    category: "Rokok",
    baseUnit: "Batang",
    stock: 2400,
    units: [
      { unitName: "Batang", multiplier: 1, sellPrice: 2200, buyPrice: 1700 },
      { unitName: "Bungkus", multiplier: 12, sellPrice: 24000, buyPrice: 20000 },
      { unitName: "Slop (10 Bks)", multiplier: 120, sellPrice: 235000, buyPrice: 198000 },
      { unitName: "Bal (10 Slop)", multiplier: 1200, sellPrice: 2320000, buyPrice: 1950000 }
    ]
  },
  {
    id: "PROD-003",
    name: "Rokok Surya Pro 16",
    category: "Rokok",
    baseUnit: "Batang",
    stock: 1600,
    units: [
      { unitName: "Batang", multiplier: 1, sellPrice: 2300, buyPrice: 1800 },
      { unitName: "Bungkus", multiplier: 16, sellPrice: 33000, buyPrice: 28000 },
      { unitName: "Slop (10 Bks)", multiplier: 160, sellPrice: 325000, buyPrice: 275000 }
    ]
  },
  {
    id: "PROD-004",
    name: "Indomie Goreng Original",
    category: "Sembako",
    baseUnit: "Bungkus",
    stock: 200, // 5 Dus @ 40 bungkus
    units: [
      { unitName: "Bungkus", multiplier: 1, sellPrice: 3500, buyPrice: 2800 },
      { unitName: "Dus (40 Bks)", multiplier: 40, sellPrice: 125000, buyPrice: 110000 }
    ]
  },
  {
    id: "PROD-005",
    name: "Minyak Goreng Sania 2L",
    category: "Sembako",
    baseUnit: "Pouch",
    stock: 60, // 10 Dus @ 6 pouch
    units: [
      { unitName: "Pouch 2L", multiplier: 1, sellPrice: 36000, buyPrice: 31500 },
      { unitName: "Dus (6 Pouch)", multiplier: 6, sellPrice: 212000, buyPrice: 188000 }
    ]
  },
  {
    id: "PROD-006",
    name: "Beras Pandan Wangi Premium",
    category: "Sembako",
    baseUnit: "Kg",
    stock: 250,
    units: [
      { unitName: "1 Kg", multiplier: 1, sellPrice: 15500, buyPrice: 13500 },
      { unitName: "Karung 5 Kg", multiplier: 5, sellPrice: 75000, buyPrice: 66000 },
      { unitName: "Karung 25 Kg", multiplier: 25, sellPrice: 365000, buyPrice: 325000 }
    ]
  },
  {
    id: "PROD-007",
    name: "Aqua Air Mineral 600ml",
    category: "Minuman",
    baseUnit: "Botol",
    stock: 120, // 5 Dus @ 24 botol
    units: [
      { unitName: "Botol", multiplier: 1, sellPrice: 4000, buyPrice: 2700 },
      { unitName: "Dus (24 Botol)", multiplier: 24, sellPrice: 65000, buyPrice: 55000 }
    ]
  }
];

const DEFAULT_EXPENSES = [
  {
    id: "EXP-1",
    date: new Date().toISOString().split("T")[0],
    category: "Listrik",
    amount: 250000,
    notes: "Token listrik PLN bulanan",
    isSynced: true
  },
  {
    id: "EXP-2",
    date: new Date().toISOString().split("T")[0],
    category: "Wifi & Komunikasi",
    amount: 320000,
    notes: "Biaya langganan internet IndiHome",
    isSynced: true
  }
];

// Initial Owner Accounts (Dewa Ayu & Dode Eka)
const DEFAULT_OWNERS = [
  {
    ownerId: "OWNER-1",
    name: "Dewa Ayu",
    pin: "1234",
    role: "owner"
  },
  {
    ownerId: "OWNER-2",
    name: "Dode Eka",
    pin: "0987",
    role: "owner"
  }
];

// Initial Admin Accounts (Dibuat & Dikelola oleh Pemilik)
const DEFAULT_ADMINS = [
  {
    adminId: "ADMIN-1",
    name: "Admin Toko 1",
    pin: "3333",
    role: "admin",
    status: "active"
  }
];

// Initial Sample Users (Pegawai Kasir Dibuat oleh Pemilik atau Admin)
const DEFAULT_USERS = [
  {
    userId: "KASIR1",
    name: "Budi Santoso",
    pin: "1111",
    role: "cashier",
    assignedCashier: "Kasir 01",
    status: "active"
  },
  {
    userId: "KASIR2",
    name: "Siti Rahma",
    pin: "2222",
    role: "cashier",
    assignedCashier: "Kasir 02",
    status: "active"
  }
];

// APPLICATION CONTROLLER
class KasirApp {
  constructor() {
    this.currentCategory = "all";
    this.cart = []; // [{ product, unit, qty, subtotal, hppTotal }]
    this.isQuickStockMode = false;
    this.stockAdjustType = "add";
    this.cancelledInvoices = JSON.parse(localStorage.getItem("toko_cancelled_invoices") || "[]");
    this.activeCancelTx = null;
    this.currentLoginModalMode = "owner"; // 'owner' or 'admin'
    
    // Active Account Session (Hanya 1 akun aktif per-device: 'owner' | 'admin' | 'cashier' | null)
    this.activeSession = null;
    this.currentRole = "cashier"; // UI state
    this.isCashierLoggedIn = false;
    
    // Load persisted state from LocalStorage
    this.loadState();

    // Setup network listeners (Online/Offline)
    this.initNetworkMonitor();

    // Setup shortcuts and UI
    this.initKeyboardShortcuts();
    this.initYearOptions();
    
    // Render initial views
    this.updateRoleUI();
    this.updateCashierShiftUI();
    this.renderPosProducts();
    this.updateCartSummary();
    this.renderTransactionHistory();
    this.renderExpensesTable();
    this.renderProductMasterTable();
    this.renderEmployeeTable();
    this.updatePendingCount();

    // Prompt login jika belum ada akun aktif di device ini
    if (!this.activeSession || this.activeSession.type === 'none') {
      setTimeout(() => {
        this.openRoleChoiceModal();
      }, 500);
    }

    // Auto-sync if online on start
    if (navigator.onLine && this.settings.gasUrl) {
      setTimeout(() => this.syncPendingData(), 2000);
    }
  }

  // ==================== STATE MANAGEMENT ====================
  loadState() {
    const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbyekZbA1vNZc-lbIvlkFqGBbV8v2KR5g8XTOe8SwdnC6z7SZEcHhemTKzX6npjgsfZwFw/exec";

    // 1. Settings
    const savedSettings = localStorage.getItem("toko_settings");
    this.settings = savedSettings ? JSON.parse(savedSettings) : {
      storeName: "Toko Berkah Grosir & Ecer",
      storePhone: "0812-3456-7890",
      storeAddress: "Jl. Pasar Lama No. 12, Sentra Grosir",
      gasUrl: DEFAULT_GAS_URL
    };

    // If existing saved settings has empty gasUrl, update it to user's URL
    if (!this.settings.gasUrl) {
      this.settings.gasUrl = DEFAULT_GAS_URL;
      this.saveSettingsLocal();
    }

    // Apply store name in header
    const storeHeader = document.getElementById("headerStoreName");
    if (storeHeader) storeHeader.textContent = this.settings.storeName;

    // 1B. Owners (Dewa Ayu: 1234, Dode Eka: 0987)
    const savedOwners = localStorage.getItem("toko_owners");
    this.owners = savedOwners ? JSON.parse(savedOwners) : DEFAULT_OWNERS;
    if (!savedOwners) this.saveOwners();

    // 1C. Admins Toko
    const savedAdmins = localStorage.getItem("toko_admins");
    this.admins = savedAdmins ? JSON.parse(savedAdmins) : DEFAULT_ADMINS;
    if (!savedAdmins) this.saveAdmins();

    // Fill settings inputs
    this.fillSettingsForm();

    // 2. Products (Pastikan selalu fallback ke DEFAULT_PRODUCTS jika data kosong atau corrupt)
    const savedProducts = localStorage.getItem("toko_products");
    let loadedProducts = null;
    if (savedProducts) {
      try {
        loadedProducts = JSON.parse(savedProducts);
      } catch (e) {
        loadedProducts = null;
      }
    }
    this.products = (Array.isArray(loadedProducts) && loadedProducts.length > 0) ? loadedProducts : DEFAULT_PRODUCTS;

    // 3. Transactions
    const savedTx = localStorage.getItem("toko_transactions");
    this.transactions = savedTx ? JSON.parse(savedTx) : [];

    // 4. Expenses
    const savedExpenses = localStorage.getItem("toko_expenses");
    this.expenses = savedExpenses ? JSON.parse(savedExpenses) : DEFAULT_EXPENSES;

    // 5. Users (Akun Kasir & Admin Toko yang Dikelola Pemilik)
    const savedUsers = localStorage.getItem("toko_users");
    this.users = savedUsers ? JSON.parse(savedUsers) : DEFAULT_USERS;

    // Sinkronkan akun admin ke dalam daftar users agar tampil di tabel Kelola Admin
    this.admins.forEach(adm => {
      const existing = this.users.find(u => u.userId === adm.adminId);
      if (!existing) {
        this.users.unshift({
          userId: adm.adminId,
          name: adm.name,
          pin: adm.pin,
          role: "admin",
          assignedCashier: "Kasir Utama (Admin)",
          status: adm.status || "active"
        });
      } else {
        existing.role = "admin";
        if (adm.pin) existing.pin = adm.pin;
        if (adm.name) existing.name = adm.name;
      }
    });

    // 6. Active Single-Session per Device (Hanya 1 Akun Aktif: Owner / Admin / Kasir)
    const savedActiveSession = localStorage.getItem("toko_active_session");
    if (savedActiveSession) {
      try {
        this.activeSession = JSON.parse(savedActiveSession);
      } catch (e) {
        this.activeSession = null;
      }
    }

    if (this.activeSession && (this.activeSession.type === "owner" || this.activeSession.type === "admin")) {
      this.currentRole = this.activeSession.type; // 'owner' or 'admin'
      this.isCashierLoggedIn = false;
      this.cashierSession = {
        userId: this.activeSession.id || this.activeSession.userId || "STAFF",
        employeeName: this.activeSession.name,
        cashierNumber: this.activeSession.type === "owner" ? "Kasir Utama (Pemilik)" : "Kasir Utama (Admin)",
        shift: this.activeSession.type === "owner" ? "Owner Shift" : "Admin Shift",
        shiftStart: this.activeSession.loginTime || new Date().toISOString()
      };
    } else if (this.activeSession && this.activeSession.type === "cashier") {
      this.currentRole = "cashier";
      this.isCashierLoggedIn = true;
      this.cashierSession = {
        userId: this.activeSession.userId,
        employeeName: this.activeSession.name,
        cashierNumber: this.activeSession.cashierNumber || "Kasir 01",
        shift: this.activeSession.shift || "Shift 1 (Pagi)",
        shiftStart: this.activeSession.shiftStart || new Date().toISOString()
      };
    } else {
      this.activeSession = null;
      this.currentRole = "cashier";
      this.isCashierLoggedIn = false;
      this.cashierSession = null;
    }

    // Save defaults back if newly initiated
    if (!savedProducts) this.saveProducts();
    if (!savedExpenses) this.saveExpenses();
    if (!savedUsers) this.saveUsers();
  }

  saveOwners() {
    localStorage.setItem("toko_owners", JSON.stringify(this.owners));
  }

  saveAdmins() {
    localStorage.setItem("toko_admins", JSON.stringify(this.admins));
  }

  saveActiveSession(session) {
    this.activeSession = session;
    if (session) {
      localStorage.setItem("toko_active_session", JSON.stringify(session));
    } else {
      localStorage.removeItem("toko_active_session");
      localStorage.removeItem("toko_cashier_logged_in");
      localStorage.removeItem("toko_current_session");
    }
  }

  saveUsers() {
    localStorage.setItem("toko_users", JSON.stringify(this.users));
  }

  saveCashierSession() {
    localStorage.setItem("toko_current_session", JSON.stringify(this.cashierSession));
    this.updateCashierShiftUI();
  }

  saveProducts() {
    localStorage.setItem("toko_products", JSON.stringify(this.products));
  }

  saveTransactions() {
    try {
      localStorage.setItem("toko_transactions", JSON.stringify(this.transactions));
    } catch (err) {
      console.error("Local save error:", err);
      this.showToast("Penyimpanan lokal penuh! Segera sinkronkan atau ekspor cadangan data.", "warning");
    }
    this.updatePendingCount();
  }

  saveExpenses() {
    localStorage.setItem("toko_expenses", JSON.stringify(this.expenses));
    this.updatePendingCount();
  }

  saveSettingsLocal() {
    localStorage.setItem("toko_settings", JSON.stringify(this.settings));
  }

  // ==================== NETWORK & OFFLINE MONITOR ====================
  initNetworkMonitor() {
    this.isOnlineState = null;

    // 1. Browser Event Listeners
    window.addEventListener("online", () => {
      this.checkNetworkStatus(false);
    });

    window.addEventListener("offline", () => {
      // Immediate reaction if browser fires event
      this.isOnlineState = false;
      this.updateNetworkUI(false);
      this.showToast("Komputer Offline! Data transaksi tetap disimpan di penyimpanan lokal.", "warning");
    });
    
    // 2. Initial Probe
    this.checkNetworkStatus(true);

    // 3. Active Heartbeat Probe (every 3 seconds)
    // In many browsers and macOS, turning off WiFi does not always trigger navigator.onLine event
    // Active ping reliably detects WiFi disconnection within ~3 seconds!
    setInterval(() => {
      this.checkNetworkStatus(true);
    }, 3500);
  }

  async checkInternetAccess(timeoutMs = 2000) {
    // If browser already flags offline, it's definitely offline
    if (!navigator.onLine) return false;

    // Actively probe real internet reachability
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Probe Google's zero-byte connectivity endpoint with cache-busting
      await fetch(`https://www.gstatic.com/generate_204?_=${Date.now()}`, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-store",
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return true;
    } catch (err) {
      // Secondary probe using user's Google Apps Script ping if available
      if (this.settings && this.settings.gasUrl) {
        try {
          const controller2 = new AbortController();
          const timeoutId2 = setTimeout(() => controller2.abort(), 1800);
          await fetch(`${this.settings.gasUrl}?action=ping&_=${Date.now()}`, {
            method: "GET",
            mode: "no-cors",
            cache: "no-store",
            signal: controller2.signal
          });
          clearTimeout(timeoutId2);
          return true;
        } catch (err2) {
          return false;
        }
      }
      return false;
    }
  }

  updateNetworkUI(isOnline) {
    const badges = document.querySelectorAll(".network-status-badge");
    const dots = document.querySelectorAll(".status-dot");
    const texts = document.querySelectorAll(".status-text");
    const offlineBanner = document.getElementById("offlineNoticeBanner");

    if (offlineBanner) {
      if (isOnline) {
        offlineBanner.classList.add("hidden");
      } else {
        offlineBanner.classList.remove("hidden");
      }
    }

    badges.forEach(badge => {
      const isMobile = badge.id.includes("Mobile") || badge.classList.contains("h-7");
      if (isOnline) {
        badge.className = `network-status-badge flex items-center space-x-1 sm:space-x-1.5 ${isMobile ? 'h-7 px-2 text-[10px]' : 'h-9 px-3 text-xs'} font-bold sm:font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 transition-all duration-300`;
      } else {
        badge.className = `network-status-badge flex items-center space-x-1 sm:space-x-1.5 ${isMobile ? 'h-7 px-2 text-[10px]' : 'h-9 px-3 text-xs'} font-bold sm:font-semibold bg-rose-100 text-rose-800 border border-rose-300 shrink-0 transition-all duration-300`;
      }
    });

    dots.forEach(dot => {
      if (isOnline) {
        dot.className = "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse status-dot";
      } else {
        dot.className = "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 status-dot";
      }
    });

    texts.forEach(txt => {
      txt.textContent = isOnline ? "Online" : "Offline";
    });
  }

  async checkNetworkStatus(silent = false) {
    const isOnline = await this.checkInternetAccess(2000);
    const previousStatus = this.isOnlineState;
    this.isOnlineState = isOnline;

    this.updateNetworkUI(isOnline);

    // Transition: Offline -> Online
    if (previousStatus === false && isOnline === true) {
      this.showToast("Koneksi Internet Terhubung! Mengupload data offline ke database...", "info");
      this.autoRefreshAfterTransaction();
    }
    // Transition: Online -> Offline
    else if (previousStatus === true && isOnline === false && !silent) {
      this.showToast("Komputer Offline! Data transaksi tetap disimpan di penyimpanan lokal.", "warning");
    }

    return isOnline;
  }

  async refreshAll() {
    const icon = document.getElementById("refreshBtnIcon");
    if (icon) icon.classList.add("fa-spin");

    // 1. Actively probe network status immediately
    const isOnline = await this.checkNetworkStatus(false);

    // 2. Re-render UI views
    this.renderPosProducts();
    this.renderCart();
    this.renderTransactionHistory();
    this.renderExpensesTable();
    this.renderProductMasterTable();
    if (this.currentRole === "admin" || this.currentRole === "owner") {
      this.renderProfitLoss();
    }

    // 3. Sync pending data if online
    if (isOnline && this.settings.gasUrl) {
      await this.syncPendingData();
    }

    if (isOnline) {
      this.showToast("Data & status Online berhasil diperbarui!", "success");
    } else {
      this.showToast("Komputer Offline! Mode penyimpanan lokal aktif.", "warning");
    }

    setTimeout(() => {
      if (icon) icon.classList.remove("fa-spin");
    }, 600);
  }

  updatePendingCount() {
    const pendingTx = this.transactions.filter(t => !t.isSynced).length;
    const pendingExp = this.expenses.filter(e => !e.isSynced).length;
    const totalPending = pendingTx + pendingExp;

    const syncBtn = document.getElementById("syncNowBtn");
    const countBadge = document.getElementById("pendingCountBadge");
    
    if (totalPending > 0) {
      syncBtn.classList.remove("hidden");
      countBadge.textContent = totalPending;
    } else {
      syncBtn.classList.add("hidden");
    }
  }

  // ==================== ROLE & SINGLE-ACCOUNT AUTHENTICATION ====================
  openRoleChoiceModal() {
    if (this.activeSession && (this.activeSession.type === "owner" || this.activeSession.type === "admin")) {
      const roleTitle = this.activeSession.type === "owner" ? "Pemilik" : "Admin";
      if (confirm(`Akun ${roleTitle} "${this.activeSession.name}" sedang aktif.\n\nApakah Anda ingin keluar (Logout)?`)) {
        this.logoutActiveAccount();
      }
      return;
    }
    const modal = document.getElementById("loginChoiceModal");
    if (modal) modal.classList.remove("hidden");
  }

  closeLoginChoiceModal() {
    const modal = document.getElementById("loginChoiceModal");
    if (modal) modal.classList.add("hidden");
  }

  chooseLoginRole(role) {
    this.closeLoginChoiceModal();
    if (role === "owner") {
      this.openPinModalForRole("owner");
    } else if (role === "admin") {
      this.openPinModalForRole("admin");
    } else if (role === "cashier") {
      this.openEmployeeLoginModal();
    }
  }

  openPinModalForRole(role) {
    this.currentLoginModalMode = role; // 'owner' or 'admin'
    const modal = document.getElementById("pinModal");
    const select = document.getElementById("adminSelect");
    const pinField = document.getElementById("inputPinField");
    const err = document.getElementById("pinErrorMsg");
    const title = document.getElementById("pinModalTitle");
    const subtitle = document.getElementById("pinModalSubtitle");
    const selectLabel = document.getElementById("pinModalSelectLabel");
    const iconBox = document.getElementById("pinModalIconBox");
    const icon = document.getElementById("pinModalIcon");
    const submitBtn = document.getElementById("pinModalSubmitBtn");

    if (err) err.classList.add("hidden");
    if (pinField) pinField.value = "";

    if (role === "owner") {
      const ownerNames = (this.owners || []).map(o => o.name).join(" / ");
      if (title) title.textContent = "Login Pemilik Toko";
      if (subtitle) subtitle.textContent = `Pilih akun Pemilik (${ownerNames}) dan masukkan PIN.`;
      if (selectLabel) selectLabel.textContent = "Pilih Akun Pemilik:";
      if (iconBox) iconBox.className = "w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner";
      if (icon) icon.className = "fa-solid fa-crown text-xl";
      if (submitBtn) submitBtn.className = "flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs shadow-md transition";
      
      if (select) {
        select.innerHTML = `<option value="" disabled selected>-- Pilih Nama --</option>` + this.owners.map(o => `
          <option value="${o.ownerId}">${o.name} (Pemilik Toko)</option>
        `).join("");
      }
    } else {
      // Role admin
      if (title) title.textContent = "Login Admin Toko";
      if (subtitle) subtitle.textContent = "Pilih akun Admin dan masukkan PIN untuk mengelola kasir & barang.";
      if (selectLabel) selectLabel.textContent = "Pilih Akun Admin:";
      if (iconBox) iconBox.className = "w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner";
      if (icon) icon.className = "fa-solid fa-user-shield text-xl";
      if (submitBtn) submitBtn.className = "flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition";

      // Ambil daftar admin dari data admin dan users yang berstatus admin
      const allAdmins = [...this.admins];
      this.users.filter(u => u.role === "admin" && u.status !== "inactive").forEach(u => {
        if (!allAdmins.some(a => a.adminId === u.userId)) {
          allAdmins.push({ adminId: u.userId, name: u.name, pin: u.pin, role: "admin" });
        }
      });

      if (select) {
        select.innerHTML = allAdmins.length > 0
          ? `<option value="" disabled selected>-- Pilih Nama --</option>` + allAdmins.map(a => `<option value="${a.adminId}">${a.name} (Admin Toko)</option>`).join("")
          : `<option value="">Belum ada akun Admin (Dibuat oleh Pemilik)</option>`;
      }
    }

    if (modal) modal.classList.remove("hidden");
    setTimeout(() => {
      if (select && !select.value) select.focus();
      else if (pinField) pinField.focus();
    }, 100);
  }

  openAdminPinModal() {
    this.openPinModalForRole("admin");
  }

  openRoleModal() {
    this.openRoleChoiceModal();
  }

  closeRoleModal() {
    const modal = document.getElementById("pinModal");
    if (modal) modal.classList.add("hidden");
  }

  verifyPin(e) {
    if (e) e.preventDefault();
    const select = document.getElementById("adminSelect");
    const pinField = document.getElementById("inputPinField");
    const err = document.getElementById("pinErrorMsg");
    const enteredPin = pinField ? pinField.value.trim() : "";
    const selectedId = select ? select.value : "";

    if (!selectedId) {
      this.showToast("Silakan pilih nama terlebih dahulu!", "warning");
      if (select) select.focus();
      return;
    }

    if (this.currentLoginModalMode === "owner") {
      // Verifikasi Pemilik
      const matchedOwner = this.owners.find(o => o.ownerId === selectedId && o.pin === enteredPin);

      if (matchedOwner) {
        const ownerSession = {
          type: "owner",
          id: matchedOwner.ownerId,
          name: matchedOwner.name,
          role: "owner",
          loginTime: new Date().toISOString()
        };

        this.saveActiveSession(ownerSession);
        this.currentRole = "owner";
        this.isCashierLoggedIn = false;
        this.cashierSession = {
          userId: matchedOwner.ownerId,
          employeeName: matchedOwner.name,
          cashierNumber: "Kasir Utama (Pemilik)",
          shift: "Owner Shift",
          shiftStart: new Date().toISOString()
        };

        this.closeRoleModal();
        this.updateRoleUI();
        this.updateCashierShiftUI();
        this.fillSettingsForm();
        this.showToast(`Login Berhasil! Selamat datang Pemilik, ${matchedOwner.name}.`, "success");
        return;
      }
    } else {
      // Verifikasi Admin Toko
      const allAdmins = [...this.admins];
      this.users.filter(u => u.role === "admin" && u.status !== "inactive").forEach(u => {
        if (!allAdmins.some(a => a.adminId === u.userId)) {
          allAdmins.push({ adminId: u.userId, name: u.name, pin: u.pin, role: "admin" });
        }
      });

      let matchedAdmin = null;
      if (selectedId) {
        matchedAdmin = allAdmins.find(a => a.adminId === selectedId && a.pin === enteredPin);
      } else {
        matchedAdmin = allAdmins.find(a => a.pin === enteredPin);
      }

      if (matchedAdmin) {
        const adminSession = {
          type: "admin",
          id: matchedAdmin.adminId,
          name: matchedAdmin.name,
          role: "admin",
          loginTime: new Date().toISOString()
        };

        this.saveActiveSession(adminSession);
        this.currentRole = "admin";
        this.isCashierLoggedIn = false;
        this.cashierSession = {
          userId: matchedAdmin.adminId,
          employeeName: matchedAdmin.name,
          cashierNumber: "Kasir Utama (Admin)",
          shift: "Admin Shift",
          shiftStart: new Date().toISOString()
        };

        this.closeRoleModal();
        this.updateRoleUI();
        this.updateCashierShiftUI();
        this.showToast(`Login Admin Berhasil! Selamat datang, ${matchedAdmin.name}.`, "success");
        return;
      }
    }

    if (err) err.classList.remove("hidden");
    if (pinField) {
      pinField.value = "";
      pinField.focus();
    }
  }

  logoutActiveAccount() {
    const prevName = this.activeSession ? this.activeSession.name : "Pengguna";
    this.saveActiveSession(null);
    this.currentRole = "cashier";
    this.isCashierLoggedIn = false;
    this.cashierSession = null;
    this.cart = [];

    this.updateRoleUI();
    this.updateCashierShiftUI();
    this.renderCart();
    this.switchTab("pos");
    this.showToast(`Akun ${prevName} telah logout. Silakan login kembali.`, "info");

    setTimeout(() => {
      this.openRoleChoiceModal();
    }, 400);
  }

  updateRoleUI() {
    const roleBadge = document.getElementById("currentRoleBadge");
    const roleBtnTexts = document.querySelectorAll(".role-btn-text");
    const roleIcons = document.querySelectorAll(".role-icon");
    const roleToggleBtns = document.querySelectorAll(".role-toggle-btn");
    const managerTabs = document.querySelectorAll(".manager-tab");
    const ownerTabs = document.querySelectorAll(".owner-tab");
    const ownerPinBox = document.getElementById("settingOwnerPinContainer");

    if (this.activeSession && (this.activeSession.type === "owner" || this.activeSession.type === "admin")) {
      const isOwner = this.activeSession.type === "owner";
      const accountName = this.activeSession.name || (isOwner ? "Pemilik" : "Admin");
      
      if (roleBadge) {
        roleBadge.textContent = isOwner ? `👑 Pemilik: ${accountName}` : `🛡️ Admin: ${accountName}`;
        roleBadge.className = isOwner 
          ? "font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded text-[10px] sm:text-[11px] border border-purple-300"
          : "font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded text-[10px] sm:text-[11px] border border-blue-300";
      }

      roleBtnTexts.forEach(btn => btn.textContent = `Keluar (${accountName})`);
      roleIcons.forEach(icon => icon.className = "fa-solid fa-right-from-bracket text-purple-200 role-icon");
      
      roleToggleBtns.forEach(btn => {
        const isMobile = btn.classList.contains("h-7");
        const bgClass = isOwner ? "bg-purple-700 hover:bg-purple-800" : "bg-blue-600 hover:bg-blue-700";
        btn.className = `role-toggle-btn flex items-center space-x-1 sm:space-x-1.5 ${isMobile ? 'h-7 px-2 text-[10px]' : 'h-9 px-3 text-xs'} ${bgClass} text-white rounded-lg font-bold sm:font-semibold shadow-xs transition active:scale-95 shrink-0`;
      });

      // Tampilkan tab Laba Rugi, Master Produk, dan Kelola Pegawai untuk Pemilik maupun Admin
      managerTabs.forEach(el => el.classList.remove("hidden"));

      // Tampilkan Pengaturan Database HANYA untuk Pemilik (HILANG saat login Admin)
      if (isOwner) {
        ownerTabs.forEach(el => el.classList.remove("hidden"));
        if (ownerPinBox) ownerPinBox.classList.remove("hidden");
      } else {
        ownerTabs.forEach(el => el.classList.add("hidden"));
        if (ownerPinBox) ownerPinBox.classList.add("hidden");
      }
    } else {
      const cashierName = (this.activeSession && this.activeSession.type === "cashier") ? this.activeSession.name : null;
      if (roleBadge) {
        if (cashierName) {
          roleBadge.textContent = `Kasir: ${cashierName}`;
          roleBadge.className = "font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] sm:text-[11px] border border-emerald-200";
        } else {
          roleBadge.textContent = "Belum Login";
          roleBadge.className = "font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] sm:text-[11px] border border-amber-200";
        }
      }
      roleBtnTexts.forEach(btn => {
        const isMobile = btn.closest(".md\\:hidden");
        btn.textContent = isMobile ? "Masuk" : "Login Akses";
      });
      roleIcons.forEach(icon => icon.className = "fa-solid fa-user-shield text-indigo-300 role-icon");
      roleToggleBtns.forEach(btn => {
        const isMobile = btn.classList.contains("h-7");
        btn.className = `role-toggle-btn flex items-center space-x-1 sm:space-x-1.5 ${isMobile ? 'h-7 px-2 text-[10px]' : 'h-9 px-3 text-xs'} bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold sm:font-semibold shadow-xs transition active:scale-95 shrink-0`;
      });
      managerTabs.forEach(el => el.classList.add("hidden"));
      ownerTabs.forEach(el => el.classList.add("hidden"));
      if (ownerPinBox) ownerPinBox.classList.add("hidden");
    }
  }

  // ==================== CASHIER USER LOGIN & SHIFT MANAGEMENT ====================
  updateCashierShiftUI() {
    const cashierContainer = document.getElementById("cashierStatusContainer");
    const cartCashierBar = document.getElementById("cartCashierBarContainer");

    const isOwner = this.activeSession && this.activeSession.type === "owner";
    const isAdmin = this.activeSession && this.activeSession.type === "admin";

    if (isOwner || isAdmin) {
      const roleTitle = isOwner ? "Pemilik" : "Admin";
      const iconClass = isOwner ? "fa-crown text-purple-600" : "fa-user-shield text-blue-600";
      const bgBadge = isOwner ? "bg-purple-50 border-purple-200 text-purple-950" : "bg-blue-50 border-blue-200 text-blue-950";
      const tagBg = isOwner ? "bg-purple-700" : "bg-blue-600";
      const tagText = isOwner ? "Akses Penuh" : "Admin Toko";
      const name = this.activeSession.name || roleTitle;

      // --- HEADER: ACTIVE OWNER / ADMIN BADGE ---
      if (cashierContainer) {
        cashierContainer.innerHTML = `
          <div class="flex items-center justify-between w-full md:w-auto h-8 sm:h-9 ${bgBadge} border rounded-lg shadow-2xs overflow-hidden max-w-full">
            <div class="flex items-center space-x-1.5 px-2.5 h-full text-[11px] sm:text-xs font-bold truncate">
              <i class="fa-solid ${iconClass} shrink-0"></i>
              <span class="truncate">${name}</span>
              <span class="text-slate-300">•</span>
              <span class="${tagBg} text-white text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">${tagText}</span>
            </div>
            <button onclick="app.logoutActiveAccount()" class="px-2.5 h-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-l border-slate-200 transition shrink-0" title="Keluar / Logout Akun ${roleTitle}">
              <i class="fa-solid fa-power-off text-xs"></i>
            </button>
          </div>
        `;
      }

      // --- CART: ACTIVE OWNER / ADMIN BAR ---
      if (cartCashierBar) {
        cartCashierBar.innerHTML = `
          <div class="px-3.5 py-2 ${isOwner ? 'bg-purple-50/70 border-purple-100' : 'bg-blue-50/70 border-blue-100'} border-b flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700">
            <div class="flex items-center gap-1.5 min-w-0 flex-1">
              <i class="fa-solid ${iconClass} text-xs shrink-0"></i>
              <span class="truncate">Petugas: <b class="text-slate-900">${name} (${roleTitle})</b></span>
              <span class="text-slate-300">•</span>
              <span class="font-bold ${isOwner ? 'text-purple-700' : 'text-blue-700'} shrink-0">${isOwner ? '👑 Kasir Utama (Pemilik)' : '🛡️ Kasir Utama (Admin)'}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0 ml-auto">
              <button onclick="app.openShiftReportModal()" class="text-[10px] ${isOwner ? 'text-purple-700 hover:text-purple-900 bg-purple-100/70 border-purple-200' : 'text-blue-700 hover:text-blue-900 bg-blue-100/70 border-blue-200'} px-2 py-0.5 rounded-md border font-bold transition" title="Lihat rekap transaksi">
                <i class="fa-solid fa-calculator mr-1"></i>Rekap Kasir
              </button>
            </div>
          </div>
        `;
      }
    } else if (this.isCashierLoggedIn && this.cashierSession) {
      // --- HEADER: ACTIVE CASHIER BADGE ---
      if (cashierContainer) {
        const shortShift = (this.cashierSession.shift || "Shift 1").split(" ")[0];
        cashierContainer.innerHTML = `
          <div class="flex items-center justify-between w-full md:w-auto h-8 sm:h-9 bg-indigo-50 border border-indigo-200 rounded-lg shadow-2xs overflow-hidden max-w-full">
            <button onclick="app.openEmployeeLoginModal()" class="flex items-center space-x-1.5 px-2.5 h-full hover:bg-indigo-100 text-indigo-950 text-[11px] sm:text-xs font-semibold transition active:scale-95 min-w-0 flex-1 truncate" title="Ganti Petugas Kasir / Shift">
              <i class="fa-solid fa-id-badge text-indigo-600 shrink-0"></i>
              <span class="truncate font-bold">${this.cashierSession.employeeName || 'Pegawai 1'}</span>
              <span class="text-indigo-300">•</span>
              <span class="text-indigo-700 shrink-0">${this.cashierSession.cashierNumber || 'Kasir 01'}</span>
              <span class="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">${shortShift}</span>
            </button>
            <button onclick="app.logoutCashier()" class="px-2.5 h-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-l border-indigo-200 transition shrink-0" title="Logout / Keluar Petugas Kasir">
              <i class="fa-solid fa-power-off text-xs"></i>
            </button>
          </div>
        `;
      }

      // --- CART: ACTIVE CASHIER BAR ---
      if (cartCashierBar) {
        cartCashierBar.innerHTML = `
          <div class="px-3.5 py-2 bg-indigo-50/50 border-b border-indigo-100/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
            <div class="flex items-center gap-1.5 min-w-0 flex-1">
              <i class="fa-solid fa-user-tag text-indigo-600 text-xs shrink-0"></i>
              <span class="truncate">Petugas: <b class="text-slate-900">${this.cashierSession.cashierNumber || 'Kasir 01'} (${this.cashierSession.employeeName || 'Pegawai 1'})</b></span>
              <span class="text-slate-300">•</span>
              <span class="font-bold text-indigo-700 shrink-0">${(this.cashierSession.shift || 'Shift 1').split(' ')[0]}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0 ml-auto">
              <button onclick="app.openShiftReportModal()" class="text-[10px] text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 font-bold transition" title="Lihat rekap penjualan & uang di laci shift ini">
                <i class="fa-solid fa-calculator mr-1"></i>Rekap Shift
              </button>
              <button onclick="app.openEmployeeLoginModal()" class="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline" title="Ganti kasir / shift">
                Ganti
              </button>
            </div>
          </div>
        `;
      }
    } else {
      // --- HEADER: LOGIN PROMPT (BELUM LOGIN) ---
      if (cashierContainer) {
        cashierContainer.innerHTML = `
          <button onclick="app.openRoleChoiceModal()" class="w-full md:w-auto flex items-center justify-center space-x-1.5 h-8 sm:h-9 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-[11px] sm:text-xs font-bold shadow-xs transition active:scale-95" title="Klik untuk Login Pemilik, Admin, atau Kasir">
            <i class="fa-solid fa-lock text-amber-100"></i>
            <span>Pilih Login Akun</span>
          </button>
        `;
      }

      // --- CART: CASHIER WARNING (BELUM LOGIN) ---
      if (cartCashierBar) {
        cartCashierBar.innerHTML = `
          <div class="px-3.5 py-2 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between gap-2 text-[11px] text-amber-900">
            <div class="flex items-center gap-1.5 min-w-0">
              <i class="fa-solid fa-triangle-exclamation text-amber-600 shrink-0"></i>
              <span class="truncate"><b class="font-bold">Belum Login:</b> Silakan login akun untuk mulai transaksi</span>
            </div>
            <button onclick="app.openRoleChoiceModal()" class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-md text-[10px] shadow-2xs shrink-0 transition">
              Login Akun
            </button>
          </div>
        `;
      }
    }
  }

  openEmployeeLoginModal() {
    const modal = document.getElementById("employeeLoginModal");
    const select = document.getElementById("empLoginSelect");
    const pinInput = document.getElementById("empLoginPin");
    const err = document.getElementById("empLoginErrorMsg");
    const shiftSelect = document.getElementById("empLoginShift");
    const cashierSelect = document.getElementById("empLoginCashierNo");

    if (err) err.classList.add("hidden");
    if (pinInput) pinInput.value = "";

    // Populate active cashier users only with "-- Pilih Nama --" placeholder first
    const activeUsers = this.users.filter(u => u.status !== "inactive" && u.role !== "admin");
    if (select) {
      select.innerHTML = `<option value="" disabled selected>-- Pilih Nama --</option>` + activeUsers.map(u => `
        <option value="${u.userId}">
          ${u.name} (${u.userId}) - ${u.assignedCashier || 'Bebas'}
        </option>
      `).join("");
    }

    if (shiftSelect) shiftSelect.value = (this.cashierSession && this.cashierSession.shift) ? this.cashierSession.shift : "Shift 1 (Pagi)";
    if (cashierSelect) cashierSelect.value = (this.cashierSession && this.cashierSession.cashierNumber) ? this.cashierSession.cashierNumber : "Kasir 01";

    this.onEmpLoginSelectChange();
    if (modal) modal.classList.remove("hidden");
    setTimeout(() => {
      if (select) select.focus();
    }, 100);
  }

  closeEmployeeLoginModal() {
    const modal = document.getElementById("employeeLoginModal");
    if (modal) modal.classList.add("hidden");
  }

  onEmpLoginSelectChange() {
    const select = document.getElementById("empLoginSelect");
    const cashierSelect = document.getElementById("empLoginCashierNo");
    const pinInput = document.getElementById("empLoginPin");
    if (!select || !cashierSelect) return;

    const user = this.users.find(u => u.userId === select.value);
    if (user && user.assignedCashier && user.assignedCashier !== "Bebas") {
      cashierSelect.value = user.assignedCashier;
    }
    if (select.value && pinInput) {
      pinInput.focus();
    }
  }

  processEmployeeLogin(e) {
    if (e) e.preventDefault();
    const select = document.getElementById("empLoginSelect");
    const pinInput = document.getElementById("empLoginPin");
    const cashierSelect = document.getElementById("empLoginCashierNo");
    const shiftSelect = document.getElementById("empLoginShift");
    const err = document.getElementById("empLoginErrorMsg");

    const userId = select ? select.value : "";
    const enteredPin = pinInput ? pinInput.value.trim() : "";

    if (!userId) {
      this.showToast("Silakan pilih nama pegawai terlebih dahulu!", "warning");
      if (select) select.focus();
      return;
    }

    const user = this.users.find(u => u.userId === userId && u.status !== "inactive");
    if (!user || user.pin !== enteredPin) {
      if (err) err.classList.remove("hidden");
      if (pinInput) {
        pinInput.value = "";
        pinInput.focus();
      }
      return;
    }

    // Set new session (HANYA 1 AKUN AKTIF PER DEVICE)
    const cashierSession = {
      type: "cashier",
      userId: user.userId,
      name: user.name,
      employeeName: user.name,
      cashierNumber: (cashierSelect ? cashierSelect.value : "") || user.assignedCashier || "Kasir 01",
      shift: shiftSelect ? shiftSelect.value : "Shift 1 (Pagi)",
      shiftStart: new Date().toISOString()
    };

    this.saveActiveSession(cashierSession);
    this.currentRole = "cashier";
    this.isCashierLoggedIn = true;
    this.cashierSession = cashierSession;

    this.closeEmployeeLoginModal();
    this.updateRoleUI();
    this.updateCashierShiftUI();
    this.switchTab("pos");
    this.showToast(`Login Kasir Berhasil! Selamat bertugas, ${user.name} (${this.cashierSession.cashierNumber}).`, "success");
  }

  logoutCashier() {
    if (confirm(`Petugas ${this.cashierSession.employeeName} ingin keluar dari sesi kasir?\n\nKlik OK untuk logout dan melihat Rekap Tutup Shift.`)) {
      this.openShiftReportModal();
      this.logoutActiveAccount();
    }
  }

  // ==================== KELOLA ADMIN & KASIR ====================
  renderEmployeeTable() {
    const adminTbody = document.getElementById("adminTableBody");
    const cashierTbody = document.getElementById("cashierTableBody");
    if (!adminTbody && !cashierTbody) return;

    const isOwner = this.currentRole === "owner";
    const isAdmin = this.currentRole === "admin";

    const adminList = (this.users || []).filter(u => u.role === "admin");
    const cashierList = (this.users || []).filter(u => u.role !== "admin");

    // UI Personalization based on role:
    const headerRoleBadge = document.getElementById("empHeaderRoleBadge");
    const headerTitle = document.getElementById("empHeaderTitle");
    const headerSubtitle = document.getElementById("empHeaderSubtitle");
    const btnAddAdmin = document.getElementById("empBtnAddAdmin");
    const filterContainer = document.getElementById("empFilterContainer");
    const adminSection = document.getElementById("adminSectionContainer");
    const cashierSection = document.getElementById("cashierSectionContainer");

    if (isAdmin) {
      if (headerRoleBadge) {
        headerRoleBadge.innerHTML = `<i class="fa-solid fa-user-shield mr-1"></i>Akses Admin Toko`;
        headerRoleBadge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200";
      }
      if (headerTitle) headerTitle.textContent = "Kelola Akun Pegawai (Kasir)";
      if (headerSubtitle) headerSubtitle.textContent = "Kelola akun kasir, User ID, PIN, serta penugasan loket kasir default";
      if (btnAddAdmin) btnAddAdmin.classList.add("hidden");
      if (filterContainer) filterContainer.classList.add("hidden");
      if (adminSection) adminSection.classList.add("hidden");
      if (cashierSection) cashierSection.classList.remove("hidden");
    } else {
      if (headerRoleBadge) {
        headerRoleBadge.innerHTML = `<i class="fa-solid fa-crown mr-1"></i>Akses Khusus Pemilik Toko`;
        headerRoleBadge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200";
      }
      if (headerTitle) headerTitle.textContent = "Kelola Akun Admin Toko & Kasir";
      if (headerSubtitle) headerSubtitle.textContent = "Buat User ID dan PIN khusus untuk mengelola Admin Toko serta Staf Kasir (Pegawai)";
      if (btnAddAdmin) btnAddAdmin.classList.remove("hidden");
      if (filterContainer) filterContainer.classList.remove("hidden");
      this.setEmployeeFilter(this.currentEmpFilter || "all");
    }

    // Update badge counts
    const countAll = document.getElementById("badgeCountAll");
    const countAdmin = document.getElementById("badgeCountAdmin");
    const countCashier = document.getElementById("badgeCountCashier");
    if (countAll) countAll.textContent = (this.users || []).length;
    if (countAdmin) countAdmin.textContent = adminList.length;
    if (countCashier) countCashier.textContent = cashierList.length;

    // 1. Render Admin Table (Hanya bila Pemilik)
    if (adminTbody) {
      if (adminList.length === 0) {
        adminTbody.innerHTML = `
          <tr>
            <td colspan="6" class="p-6 text-center text-slate-400">
              <i class="fa-solid fa-user-shield text-2xl mb-1 text-slate-300"></i>
              <p class="font-medium text-xs">Belum ada akun Admin Toko.</p>
              <p class="text-[10px] text-slate-400">Klik tombol "+ Tambah Admin Toko" di atas untuk membuat akun admin baru.</p>
            </td>
          </tr>
        `;
      } else {
        adminTbody.innerHTML = adminList.map(u => {
          const statusBadge = u.status === "active"
            ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Aktif</span>`
            : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">Nonaktif</span>`;

          return `
            <tr class="hover:bg-blue-50/40 transition">
              <td class="py-3 px-4 font-mono font-bold text-blue-700 text-xs">${u.userId}</td>
              <td class="py-3 px-4 font-bold text-slate-800">${u.name}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                  <i class="fa-solid fa-user-shield mr-1"></i>Admin Toko
                </span>
              </td>
              <td class="py-3 px-4 font-mono text-slate-600 bg-slate-50/50">
                <span class="tracking-widest font-black text-xs text-slate-700">••••</span>
                <span class="text-[10px] text-slate-400 ml-1">(${u.pin})</span>
              </td>
              <td class="py-3 px-4">${statusBadge}</td>
              <td class="py-3 px-4 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <button onclick="app.openEmployeeModal('${u.userId}')" class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold text-[11px] transition">
                    <i class="fa-solid fa-pen-to-square mr-1"></i>Edit
                  </button>
                  <button onclick="app.deleteEmployee('${u.userId}')" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold text-[11px] transition">
                    <i class="fa-solid fa-trash mr-1"></i>Hapus
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join("");
      }
    }

    // 2. Render Cashier Table
    if (cashierTbody) {
      if (cashierList.length === 0) {
        cashierTbody.innerHTML = `
          <tr>
            <td colspan="7" class="p-6 text-center text-slate-400">
              <i class="fa-solid fa-cash-register text-2xl mb-1 text-slate-300"></i>
              <p class="font-medium text-xs">Belum ada akun Kasir (Pegawai).</p>
              <p class="text-[10px] text-slate-400">Klik tombol "+ Tambah Kasir Baru" di atas untuk menambah staf kasir.</p>
            </td>
          </tr>
        `;
      } else {
        cashierTbody.innerHTML = cashierList.map(u => {
          const statusBadge = u.status === "active"
            ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Aktif</span>`
            : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">Nonaktif</span>`;

          return `
            <tr class="hover:bg-emerald-50/40 transition">
              <td class="py-3 px-4 font-mono font-bold text-emerald-700 text-xs">${u.userId}</td>
              <td class="py-3 px-4 font-bold text-slate-800">${u.name}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <i class="fa-solid fa-cash-register mr-1"></i>Kasir (Pegawai)
                </span>
              </td>
              <td class="py-3 px-4 font-mono text-slate-600 bg-slate-50/50">
                <span class="tracking-widest font-black text-xs text-slate-700">••••</span>
                <span class="text-[10px] text-slate-400 ml-1">(${u.pin})</span>
              </td>
              <td class="py-3 px-4 font-semibold text-slate-700">${u.assignedCashier || 'Bebas'}</td>
              <td class="py-3 px-4">${statusBadge}</td>
              <td class="py-3 px-4 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <button onclick="app.openEmployeeModal('${u.userId}')" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-semibold text-[11px] transition">
                    <i class="fa-solid fa-pen-to-square mr-1"></i>Edit
                  </button>
                  <button onclick="app.deleteEmployee('${u.userId}')" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold text-[11px] transition">
                    <i class="fa-solid fa-trash mr-1"></i>Hapus
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join("");
      }
    }
  }

  setEmployeeFilter(filter) {
    this.currentEmpFilter = filter;
    const adminSection = document.getElementById("adminSectionContainer");
    const cashierSection = document.getElementById("cashierSectionContainer");
    const isAdmin = this.currentRole === "admin";

    if (isAdmin) {
      if (adminSection) adminSection.classList.add("hidden");
      if (cashierSection) cashierSection.classList.remove("hidden");
      return;
    }

    if (adminSection) {
      if (filter === "all" || filter === "admin") {
        adminSection.classList.remove("hidden");
      } else {
        adminSection.classList.add("hidden");
      }
    }

    if (cashierSection) {
      if (filter === "all" || filter === "cashier") {
        cashierSection.classList.remove("hidden");
      } else {
        cashierSection.classList.add("hidden");
      }
    }

    ["all", "admin", "cashier"].forEach(f => {
      const chip = document.getElementById(`empFilter-${f}`);
      if (chip) {
        if (f === filter) {
          chip.classList.add("active");
        } else {
          chip.classList.remove("active");
        }
      }
    });
  }

  onEmpRoleSelectChange() {
    const roleSelect = document.getElementById("empRoleSelect");
    const cashierBox = document.getElementById("empDefaultCashierContainer");
    if (!roleSelect || !cashierBox) return;

    if (roleSelect.value === "admin") {
      cashierBox.classList.add("hidden");
    } else {
      cashierBox.classList.remove("hidden");
    }
  }

  openEmployeeModal(userId = null, presetRole = null) {
    const isAdmRole = this.currentRole === "admin";
    const modal = document.getElementById("employeeModal");
    const title = document.getElementById("employeeModalTitle");
    const origId = document.getElementById("empEditOriginalId");
    const idInput = document.getElementById("empUserIdInput");
    const nameInput = document.getElementById("empFullNameInput");
    const pinInput = document.getElementById("empPinInput");
    const roleSelect = document.getElementById("empRoleSelect");
    const cashierSelect = document.getElementById("empDefaultCashier");
    const statusSelect = document.getElementById("empStatusSelect");

    // Jika login sebagai Admin Toko: Admin HANYA boleh kelola kasir!
    if (isAdmRole) {
      if (userId) {
        const u = this.users.find(x => x.userId === userId);
        if (u && u.role === "admin") {
          this.showToast("Admin tidak memiliki hak akses untuk mengubah akun Admin!", "warning");
          return;
        }
      }
      presetRole = "cashier";
    }

    // Atur opsi peran di dropdown
    if (roleSelect) {
      const adminOpt = roleSelect.querySelector('option[value="admin"]');
      if (adminOpt) {
        adminOpt.disabled = isAdmRole;
        adminOpt.hidden = isAdmRole;
      }
      roleSelect.disabled = isAdmRole;
    }

    if (userId) {
      const u = this.users.find(x => x.userId === userId);
      if (!u) return;
      const isAdm = u.role === "admin";
      title.textContent = `Edit Akun ${isAdm ? 'Admin Toko' : 'Kasir'}: ${u.name}`;
      origId.value = u.userId;
      idInput.value = u.userId;
      idInput.readOnly = true; // User ID tidak diubah saat edit
      nameInput.value = u.name;
      pinInput.value = u.pin;
      if (roleSelect) roleSelect.value = isAdmRole ? "cashier" : (u.role || "cashier");
      if (cashierSelect) cashierSelect.value = u.assignedCashier || "Kasir 01";
      if (statusSelect) statusSelect.value = u.status || "active";
    } else {
      const role = isAdmRole ? "cashier" : (presetRole || "cashier");
      title.textContent = role === "admin" ? "Tambah Akun Admin Toko Baru" : "Tambah Akun Kasir (Pegawai) Baru";
      origId.value = "";
      idInput.value = role === "admin"
        ? `ADMIN-${this.users.filter(u => u.role === "admin").length + 1}`
        : `KASIR${this.users.filter(u => u.role !== "admin").length + 1}`;
      idInput.readOnly = false;
      nameInput.value = "";
      pinInput.value = "";
      if (roleSelect) roleSelect.value = role;
      if (cashierSelect) cashierSelect.value = "Kasir 01";
      if (statusSelect) statusSelect.value = "active";
    }

    this.onEmpRoleSelectChange();
    modal.classList.remove("hidden");
    setTimeout(() => (origId.value ? nameInput.focus() : idInput.focus()), 100);
  }

  closeEmployeeModal() {
    const modal = document.getElementById("employeeModal");
    if (modal) modal.classList.add("hidden");
  }

  saveEmployee(e) {
    if (e) e.preventDefault();
    const isAdmRole = this.currentRole === "admin";
    const origId = document.getElementById("empEditOriginalId").value;
    const userId = document.getElementById("empUserIdInput").value.trim().toUpperCase().replace(/\s+/g, '');
    const name = document.getElementById("empFullNameInput").value.trim();
    const pin = document.getElementById("empPinInput").value.trim();
    const roleSelect = document.getElementById("empRoleSelect");
    let role = isAdmRole ? "cashier" : (roleSelect ? roleSelect.value : "cashier");
    const assignedCashier = role === "admin" ? "Kasir Utama (Admin)" : document.getElementById("empDefaultCashier").value;
    const status = document.getElementById("empStatusSelect").value;

    if (!userId || !name || !pin) {
      this.showToast("User ID, Nama, dan PIN wajib diisi!", "warning");
      return;
    }

    if (isAdmRole && origId) {
      const existing = this.users.find(u => u.userId === origId);
      if (existing && existing.role === "admin") {
        this.showToast("Admin tidak diizinkan mengubah akun Admin!", "warning");
        return;
      }
    }

    if (origId) {
      // Edit existing
      const idx = this.users.findIndex(u => u.userId === origId);
      if (idx > -1) {
        this.users[idx] = { ...this.users[idx], name, pin, role, assignedCashier, status };
        if (this.cashierSession && this.cashierSession.userId === origId) {
          this.cashierSession.employeeName = name;
        }
      }
      // Sinkronkan ke this.admins
      const admIdx = this.admins.findIndex(a => a.adminId === origId);
      if (role === "admin") {
        if (admIdx > -1) {
          this.admins[admIdx] = { ...this.admins[admIdx], name, pin, status };
        } else {
          this.admins.push({ adminId: origId, name, pin, role: "admin", status });
        }
      } else if (admIdx > -1) {
        this.admins.splice(admIdx, 1);
      }
    } else {
      // Check duplicate userId
      if (this.users.some(u => u.userId === userId) || this.owners.some(o => o.ownerId === userId)) {
        this.showToast(`User ID "${userId}" sudah digunakan! Gunakan ID lain.`, "warning");
        document.getElementById("empUserIdInput").focus();
        return;
      }
      this.users.push({ userId, name, pin, role, assignedCashier, status });
      if (role === "admin") {
        this.admins.push({ adminId: userId, name, pin, role: "admin", status });
      }
    }

    this.saveUsers();
    this.saveAdmins();
    this.closeEmployeeModal();
    this.renderEmployeeTable();
    this.showToast(`Akun ${role === "admin" ? "Admin Toko" : "Kasir"} (${name}) berhasil disimpan!`, "success");

    // Sync to cloud if online
    if (this.isOnlineState && this.settings.gasUrl) {
      this.syncPendingData();
    }
  }

  deleteEmployee(userId) {
    const isAdmRole = this.currentRole === "admin";
    const u = this.users.find(x => x.userId === userId);
    if (!u) return;

    if (isAdmRole && u.role === "admin") {
      this.showToast("Admin tidak diizinkan menghapus akun Admin!", "warning");
      return;
    }

    const roleLabel = u.role === "admin" ? "Admin Toko" : "Kasir";
    if (!confirm(`Hapus akun ${roleLabel} "${u.name}" (${u.userId})?`)) return;

    this.users = this.users.filter(x => x.userId !== userId);
    this.admins = this.admins.filter(a => a.adminId !== userId);
    this.saveUsers();
    this.saveAdmins();
    this.renderEmployeeTable();
    this.showToast(`Akun ${roleLabel} ${u.name} telah dihapus`, "info");

    if (this.cashierSession && this.cashierSession.userId === userId) {
      const remainingCashiers = this.users.filter(x => x.role !== "admin");
      if (remainingCashiers.length > 0) {
        this.cashierSession.userId = remainingCashiers[0].userId;
        this.cashierSession.employeeName = remainingCashiers[0].name;
        this.saveCashierSession();
      }
    }

    if (this.isOnlineState && this.settings.gasUrl) {
      this.syncPendingData();
    }
  }

  // ==================== REKAP TUTUP SHIFT KASIR (CLOSING REPORT) ====================
  openShiftReportModal() {
    this.closeCashierShiftModal();
    const modal = document.getElementById("shiftReportModal");
    const shiftData = this.calcShiftData();

    const session = this.cashierSession || {
      cashierNumber: "Kasir 01",
      employeeName: "Petugas Kasir",
      shift: "Shift 1",
      shiftStart: new Date().toISOString()
    };

    document.getElementById("repCashierNumber").textContent = session.cashierNumber;
    document.getElementById("repEmployeeName").textContent = session.employeeName;
    document.getElementById("repShiftName").textContent = session.shift;

    const startDt = new Date(session.shiftStart);
    document.getElementById("repStartTime").textContent = isNaN(startDt) ? "-" : startDt.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
    document.getElementById("repEndTime").textContent = new Date().toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });

    document.getElementById("repCashInDrawer").textContent = `Rp ${shiftData.payCash.toLocaleString("id-ID")}`;
    document.getElementById("repTxCount").textContent = `${shiftData.txCount} Transaksi`;
    document.getElementById("repGrossSales").textContent = `Rp ${shiftData.grossSales.toLocaleString("id-ID")}`;
    document.getElementById("repDiscount").textContent = `-Rp ${shiftData.discount.toLocaleString("id-ID")}`;
    document.getElementById("repNetSales").textContent = `Rp ${shiftData.netSales.toLocaleString("id-ID")}`;

    document.getElementById("repPayCash").textContent = `Rp ${shiftData.payCash.toLocaleString("id-ID")}`;
    document.getElementById("repPayTransfer").textContent = `Rp ${shiftData.payTransfer.toLocaleString("id-ID")}`;
    document.getElementById("repPayCredit").textContent = `Rp ${shiftData.payCredit.toLocaleString("id-ID")}`;

    document.getElementById("repGrossProfit").textContent = `Rp ${shiftData.grossProfit.toLocaleString("id-ID")}`;

    modal.classList.remove("hidden");
  }

  closeShiftReportModal() {
    const modal = document.getElementById("shiftReportModal");
    if (modal) modal.classList.add("hidden");
  }

  calcShiftData() {
    const session = this.cashierSession || {
      cashierNumber: "Kasir 01",
      employeeName: "Petugas Kasir",
      shift: "Shift 1",
      shiftStart: new Date().toISOString()
    };
    const startTimeMs = new Date(session.shiftStart).getTime() || 0;
    const currentCashier = session.cashierNumber;

    // Filter transactions from this shift and cashier
    const shiftTransactions = this.transactions.filter(t => {
      const isAfterStart = (t.timestamp || 0) >= startTimeMs;
      const isSameCashier = !t.cashierNumber || t.cashierNumber === currentCashier;
      return isAfterStart && isSameCashier;
    });

    const txCount = shiftTransactions.length;
    const grossSales = shiftTransactions.reduce((sum, t) => sum + (t.subtotal || 0), 0);
    const discount = shiftTransactions.reduce((sum, t) => sum + (t.discount || 0), 0);
    const netSales = grossSales - discount;
    const grossProfit = shiftTransactions.reduce((sum, t) => sum + (t.grossProfit || 0), 0);

    const payCash = shiftTransactions
      .filter(t => t.paymentType === "Tunai")
      .reduce((sum, t) => sum + (t.total || 0), 0);

    const payTransfer = shiftTransactions
      .filter(t => t.paymentType === "Transfer")
      .reduce((sum, t) => sum + (t.total || 0), 0);

    const payCredit = shiftTransactions
      .filter(t => t.paymentType === "Hutang")
      .reduce((sum, t) => sum + (t.total || 0), 0);

    return {
      txCount, grossSales, discount, netSales, grossProfit,
      payCash, payTransfer, payCredit,
      transactions: shiftTransactions
    };
  }

  printShiftReceipt() {
    const shiftData = this.calcShiftData();
    const container = document.getElementById("receiptPrintArea");

    const session = this.cashierSession || {
      cashierNumber: "Kasir 01",
      employeeName: "Petugas Kasir",
      shift: "Shift 1",
      shiftStart: new Date().toISOString()
    };

    const startDt = new Date(session.shiftStart);
    const startTimeFormatted = isNaN(startDt) ? "-" : startDt.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
    const endTimeFormatted = new Date().toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });

    container.innerHTML = `
      <div class="text-center pb-2 border-b border-dashed border-slate-300">
        <h2 class="font-bold text-sm text-slate-900 uppercase">${this.settings.storeName}</h2>
        <p class="text-[11px] font-bold text-slate-800">REKAP TUTUP SHIFT KASIR</p>
      </div>

      <div class="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
        <div class="flex justify-between">
          <span>No. Kasir:</span>
          <span class="font-bold">${session.cashierNumber}</span>
        </div>
        <div class="flex justify-between">
          <span>Petugas:</span>
          <span class="font-bold">${session.employeeName}</span>
        </div>
        <div class="flex justify-between">
          <span>Shift:</span>
          <span>${session.shift}</span>
        </div>
        <div class="flex justify-between">
          <span>Mulai Shift:</span>
          <span>${startTimeFormatted}</span>
        </div>
        <div class="flex justify-between">
          <span>Tutup Shift:</span>
          <span>${endTimeFormatted}</span>
        </div>
      </div>

      <div class="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-1">
        <div class="flex justify-between">
          <span>Total Transaksi:</span>
          <span class="font-bold">${shiftData.txCount} Nota</span>
        </div>
        <div class="flex justify-between">
          <span>Total Penjualan:</span>
          <span>Rp ${shiftData.grossSales.toLocaleString("id-ID")}</span>
        </div>
        ${shiftData.discount > 0 ? `
          <div class="flex justify-between text-rose-600">
            <span>Total Diskon:</span>
            <span>-Rp ${shiftData.discount.toLocaleString("id-ID")}</span>
          </div>
        ` : ''}
        <div class="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
          <span>TOTAL OMSET:</span>
          <span>Rp ${shiftData.netSales.toLocaleString("id-ID")}</span>
        </div>
      </div>

      <div class="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-1">
        <div class="font-bold text-slate-700">RINCIAN PEMBAYARAN:</div>
        <div class="flex justify-between font-bold text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">
          <span>• Tunai di Laci Kasir:</span>
          <span>Rp ${shiftData.payCash.toLocaleString("id-ID")}</span>
        </div>
        <div class="flex justify-between text-slate-600">
          <span>• Transfer / QRIS:</span>
          <span>Rp ${shiftData.payTransfer.toLocaleString("id-ID")}</span>
        </div>
        <div class="flex justify-between text-slate-600">
          <span>• Hutang / Bon:</span>
          <span>Rp ${shiftData.payCredit.toLocaleString("id-ID")}</span>
        </div>
      </div>

      <div class="pt-3 text-center text-[10px] text-slate-500 space-y-1">
        <p>Laporan Shift Kasir Selesai Dicetak</p>
        <div class="pt-6 flex justify-around text-center text-[10px] text-slate-700">
          <div>
            <p>Kasir Bertugas</p>
            <div class="h-8"></div>
            <p class="font-bold">(${session.employeeName})</p>
          </div>
          <div>
            <p>Supervisor / Toko</p>
            <div class="h-8"></div>
            <p class="font-bold">( .................... )</p>
          </div>
        </div>
      </div>
    `;

    this.closeShiftReportModal();
    document.getElementById("receiptModal").classList.remove("hidden");
  }

  startNewShift() {
    if (!confirm("Tutup shift saat ini dan mulai sesi shift baru? Jam awal shift akan direset ke sekarang.")) return;
    if (this.cashierSession) {
      this.cashierSession.shiftStart = new Date().toISOString();
      this.saveCashierSession();
    }
    this.logoutActiveAccount();
    this.closeShiftReportModal();
    this.showToast("Shift ditutup! Silakan login untuk petugas kasir berikutnya.", "success");
  }

  // ==================== NAVIGATION TABS ====================
  switchTab(tabName) {
    const isOwner = this.currentRole === "owner";
    const isAdmin = this.currentRole === "admin";

    // Menu Pengaturan Database HANYA untuk Pemilik Toko
    if (tabName === "settings" && !isOwner) {
      this.showToast("Menu ini hanya dapat diakses oleh Pemilik Toko!", "warning");
      this.switchTab("pos");
      return;
    }

    // Menu Laba Rugi, Master Produk & Kelola Pegawai untuk Pemilik atau Admin Toko
    if (["profitloss", "products", "employees"].includes(tabName) && !isOwner && !isAdmin) {
      this.showToast("Menu ini hanya dapat diakses oleh Pemilik atau Admin Toko!", "warning");
      this.openRoleChoiceModal();
      return;
    }

    // Hide all views
    document.querySelectorAll(".tab-view").forEach(view => view.classList.add("hidden"));
    // Deactivate all tab buttons
    document.querySelectorAll(".nav-tab").forEach(tab => tab.classList.remove("active-tab"));

    // Activate selected
    const activeView = document.getElementById(`view-${tabName}`);
    const activeTabBtn = document.getElementById(`tab-${tabName}`);
    if (activeView) activeView.classList.remove("hidden");
    if (activeTabBtn) activeTabBtn.classList.add("active-tab");

    // Specific triggers
    if (tabName === "profitloss") {
      this.renderProfitLoss();
    } else if (tabName === "history") {
      this.renderTransactionHistory();
    } else if (tabName === "products") {
      this.renderProductMasterTable();
    } else if (tabName === "employees") {
      this.renderEmployeeTable();
    } else if (tabName === "expenses") {
      this.renderExpensesTable();
    } else if (tabName === "settings") {
      this.fillSettingsForm();
    }
  }

  // ==================== POS / KASIR LOGIC ====================
  setCategoryFilter(category) {
    this.currentCategory = category;
    document.querySelectorAll(".cat-chip").forEach(chip => {
      chip.classList.toggle("active", chip.dataset.cat === category);
    });
    this.renderPosProducts();
  }

  getStockBreakdown(prod) {
    if (!prod || !prod.units || prod.units.length === 0) {
      return `${(prod.stock || 0).toLocaleString("id-ID")} ${prod.baseUnit || ''}`;
    }

    if (prod.stock <= 0) return "Habis (0)";

    // Urutkan satuan dari pengali terbesar ke terkecil (Bal -> Slop -> Bungkus -> Batang)
    const sorted = [...prod.units]
      .filter(u => u.multiplier > 0)
      .sort((a, b) => b.multiplier - a.multiplier);

    let remaining = prod.stock;
    const parts = [];

    for (const u of sorted) {
      const count = Math.floor(remaining / u.multiplier);
      if (count > 0) {
        parts.push(`${count.toLocaleString("id-ID")} ${u.unitName}`);
        remaining = remaining % u.multiplier;
      }
    }

    if (remaining > 0) {
      parts.push(`${remaining.toLocaleString("id-ID")} ${prod.baseUnit}`);
    }

    return parts.length > 0 ? parts.join(" + ") : `0 ${prod.baseUnit}`;
  }

  scrollToCart() {
    const cartEl = document.getElementById("posCartSection");
    if (cartEl) {
      cartEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  renderPosProducts() {
    const grid = document.getElementById("posProductGrid");
    const query = (document.getElementById("posSearchInput").value || "").toLowerCase().trim();

    let filtered = this.products;

    if (this.currentCategory !== "all") {
      filtered = filtered.filter(p => p.category === this.currentCategory);
    }

    if (query) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.units.some(u => u.unitName.toLowerCase().includes(query))
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          <i class="fa-solid fa-magnifying-glass text-3xl mb-2 opacity-50"></i>
          <p class="text-sm font-medium">Barang tidak ditemukan</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(prod => {
      // Sisa stok dalam satuan terkecil
      const baseStock = prod.stock;
      const isOutOfStock = baseStock <= 0;
      const breakdownText = this.getStockBreakdown(prod);

      // Render tombol satuan dengan sisa jumlah per satuan
      const unitButtons = prod.units.map(unit => {
        const canSellQty = Math.floor(baseStock / unit.multiplier);
        const disabled = canSellQty <= 0;

        return `
          <button onclick="app.addToCart('${prod.id}', '${unit.unitName}')" 
                  ${disabled ? "disabled" : ""} 
                  class="flex flex-col justify-between text-left p-2 rounded-xl border transition active:scale-[0.98] min-w-0 w-full overflow-hidden ${disabled ? 'opacity-45 bg-slate-100 border-slate-200 cursor-not-allowed' : 'bg-slate-50/80 border-slate-200/90 hover:border-indigo-500 hover:bg-indigo-50/60 hover:shadow-2xs'}">
            <div class="flex items-center justify-between w-full gap-1 min-w-0">
              <span class="font-bold text-xs text-slate-900 truncate">${unit.unitName}</span>
              <span class="text-[9px] text-slate-500 bg-white px-1 py-0.5 rounded border border-slate-200/80 font-mono shrink-0">${unit.multiplier > 1 ? 'x' + unit.multiplier : '1 ' + prod.baseUnit}</span>
            </div>
            <div class="flex items-baseline justify-between w-full mt-1.5 gap-1 min-w-0">
              <span class="text-xs font-black text-indigo-600 truncate">Rp ${unit.sellPrice.toLocaleString("id-ID")}</span>
              <span class="text-[9px] font-semibold shrink-0 ${disabled ? 'text-rose-500' : 'text-emerald-700'}">
                ${disabled ? 'Habis' : canSellQty.toLocaleString('id-ID')}
              </span>
            </div>
          </button>
        `;
      }).join("");

      return `
        <div class="bg-white p-3 sm:p-4 rounded-2xl shadow-xs border border-slate-200/90 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition w-full max-w-full overflow-hidden">
          <div class="w-full min-w-0">
            <!-- Top Badge Row -->
            <div class="flex items-center justify-between gap-1.5 mb-1.5 w-full min-w-0">
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 truncate">${prod.category}</span>
              <span class="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${isOutOfStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'}">
                ${prod.stock.toLocaleString('id-ID')} ${prod.baseUnit}
              </span>
            </div>

            <!-- Product Title -->
            <h3 class="font-bold text-slate-900 text-xs sm:text-sm leading-snug mb-1.5 truncate">${prod.name}</h3>
            
            <!-- Real-time Multi-Unit Breakdown -->
            <div class="text-[10px] sm:text-[11px] text-slate-600 bg-indigo-50/40 px-2.5 py-1.5 rounded-xl border border-indigo-100/80 mb-2.5 flex items-start gap-1.5 w-full min-w-0">
              <i class="fa-solid fa-cubes-stacked text-indigo-500 text-xs mt-0.5 shrink-0"></i>
              <span class="leading-tight truncate w-full" title="${breakdownText}"><b class="text-slate-700">Stok:</b> ${breakdownText}</span>
            </div>

            <div class="grid grid-cols-2 gap-1.5 w-full min-w-0">
              ${unitButtons}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  addToCart(productId, unitName) {
    const canSell = this.isCashierLoggedIn || this.currentRole === "admin" || this.currentRole === "owner";
    if (!canSell) {
      this.showToast("Silakan Login terlebih dahulu sebelum melayani penjualan!", "warning");
      this.openRoleChoiceModal();
      return;
    }

    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const unit = product.units.find(u => u.unitName === unitName);
    if (!unit) return;

    // Check stock
    const neededBaseUnit = unit.multiplier;
    const currentInCart = this.cart
      .filter(item => item.product.id === productId)
      .reduce((sum, item) => sum + (item.qty * item.unit.multiplier), 0);

    if (currentInCart + neededBaseUnit > product.stock) {
      this.showToast(`Stok ${product.name} tidak mencukupi! Tersisa ${product.stock} ${product.baseUnit}`, "warning");
      return;
    }

    // Check if same item & unit already in cart
    const existingIndex = this.cart.findIndex(i => i.product.id === productId && i.unit.unitName === unitName);
    if (existingIndex > -1) {
      this.cart[existingIndex].qty += 1;
      this.cart[existingIndex].subtotal = this.cart[existingIndex].qty * unit.sellPrice;
      this.cart[existingIndex].hppTotal = this.cart[existingIndex].qty * unit.buyPrice;
    } else {
      this.cart.push({
        product: product,
        unit: unit,
        qty: 1,
        sellPrice: unit.sellPrice,
        buyPrice: unit.buyPrice,
        subtotal: unit.sellPrice,
        hppTotal: unit.buyPrice
      });
    }

    this.renderCart();
  }

  updateCartQty(index, delta) {
    const item = this.cart[index];
    const newQty = item.qty + delta;

    if (newQty <= 0) {
      this.removeFromCart(index);
      return;
    }

    // Stock check
    const otherUnitsInCart = this.cart
      .filter((it, idx) => it.product.id === item.product.id && idx !== index)
      .reduce((sum, it) => sum + (it.qty * it.unit.multiplier), 0);

    const totalNeeded = otherUnitsInCart + (newQty * item.unit.multiplier);
    if (totalNeeded > item.product.stock) {
      this.showToast(`Stok ${item.product.name} tidak cukup untuk penambahan ini`, "warning");
      return;
    }

    item.qty = newQty;
    item.subtotal = item.qty * item.sellPrice;
    item.hppTotal = item.qty * item.buyPrice;
    this.renderCart();
  }

  removeFromCart(index) {
    this.cart.splice(index, 1);
    this.renderCart();
  }

  clearCart() {
    this.cart = [];
    document.getElementById("cashReceivedInput").value = "";
    document.getElementById("cartDiscountInput").value = 0;
    this.renderCart();
  }

  renderCart() {
    const container = document.getElementById("cartItemList");
    const countBadge = document.getElementById("cartCountBadge");
    const mobileCountBadge = document.getElementById("mobileCartCountBadge");
    const totalQty = this.cart.reduce((sum, item) => sum + item.qty, 0);

    if (countBadge) countBadge.textContent = this.cart.length;
    if (mobileCountBadge) mobileCountBadge.textContent = totalQty;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div id="cartEmptyState" class="h-full flex flex-col items-center justify-center text-slate-400 py-8">
          <i class="fa-solid fa-cart-arrow-down text-3xl mb-2 opacity-40"></i>
          <p class="text-xs font-semibold text-slate-500">Keranjang masih kosong</p>
          <p class="text-[11px] text-slate-400">Klik satuan barang untuk menambahkan</p>
        </div>
      `;
      this.updateCartSummary();
      return;
    }

    container.innerHTML = this.cart.map((item, idx) => `
      <div class="bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-2xs flex flex-col gap-2">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <h4 class="font-bold text-slate-900 text-xs truncate">${item.product.name}</h4>
            <div class="flex items-center flex-wrap gap-1.5 mt-0.5">
              <span class="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">${item.unit.unitName}</span>
              <span class="text-[11px] text-slate-500 font-mono">@Rp ${item.sellPrice.toLocaleString("id-ID")}</span>
            </div>
          </div>
          <button onclick="app.removeFromCart(${idx})" class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md w-6 h-6 flex items-center justify-center text-xs shrink-0 transition" title="Hapus item">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="flex items-center justify-between pt-1.5 border-t border-slate-100">
          <!-- Qty Stepper -->
          <div class="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button onclick="app.updateCartQty(${idx}, -1)" class="w-7 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 font-bold text-xs transition">-</button>
            <span class="px-2.5 h-6 flex items-center justify-center font-bold text-xs text-slate-900 bg-white min-w-[30px] border-x border-slate-200">${item.qty}</span>
            <button onclick="app.updateCartQty(${idx}, 1)" class="w-7 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 font-bold text-xs transition">+</button>
          </div>
          <!-- Subtotal -->
          <div class="text-right">
            <span class="font-bold text-slate-900 text-xs">Rp ${item.subtotal.toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>
    `).join("");

    this.updateCartSummary();
  }

  updateCartSummary() {
    const subtotal = this.cart.reduce((sum, i) => sum + i.subtotal, 0);
    const discountInput = document.getElementById("cartDiscountInput");
    const discount = Math.max(0, Number(discountInput.value) || 0);
    const total = Math.max(0, subtotal - discount);

    const formattedTotal = `Rp ${total.toLocaleString("id-ID")}`;
    document.getElementById("cartSubtotalText").textContent = `Rp ${subtotal.toLocaleString("id-ID")}`;
    document.getElementById("cartTotalText").textContent = formattedTotal;

    const mobileTotalEl = document.getElementById("mobileCartTotalText");
    if (mobileTotalEl) mobileTotalEl.textContent = formattedTotal;

    this.calcKembalian();
  }

  setQuickCash(amount) {
    const subtotal = this.cart.reduce((sum, i) => sum + i.subtotal, 0);
    const discount = Math.max(0, Number(document.getElementById("cartDiscountInput").value) || 0);
    const total = Math.max(0, subtotal - discount);

    const cashInput = document.getElementById("cashReceivedInput");
    if (amount === "pas") {
      cashInput.value = total;
    } else {
      cashInput.value = amount;
    }
    this.calcKembalian();
  }

  calcKembalian() {
    const subtotal = this.cart.reduce((sum, i) => sum + i.subtotal, 0);
    const discount = Math.max(0, Number(document.getElementById("cartDiscountInput").value) || 0);
    const total = Math.max(0, subtotal - discount);

    const cashReceived = Number(document.getElementById("cashReceivedInput").value) || 0;
    const kembalianDisplay = document.getElementById("cashChangeDisplay");

    const change = cashReceived - total;
    if (change >= 0) {
      kembalianDisplay.textContent = `Rp ${change.toLocaleString("id-ID")}`;
      kembalianDisplay.className = "px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-bold border border-emerald-200 truncate";
    } else {
      kembalianDisplay.textContent = `Kurang Rp ${Math.abs(change).toLocaleString("id-ID")}`;
      kembalianDisplay.className = "px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-sm font-bold border border-rose-200 truncate";
    }
  }

  // ==================== CHECKOUT PROCESS ====================
  processCheckout() {
    const canSell = this.isCashierLoggedIn || this.currentRole === "admin" || this.currentRole === "owner";
    if (!canSell) {
      this.showToast("Silakan Login terlebih dahulu sebelum menyelesaikan transaksi!", "warning");
      this.openRoleChoiceModal();
      return;
    }

    if (this.cart.length === 0) {
      this.showToast("Keranjang belanja masih kosong!", "warning");
      return;
    }

    const subtotal = this.cart.reduce((sum, i) => sum + i.subtotal, 0);
    const discount = Math.max(0, Number(document.getElementById("cartDiscountInput").value) || 0);
    const total = Math.max(0, subtotal - discount);
    const totalHpp = this.cart.reduce((sum, i) => sum + i.hppTotal, 0);

    const paymentType = document.getElementById("paymentTypeSelect").value;
    const customerName = document.getElementById("customerNameInput").value.trim() || "Pelanggan Umum";
    const cashReceived = Number(document.getElementById("cashReceivedInput").value) || total;

    if (paymentType === "Tunai" && cashReceived < total) {
      this.showToast("Uang yang diterima kurang dari total pembayaran!", "warning");
      document.getElementById("cashReceivedInput").focus();
      return;
    }

    // 1. Generate Invoice No: INV-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0];
    const invoiceNo = `INV-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Reduce Stock in Base Units
    this.cart.forEach(item => {
      const prod = this.products.find(p => p.id === item.product.id);
      if (prod) {
        prod.stock -= (item.qty * item.unit.multiplier);
        if (prod.stock < 0) prod.stock = 0;
      }
    });
    this.saveProducts();

    // 3. Create Transaction Record
    const activeStaff = this.cashierSession || (this.activeSession ? {
      cashierNumber: this.activeSession.type === "owner" ? "Kasir Utama (Pemilik)" : "Kasir Utama (Admin)",
      employeeName: this.activeSession.name,
      shift: this.activeSession.type === "owner" ? "Owner Shift" : "Admin Shift"
    } : {
      cashierNumber: "Kasir 01",
      employeeName: "Petugas Kasir",
      shift: "Shift 1"
    });

    const cashierLabel = (this.activeSession && (this.activeSession.type === "owner" || this.activeSession.type === "admin"))
      ? `${this.activeSession.type === "owner" ? "👑 Pemilik" : "🛡️ Admin Toko"} (${this.activeSession.name})`
      : `${activeStaff.cashierNumber} - ${activeStaff.employeeName} (${activeStaff.shift})`;

    const transaction = {
      invoiceNo: invoiceNo,
      date: dateStr,
      time: timeStr,
      timestamp: now.getTime(),
      cashier: cashierLabel,
      cashierNumber: activeStaff.cashierNumber || "Kasir 01",
      employeeName: activeStaff.employeeName || "Kasir",
      shift: activeStaff.shift || "Non-Shift",
      customerName: customerName,
      paymentType: paymentType,
      items: this.cart.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        category: i.product.category,
        unitName: i.unit.unitName,
        multiplier: i.unit.multiplier,
        qty: i.qty,
        sellPrice: i.sellPrice,
        buyPrice: i.buyPrice,
        subtotal: i.subtotal,
        hppTotal: i.hppTotal
      })),
      subtotal: subtotal,
      discount: discount,
      total: total,
      totalHpp: totalHpp,
      grossProfit: total - totalHpp,
      cashReceived: cashReceived,
      change: Math.max(0, cashReceived - total),
      isSynced: false // queued for Google Sheets
    };

    // Save to local storage
    this.transactions.unshift(transaction);
    this.saveTransactions();

    // Show Receipt Modal
    this.renderReceipt(transaction);
    document.getElementById("receiptModal").classList.remove("hidden");

    // Reset Cart & POS UI
    this.clearCart();
    document.getElementById("customerNameInput").value = "";
    this.renderPosProducts();
    this.showToast(`Transaksi ${invoiceNo} berhasil disimpan!`, "success");

    // Refresh otomatis: saat online upload ke Google Sheets lalu segarkan data; saat offline tetap tersimpan lokal
    this.autoRefreshAfterTransaction();
  }

  // ==================== RECEIPT RENDERING ====================
  renderReceipt(tx) {
    const container = document.getElementById("receiptPrintArea");
    const itemRows = tx.items.map(item => `
      <div class="mb-1 text-slate-800">
        <div class="font-bold">${item.productName}</div>
        <div class="flex justify-between text-slate-600">
          <span>${item.qty} ${item.unitName} x ${item.sellPrice.toLocaleString("id-ID")}</span>
          <span class="font-semibold">Rp ${item.subtotal.toLocaleString("id-ID")}</span>
        </div>
      </div>
    `).join("");

    container.innerHTML = `
      <div class="text-center pb-2 border-b border-dashed border-slate-300">
        <h2 class="font-bold text-sm text-slate-900 uppercase">${this.settings.storeName}</h2>
        <p class="text-[10px] text-slate-500">${this.settings.storeAddress}</p>
        <p class="text-[10px] text-slate-500">Telp: ${this.settings.storePhone}</p>
      </div>

      <div class="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
        <div class="flex justify-between">
          <span>No. Nota:</span>
          <span class="font-mono font-bold">${tx.invoiceNo}</span>
        </div>
        <div class="flex justify-between">
          <span>Waktu:</span>
          <span>${tx.date} ${tx.time}</span>
        </div>
        <div class="flex justify-between">
          <span>No. Kasir:</span>
          <span class="font-bold">${tx.cashierNumber || 'Kasir 01'} (${tx.employeeName || tx.cashier})</span>
        </div>
        <div class="flex justify-between">
          <span>Shift:</span>
          <span>${tx.shift || 'Shift 1'}</span>
        </div>
        <div class="flex justify-between">
          <span>Pelanggan:</span>
          <span>${tx.customerName}</span>
        </div>
      </div>

      <div class="py-2 border-b border-dashed border-slate-300">
        ${itemRows}
      </div>

      <div class="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
        <div class="flex justify-between">
          <span>Subtotal:</span>
          <span>Rp ${tx.subtotal.toLocaleString("id-ID")}</span>
        </div>
        ${tx.discount > 0 ? `
          <div class="flex justify-between text-rose-600">
            <span>Diskon:</span>
            <span>-Rp ${tx.discount.toLocaleString("id-ID")}</span>
          </div>
        ` : ''}
        <div class="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
          <span>TOTAL:</span>
          <span>Rp ${tx.total.toLocaleString("id-ID")}</span>
        </div>
        <div class="flex justify-between text-[10px] text-slate-600">
          <span>Bayar (${tx.paymentType}):</span>
          <span>Rp ${tx.cashReceived.toLocaleString("id-ID")}</span>
        </div>
        <div class="flex justify-between text-[10px] text-slate-600">
          <span>Kembalian:</span>
          <span>Rp ${tx.change.toLocaleString("id-ID")}</span>
        </div>
      </div>

      <div class="pt-3 text-center text-[10px] text-slate-400 space-y-0.5">
        <p>Terima kasih atas kunjungan Anda!</p>
        <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
      </div>
    `;
  }

  closeReceiptModal() {
    document.getElementById("receiptModal").classList.add("hidden");
  }

  // ==================== TRANSACTION HISTORY ====================
  renderTransactionHistory() {
    const tbody = document.getElementById("historyTableBody");
    const emptyState = document.getElementById("historyEmpty");
    const dateFilter = document.getElementById("historyDateFilter")?.value || "";
    const cashierFilter = document.getElementById("historyCashierFilter")?.value || "all";
    const shiftFilter = document.getElementById("historyShiftFilter")?.value || "all";

    let list = this.transactions;
    if (dateFilter) {
      list = list.filter(t => t.date === dateFilter);
    }
    if (cashierFilter && cashierFilter !== "all") {
      list = list.filter(t => (t.cashierNumber === cashierFilter) || (t.cashier && t.cashier.includes(cashierFilter)));
    }
    if (shiftFilter && shiftFilter !== "all") {
      list = list.filter(t => (t.shift && t.shift.startsWith(shiftFilter)) || (t.cashier && t.cashier.includes(shiftFilter)));
    }

    if (list.length === 0) {
      tbody.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    tbody.innerHTML = list.map(tx => {
      const itemsSummary = tx.items.map(i => `${i.productName} (${i.qty} ${i.unitName})`).join(", ");
      const isSyncedBadge = tx.isSynced 
        ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-cloud mr-1"></i>Tersinkron</span>`
        : `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"><i class="fa-solid fa-clock mr-1"></i>Lokal (Antrean)</span>`;

      const cashierDisplayName = tx.employeeName || (tx.cashier ? tx.cashier.replace(/Kasir \d+\s*-\s*/, '') : 'Kasir');
      const shiftDisplayName = tx.shift ? tx.shift.split(" ")[0] : "Shift 1";

      return `
        <tr class="hover:bg-slate-50 transition">
          <td class="py-3 px-4 font-mono font-bold text-indigo-600">${tx.invoiceNo}</td>
          <td class="py-3 px-4 text-slate-500">${tx.date} <span class="text-[10px] block">${tx.time}</span></td>
          <td class="py-3 px-4">
            <span class="font-bold text-slate-900">${tx.cashierNumber || 'Kasir 01'}</span>
            <span class="text-[10px] block text-slate-500 font-medium">${cashierDisplayName} • <b class="text-indigo-600">${shiftDisplayName}</b></span>
          </td>
          <td class="py-3 px-4 font-semibold text-slate-800">${tx.customerName}</td>
          <td class="py-3 px-4 text-slate-600 max-w-xs truncate" title="${itemsSummary}">${itemsSummary}</td>
          <td class="py-3 px-4 font-bold text-slate-900">Rp ${tx.total.toLocaleString("id-ID")}</td>
          <td class="py-3 px-4"><span class="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium">${tx.paymentType}</span></td>
          <td class="py-3 px-4">${isSyncedBadge}</td>
          <td class="py-3 px-4 text-center">
            <div class="flex items-center justify-center gap-1.5">
              <button onclick="app.reprintReceipt('${tx.invoiceNo}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition">
                <i class="fa-solid fa-print mr-1"></i>Nota
              </button>
              <button onclick="app.promptCancelTransaction('${tx.invoiceNo}')" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold text-[11px] border border-rose-200 transition" title="Batalkan transaksi atau tambah barang belanjaan">
                <i class="fa-solid fa-ban mr-1"></i>Batalkan
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  reprintReceipt(invoiceNo) {
    const tx = this.transactions.find(t => t.invoiceNo === invoiceNo);
    if (!tx) return;
    this.renderReceipt(tx);
    document.getElementById("receiptModal").classList.remove("hidden");
  }

  // ==================== PEMBATALAN TRANSAKSI & TAMBAH BARANG ====================
  promptCancelTransaction(invoiceNo) {
    const tx = this.transactions.find(t => t.invoiceNo === invoiceNo);
    if (!tx) return;

    this.activeCancelTx = tx;

    document.getElementById("cancelModalInvoiceNo").textContent = tx.invoiceNo;
    document.getElementById("cancelModalTotal").textContent = `Rp ${tx.total.toLocaleString("id-ID")}`;

    const itemsContainer = document.getElementById("cancelModalItems");
    itemsContainer.innerHTML = tx.items.map(item => `
      <div class="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
        <span>• ${item.productName} <b class="text-slate-900">(${item.qty} ${item.unitName})</b></span>
        <span class="font-bold text-slate-800">Rp ${item.subtotal.toLocaleString("id-ID")}</span>
      </div>
    `).join("");

    document.getElementById("cancelTxModal").classList.remove("hidden");
  }

  closeCancelModal() {
    document.getElementById("cancelTxModal").classList.add("hidden");
    this.activeCancelTx = null;
  }

  confirmCancelTransaction(mode) {
    if (!this.activeCancelTx) return;
    const tx = this.activeCancelTx;
    const invoiceNo = tx.invoiceNo;

    // 1. Kembalikan Stok Barang ke Satuan Terkecil
    tx.items.forEach(item => {
      const prod = this.products.find(p => p.id === item.productId);
      if (prod) {
        prod.stock += (item.qty * item.multiplier);
      }
    });
    this.saveProducts();

    // 2. Catat Invoice Dibatalkan untuk sinkronisasi Google Sheets
    if (tx.isSynced) {
      if (!this.cancelledInvoices.includes(invoiceNo)) {
        this.cancelledInvoices.push(invoiceNo);
        localStorage.setItem("toko_cancelled_invoices", JSON.stringify(this.cancelledInvoices));
      }
    }

    // 3. Hapus Transaksi dari Daftar Penjualan
    this.transactions = this.transactions.filter(t => t.invoiceNo !== invoiceNo);
    this.saveTransactions();

    // 4. Tindakan Sesuai Pilihan Tombol
    if (mode === "reload_to_cart") {
      // Masukkan kembali semua barang ke Keranjang Kasir
      this.cart = tx.items.map(item => {
        const prod = this.products.find(p => p.id === item.productId) || {
          id: item.productId,
          name: item.productName,
          category: item.category,
          baseUnit: item.unitName,
          stock: 9999,
          units: [{ unitName: item.unitName, multiplier: item.multiplier, sellPrice: item.sellPrice, buyPrice: item.buyPrice }]
        };
        const unit = (prod.units && prod.units.find(u => u.unitName === item.unitName)) || {
          unitName: item.unitName,
          multiplier: item.multiplier,
          sellPrice: item.sellPrice,
          buyPrice: item.buyPrice
        };
        return {
          product: prod,
          unit: unit,
          qty: item.qty,
          sellPrice: item.sellPrice,
          buyPrice: item.buyPrice,
          subtotal: item.subtotal,
          hppTotal: item.hppTotal
        };
      });

      // Kembalikan info pelanggan, metode bayar, dan diskon
      const customerInput = document.getElementById("customerNameInput");
      if (customerInput) customerInput.value = (tx.customerName && tx.customerName !== "Pelanggan Umum") ? tx.customerName : "";

      const paymentSelect = document.getElementById("paymentTypeSelect");
      if (paymentSelect) paymentSelect.value = tx.paymentType || "Tunai";

      const discountInput = document.getElementById("cartDiscountInput");
      if (discountInput) discountInput.value = tx.discount || 0;

      this.closeCancelModal();
      this.switchTab("pos");
      this.renderCart();
      this.renderPosProducts();
      this.showToast(`Transaksi ${invoiceNo} dibatalkan! Barang dimuat ke kasir untuk ditambah.`, "success");
    } else {
      // Batal Saja (Pelanggan Batal Beli / Retur)
      this.closeCancelModal();
      this.renderTransactionHistory();
      this.renderPosProducts();
      if (this.currentRole === "admin" || this.currentRole === "owner") {
        this.renderProfitLoss();
      }
      this.showToast(`Transaksi ${invoiceNo} berhasil dibatalkan dan stok dikembalikan!`, "info");
    }

    // 5. Sinkronkan perubahan stok & pembatalan ke Google Sheets jika online
    if (this.isOnlineState && this.settings.gasUrl) {
      this.syncPendingData();
    }
  }

  // ==================== EXPENSE TRACKING ====================
  saveExpense(e) {
    e.preventDefault();
    const date = document.getElementById("expenseDate").value || new Date().toISOString().split("T")[0];
    const category = document.getElementById("expenseCategory").value;
    const amount = Number(document.getElementById("expenseAmount").value);
    const notes = document.getElementById("expenseNotes").value.trim();

    if (!amount || amount <= 0) {
      this.showToast("Jumlah pengeluaran harus lebih dari 0!", "warning");
      return;
    }

    const newExpense = {
      id: `EXP-${Date.now()}`,
      date: date,
      category: category,
      amount: amount,
      notes: notes,
      isSynced: false
    };

    this.expenses.unshift(newExpense);
    this.saveExpenses();
    this.renderExpensesTable();

    // Reset Form
    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseNotes").value = "";
    this.showToast("Pengeluaran operasional berhasil dicatat!", "success");

    // Background push if online
    if (this.isOnlineState && this.settings.gasUrl) {
      this.syncPendingData();
    }
  }

  deleteExpense(id) {
    if (!confirm("Hapus catatan pengeluaran ini?")) return;
    this.expenses = this.expenses.filter(e => e.id !== id);
    this.saveExpenses();
    this.renderExpensesTable();
    this.showToast("Catatan pengeluaran dihapus", "info");
  }

  renderExpensesTable() {
    const tbody = document.getElementById("expenseTableBody");
    const emptyState = document.getElementById("expenseEmpty");
    const totalMonthBadge = document.getElementById("totalExpenseThisMonthBadge");

    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;

    // Calculate this month's total
    const thisMonthExpenses = this.expenses.filter(e => e.date.startsWith(currentMonthPrefix));
    const totalMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    totalMonthBadge.textContent = `Rp ${totalMonth.toLocaleString("id-ID")}`;

    if (this.expenses.length === 0) {
      tbody.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    tbody.innerHTML = this.expenses.map(exp => {
      const isSyncedBadge = exp.isSynced 
        ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-cloud mr-1"></i>Cloud</span>`
        : `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"><i class="fa-solid fa-clock mr-1"></i>Lokal</span>`;

      return `
        <tr class="hover:bg-slate-50 transition">
          <td class="py-2.5 px-3 text-slate-600 font-mono">${exp.date}</td>
          <td class="py-2.5 px-3 font-semibold text-slate-800"><span class="px-2 py-0.5 bg-slate-100 rounded text-[11px]">${exp.category}</span></td>
          <td class="py-2.5 px-3 text-slate-500">${exp.notes || '-'}</td>
          <td class="py-2.5 px-3 font-bold text-rose-600">Rp ${exp.amount.toLocaleString("id-ID")}</td>
          <td class="py-2.5 px-3">${isSyncedBadge}</td>
          <td class="py-2.5 px-3 text-center">
            <button onclick="app.deleteExpense('${exp.id}')" class="text-slate-400 hover:text-red-500 p-1">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ==================== LABA RUGI (PROFIT & LOSS) ENGINE ====================
  initYearOptions() {
    const yearSelect = document.getElementById("plYearSelect");
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = "";
    for (let y = currentYear - 3; y <= currentYear + 2; y++) {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = `Tahun ${y}`;
      if (y === currentYear) opt.selected = true;
      yearSelect.appendChild(opt);
    }

    const currentMonth = new Date().getMonth() + 1;
    document.getElementById("plMonthSelect").value = currentMonth;
    document.getElementById("expenseDate").value = new Date().toISOString().split("T")[0];
  }

  renderProfitLoss() {
    const mode = document.getElementById("plModeSelect").value; // 'monthly' or 'yearly'
    const month = Number(document.getElementById("plMonthSelect").value);
    const year = Number(document.getElementById("plYearSelect").value);
    const monthSelectEl = document.getElementById("plMonthSelect");

    if (mode === "yearly") {
      monthSelectEl.classList.add("hidden");
      document.getElementById("plPeriodTitle").textContent = `Laporan Tahun ${year}`;
    } else {
      monthSelectEl.classList.remove("hidden");
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      document.getElementById("plPeriodTitle").textContent = `Periode ${monthNames[month - 1]} ${year}`;
    }

    // Filter transactions by period
    const filteredTx = this.transactions.filter(t => {
      const [tYear, tMonth] = t.date.split("-").map(Number);
      if (mode === "yearly") return tYear === year;
      return tYear === year && tMonth === month;
    });

    // Filter expenses by period
    const filteredExp = this.expenses.filter(e => {
      const [eYear, eMonth] = e.date.split("-").map(Number);
      if (mode === "yearly") return eYear === year;
      return eYear === year && eMonth === month;
    });

    // 1. Calculations
    const grossSales = filteredTx.reduce((sum, t) => sum + t.subtotal, 0);
    const totalDiscount = filteredTx.reduce((sum, t) => sum + (t.discount || 0), 0);
    const netSales = grossSales - totalDiscount;
    const totalHpp = filteredTx.reduce((sum, t) => sum + (t.totalHpp || 0), 0);
    const grossProfit = netSales - totalHpp; // Laba Kotor

    const totalExpenses = filteredExp.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = grossProfit - totalExpenses; // Laba Bersih
    const margin = netSales > 0 ? ((netIncome / netSales) * 100).toFixed(1) : 0;

    // 2. Update KPI Cards
    document.getElementById("kpiRevenue").textContent = `Rp ${netSales.toLocaleString("id-ID")}`;
    document.getElementById("kpiTxCount").textContent = `${filteredTx.length} transaksi penjualan`;

    document.getElementById("kpiHpp").textContent = `Rp ${totalHpp.toLocaleString("id-ID")}`;
    document.getElementById("kpiExpenses").textContent = `Rp ${totalExpenses.toLocaleString("id-ID")}`;

    const netProfitCard = document.getElementById("kpiNetProfit");
    netProfitCard.textContent = `Rp ${netIncome.toLocaleString("id-ID")}`;
    netProfitCard.className = `text-2xl font-black ${netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`;
    document.getElementById("kpiMargin").textContent = `Margin Bersih: ${margin}%`;

    // 3. Update Detailed P&L Statement
    document.getElementById("plRowGrossSales").textContent = `Rp ${grossSales.toLocaleString("id-ID")}`;
    document.getElementById("plRowDiscounts").textContent = `(Rp ${totalDiscount.toLocaleString("id-ID")})`;
    document.getElementById("plRowNetSales").textContent = `Rp ${netSales.toLocaleString("id-ID")}`;

    document.getElementById("plRowHpp").textContent = `(Rp ${totalHpp.toLocaleString("id-ID")})`;
    document.getElementById("plRowGrossProfit").textContent = `Rp ${grossProfit.toLocaleString("id-ID")}`;

    // Expense breakdown by category
    const expenseByCategory = {};
    filteredExp.forEach(e => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });

    const expenseBreakdownEl = document.getElementById("plExpenseBreakdown");
    if (Object.keys(expenseByCategory).length === 0) {
      expenseBreakdownEl.innerHTML = `<p class="italic text-slate-400">Tidak ada pengeluaran pada periode ini.</p>`;
    } else {
      expenseBreakdownEl.innerHTML = Object.entries(expenseByCategory).map(([cat, amount]) => `
        <div class="flex justify-between items-center py-0.5">
          <span>• ${cat}</span>
          <span class="font-medium text-slate-700">Rp ${amount.toLocaleString("id-ID")}</span>
        </div>
      `).join("");
    }

    document.getElementById("plRowTotalExpenses").textContent = `(Rp ${totalExpenses.toLocaleString("id-ID")})`;

    const finalNetEl = document.getElementById("plRowFinalNetProfit");
    finalNetEl.textContent = `Rp ${netIncome.toLocaleString("id-ID")}`;
  }

  // ==================== MASTER PRODUK & MULTI-UNIT HIERARCHY ====================
  // ==================== MASTER PRODUK & STOK (ADMIN ONLY) ====================
  toggleQuickStockEdit() {
    this.isQuickStockMode = !this.isQuickStockMode;
    const btnText = document.getElementById("textQuickStock");
    const btnIcon = document.getElementById("iconQuickStock");
    const saveBtn = document.getElementById("btnSaveAllQuickStock");

    if (this.isQuickStockMode) {
      if (btnText) btnText.textContent = "Batal Edit Cepat";
      if (btnIcon) btnIcon.className = "fa-solid fa-xmark";
      if (saveBtn) saveBtn.classList.remove("hidden");
      this.showToast("Mode Edit Cepat Aktif: Anda bisa mengubah angka stok semua barang langsung pada tabel.", "info");
    } else {
      if (btnText) btnText.textContent = "Ubah Stok Semua Barang";
      if (btnIcon) btnIcon.className = "fa-solid fa-pen-to-square";
      if (saveBtn) saveBtn.classList.add("hidden");
    }

    this.renderProductMasterTable();
  }

  saveAllQuickStock() {
    const inputs = document.querySelectorAll(".quick-stock-input");
    let changedCount = 0;

    inputs.forEach(input => {
      const prodId = input.dataset.prodId;
      const newStock = Math.max(0, Number(input.value) || 0);
      const prod = this.products.find(p => p.id === prodId);
      if (prod && prod.stock !== newStock) {
        prod.stock = newStock;
        changedCount++;
      }
    });

    this.saveProducts();
    this.toggleQuickStockEdit(); // Keluar dari mode edit cepat
    this.renderPosProducts();
    this.showToast(`${changedCount} barang berhasil diperbarui stoknya!`, "success");

    // Sinkronkan ke Google Sheets jika online
    if (this.isOnlineState && this.settings.gasUrl) {
      this.syncPendingData();
    }
  }

  // Modal Penyesuaian Stok (Tambah / Kurang / Set Fisik dengan Satuan Bertingkat)
  openStockAdjustModal(prodId) {
    const prod = this.products.find(p => p.id === prodId);
    if (!prod) return;

    this.activeAdjustProduct = prod;
    this.stockAdjustType = "add";

    document.getElementById("stockAdjustProdId").value = prod.id;
    document.getElementById("stockAdjustProductName").textContent = `${prod.name} (${prod.category})`;
    document.getElementById("stockAdjustCurrentBase").textContent = `${prod.stock.toLocaleString("id-ID")} ${prod.baseUnit}`;
    document.getElementById("stockAdjustCurrentBreakdown").textContent = this.getStockBreakdown(prod);
    document.getElementById("stockAdjustAmount").value = 1;
    document.getElementById("stockAdjustNotes").value = "";

    // Isi pilihan satuan berdasarkan satuan produk
    const unitSelect = document.getElementById("stockAdjustUnitSelect");
    unitSelect.innerHTML = prod.units.map(u => `
      <option value="${u.multiplier}" data-unit-name="${u.unitName}">
        ${u.unitName} (${u.multiplier}x ${prod.baseUnit})
      </option>
    `).join("");

    this.updateStockAdjustTypeUI();
    this.calcStockAdjustPreview();

    document.getElementById("stockAdjustModal").classList.remove("hidden");
  }

  closeStockAdjustModal() {
    document.getElementById("stockAdjustModal").classList.add("hidden");
    this.activeAdjustProduct = null;
  }

  setStockAdjustType(type) {
    this.stockAdjustType = type;
    this.updateStockAdjustTypeUI();
    this.calcStockAdjustPreview();
  }

  updateStockAdjustTypeUI() {
    const types = ["add", "subtract", "set"];
    types.forEach(t => {
      const btn = document.getElementById(`stockTypeBtn-${t}`);
      if (!btn) return;
      if (t === this.stockAdjustType) {
        btn.className = "py-2 text-center rounded-lg border font-bold text-xs bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs transition";
      } else {
        btn.className = "py-2 text-center rounded-lg border font-bold text-xs bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 transition";
      }
    });

    const amountLabel = document.getElementById("stockAdjustAmountLabel");
    const unitContainer = document.getElementById("stockAdjustUnitContainer");
    const amountInput = document.getElementById("stockAdjustAmount");

    if (this.stockAdjustType === "add") {
      amountLabel.textContent = "Jumlah Masuk (Kulakan)";
      unitContainer.classList.remove("hidden");
      amountInput.min = "1";
    } else if (this.stockAdjustType === "subtract") {
      amountLabel.textContent = "Jumlah Keluar (Rusak/Hilang)";
      unitContainer.classList.remove("hidden");
      amountInput.min = "1";
    } else { // 'set'
      amountLabel.textContent = "Stok Fisik Baru (Opname)";
      unitContainer.classList.add("hidden");
      amountInput.min = "0";
      if (this.activeAdjustProduct) {
        amountInput.value = this.activeAdjustProduct.stock;
      }
    }
  }

  calcStockAdjustPreview() {
    if (!this.activeAdjustProduct) return;
    const prod = this.activeAdjustProduct;
    const amount = Number(document.getElementById("stockAdjustAmount").value) || 0;
    const unitMult = Number(document.getElementById("stockAdjustUnitSelect").value) || 1;
    const previewEl = document.getElementById("stockAdjustPreviewResult");

    let newStock = prod.stock;

    if (this.stockAdjustType === "add") {
      newStock = prod.stock + (amount * unitMult);
    } else if (this.stockAdjustType === "subtract") {
      newStock = Math.max(0, prod.stock - (amount * unitMult));
    } else { // 'set'
      newStock = Math.max(0, amount);
    }

    // Mock object to get breakdown preview
    const mockProd = { ...prod, stock: newStock };
    const breakdown = this.getStockBreakdown(mockProd);

    previewEl.innerHTML = `<b>${newStock.toLocaleString("id-ID")} ${prod.baseUnit}</b> <span class="text-[10px] text-slate-500 font-normal">(${breakdown})</span>`;
  }

  saveStockAdjustment(e) {
    e.preventDefault();
    if (!this.activeAdjustProduct) return;

    const prod = this.activeAdjustProduct;
    const amount = Number(document.getElementById("stockAdjustAmount").value) || 0;
    const unitSelect = document.getElementById("stockAdjustUnitSelect");
    const unitMult = Number(unitSelect.value) || 1;

    let oldStock = prod.stock;
    let newStock = oldStock;

    if (this.stockAdjustType === "add") {
      if (amount <= 0) {
        this.showToast("Jumlah masuk harus lebih dari 0!", "warning");
        return;
      }
      newStock = oldStock + (amount * unitMult);
    } else if (this.stockAdjustType === "subtract") {
      if (amount <= 0) {
        this.showToast("Jumlah keluar harus lebih dari 0!", "warning");
        return;
      }
      newStock = Math.max(0, oldStock - (amount * unitMult));
    } else { // 'set'
      newStock = Math.max(0, amount);
    }

    prod.stock = newStock;
    this.saveProducts();
    this.closeStockAdjustModal();

    this.renderProductMasterTable();
    this.renderPosProducts();

    const changeDiff = newStock - oldStock;
    const sign = changeDiff >= 0 ? `+${changeDiff}` : `${changeDiff}`;
    this.showToast(`Stok ${prod.name} diperbarui: ${newStock.toLocaleString("id-ID")} ${prod.baseUnit} (${sign})`, "success");

    // Sinkronkan ke Google Sheets jika online
    if (this.isOnlineState && this.settings.gasUrl) {
      this.syncPendingData();
    }
  }

  renderProductMasterTable() {
    const tbody = document.getElementById("productMasterTableBody");
    tbody.innerHTML = this.products.map(p => {
      const unitsList = p.units.map(u => `
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-[11px] text-slate-700 mr-1 mb-1 border border-slate-200">
          <b>${u.unitName}</b> (${u.multiplier}x): Jual <b>Rp ${u.sellPrice.toLocaleString("id-ID")}</b> | Modal Rp ${u.buyPrice.toLocaleString("id-ID")}
        </span>
      `).join("");

      // Stock Column: Input saat mode edit cepat, atau Teks + Tombol saat mode biasa
      const stockCell = this.isQuickStockMode
        ? `
          <div class="space-y-1">
            <div class="flex items-center gap-1.5">
              <input type="number" min="0" value="${p.stock}" data-prod-id="${p.id}" class="quick-stock-input w-28 px-2.5 py-1.5 border-2 border-amber-400 bg-amber-50 rounded-lg font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner">
              <span class="text-xs text-slate-600 font-semibold">${p.baseUnit}</span>
            </div>
            <div class="text-[10px] text-slate-500 font-mono">${this.getStockBreakdown(p)}</div>
          </div>
        `
        : `
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-indigo-600 text-sm">${p.stock.toLocaleString("id-ID")}</span> 
              <span class="text-slate-500 font-medium">${p.baseUnit}</span>
              <button onclick="app.openStockAdjustModal('${p.id}')" class="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-semibold text-[11px] border border-indigo-200 transition" title="Sesuaikan Stok">
                <i class="fa-solid fa-boxes-packing mr-1"></i>Ubah Stok
              </button>
            </div>
            <div class="text-[10px] text-slate-600 mt-1 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
              <i class="fa-solid fa-cubes-stacked text-indigo-500 mr-1"></i>${this.getStockBreakdown(p)}
            </div>
          </div>
        `;

      return `
        <tr class="hover:bg-slate-50 transition">
          <td class="py-3 px-4">
            <span class="font-bold text-slate-900">${p.name}</span>
            <span class="text-[10px] block text-slate-400 uppercase font-semibold">${p.category}</span>
          </td>
          <td class="py-3 px-4">
            ${stockCell}
          </td>
          <td class="py-3 px-4 max-w-md">
            <div class="flex flex-wrap">${unitsList}</div>
          </td>
          <td class="py-3 px-4 text-slate-600 font-mono">
            Rp ${p.units[0] ? p.units[0].buyPrice.toLocaleString("id-ID") : 0}
          </td>
          <td class="py-3 px-4 text-center">
            <div class="flex items-center justify-center gap-1.5">
              <button onclick="app.openStockAdjustModal('${p.id}')" class="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Ubah Stok">
                <i class="fa-solid fa-boxes-packing"></i>
              </button>
              <button onclick="app.editProduct('${p.id}')" class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Edit Produk">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button onclick="app.deleteProduct('${p.id}')" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded" title="Hapus Produk">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  openProductModal(prodId = null) {
    const modal = document.getElementById("productModal");
    const title = document.getElementById("productModalTitle");
    const container = document.getElementById("unitRowsContainer");

    container.innerHTML = "";
    document.getElementById("prodEditId").value = "";

    if (prodId) {
      const prod = this.products.find(p => p.id === prodId);
      if (!prod) return;
      title.textContent = `Edit Produk: ${prod.name}`;
      document.getElementById("prodEditId").value = prod.id;
      document.getElementById("prodName").value = prod.name;
      document.getElementById("prodCategory").value = prod.category;
      document.getElementById("prodBaseUnit").value = prod.baseUnit;
      document.getElementById("prodStock").value = prod.stock;

      prod.units.forEach(u => this.addUnitRow(u.unitName, u.multiplier, u.sellPrice, u.buyPrice));
    } else {
      title.textContent = "Tambah Produk Baru";
      document.getElementById("prodName").value = "";
      document.getElementById("prodCategory").value = "Rokok";
      document.getElementById("prodBaseUnit").value = "Batang";
      document.getElementById("prodStock").value = 1600;

      // Add default unit templates for cigarette
      this.addUnitRow("Batang", 1, 2500, 1900);
      this.addUnitRow("Bungkus", 16, 35000, 29500);
      this.addUnitRow("Slop", 160, 345000, 290000);
      this.addUnitRow("Bal", 1600, 3400000, 2880000);
    }

    modal.classList.remove("hidden");
  }

  closeProductModal() {
    document.getElementById("productModal").classList.add("hidden");
  }

  addUnitRow(unitName = "", multiplier = 1, sellPrice = "", buyPrice = "") {
    const container = document.getElementById("unitRowsContainer");
    const row = document.createElement("tr");
    row.className = "unit-row py-1";
    row.innerHTML = `
      <td class="py-1.5 pr-2">
        <input type="text" placeholder="Bungkus/Slop/Bal" value="${unitName}" required class="w-full px-2 py-1.5 border border-slate-200 rounded font-semibold text-xs u-name">
      </td>
      <td class="py-1.5 pr-2">
        <input type="number" min="1" placeholder="1" value="${multiplier}" required class="w-20 px-2 py-1.5 border border-slate-200 rounded font-mono text-xs u-mult">
      </td>
      <td class="py-1.5 pr-2">
        <input type="number" min="0" placeholder="Harga Jual" value="${sellPrice}" required class="w-28 px-2 py-1.5 border border-slate-200 rounded font-semibold text-xs u-sell">
      </td>
      <td class="py-1.5 pr-2">
        <input type="number" min="0" placeholder="Modal/HPP" value="${buyPrice}" required class="w-28 px-2 py-1.5 border border-slate-200 rounded text-xs u-buy">
      </td>
      <td class="py-1.5 text-center">
        <button type="button" onclick="this.closest('tr').remove()" class="text-rose-500 hover:text-rose-700 p-1">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    container.appendChild(row);
  }

  saveProduct(e) {
    e.preventDefault();
    const editId = document.getElementById("prodEditId").value;
    const name = document.getElementById("prodName").value.trim();
    const category = document.getElementById("prodCategory").value;
    const baseUnit = document.getElementById("prodBaseUnit").value.trim();
    const stock = Number(document.getElementById("prodStock").value);

    // Collect units
    const unitRows = document.querySelectorAll("#unitRowsContainer tr.unit-row");
    const units = [];
    unitRows.forEach(row => {
      const uName = row.querySelector(".u-name").value.trim();
      const uMult = Number(row.querySelector(".u-mult").value) || 1;
      const uSell = Number(row.querySelector(".u-sell").value) || 0;
      const uBuy = Number(row.querySelector(".u-buy").value) || 0;
      if (uName) {
        units.push({
          unitName: uName,
          multiplier: uMult,
          sellPrice: uSell,
          buyPrice: uBuy
        });
      }
    });

    if (units.length === 0) {
      this.showToast("Minimal harus memiliki 1 satuan harga!", "warning");
      return;
    }

    if (editId) {
      // Update existing
      const idx = this.products.findIndex(p => p.id === editId);
      if (idx > -1) {
        this.products[idx] = {
          ...this.products[idx],
          name, category, baseUnit, stock, units
        };
      }
    } else {
      // Create new
      const newProd = {
        id: `PROD-${Date.now()}`,
        name, category, baseUnit, stock, units
      };
      this.products.push(newProd);
    }

    this.saveProducts();
    this.closeProductModal();
    this.renderProductMasterTable();
    this.renderPosProducts();
    this.showToast("Data barang berhasil disimpan!", "success");
  }

  editProduct(prodId) {
    this.openProductModal(prodId);
  }

  deleteProduct(prodId) {
    if (!confirm("Hapus produk ini dari daftar barang?")) return;
    this.products = this.products.filter(p => p.id !== prodId);
    this.saveProducts();
    this.renderProductMasterTable();
    this.renderPosProducts();
    this.showToast("Produk telah dihapus", "info");
  }

  // ==================== SETTINGS & GOOGLE SHEETS SYNC ====================
  fillSettingsForm() {
    const urlField = document.getElementById("settingGasUrl");
    const nameField = document.getElementById("settingStoreName");
    const phoneField = document.getElementById("settingStorePhone");
    const addrField = document.getElementById("settingStoreAddress");
    const currentOwnerBadge = document.getElementById("settingCurrentActiveOwner");
    const ownerChoiceSub = document.getElementById("ownerChoiceSubtitle");

    if (urlField) urlField.value = this.settings.gasUrl || "";
    if (nameField) nameField.value = this.settings.storeName || "";
    if (phoneField) phoneField.value = this.settings.storePhone || "";
    if (addrField) addrField.value = this.settings.storeAddress || "";

    // Update subtitle di modal pilihan login dengan semua nama pemilik
    if (ownerChoiceSub && this.owners && this.owners.length > 0) {
      const namesList = this.owners.map(o => o.name).join(", ");
      ownerChoiceSub.textContent = `${namesList} (Kelola penuh & PIN Pemilik)`;
    }

    // Update indikator pemilik yang sedang aktif
    const activeOwnerId = (this.activeSession && this.activeSession.type === "owner") ? this.activeSession.id : "";
    const activeOwnerName = (this.activeSession && this.activeSession.type === "owner") ? this.activeSession.name : "-";
    if (currentOwnerBadge) {
      currentOwnerBadge.textContent = activeOwnerId ? `👑 ${activeOwnerName}` : "Belum Login Pemilik";
    }

    this.renderOwnerAccountsInSettings();
  }

  renderOwnerAccountsInSettings() {
    const container = document.getElementById("ownerAccountsListContainer");
    if (!container) return;

    const activeOwnerId = (this.activeSession && this.activeSession.type === "owner") ? this.activeSession.id : "";
    const totalOwners = (this.owners || []).length;

    container.innerHTML = (this.owners || []).map((o, idx) => {
      const num = idx + 1;
      const isActive = o.ownerId === activeOwnerId;
      const statusBadge = isActive
        ? `<span class="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-full">● Sedang Login</span>`
        : `<span class="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">Pemilik ${num}</span>`;

      const deleteBtn = totalOwners > 1
        ? `<button type="button" onclick="app.deleteOwnerAccount('${o.ownerId}')" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold transition flex items-center gap-1" title="Hapus Akun Pemilik ${num}">
             <i class="fa-solid fa-trash"></i>
             <span>Hapus</span>
           </button>`
        : "";

      const nameInputId = `settingOwnerName_${o.ownerId}`;
      const pinInputId = `settingOwnerPin_${o.ownerId}`;
      const eyeIconId = `eyeIcon_${o.ownerId}`;

      return `
        <div class="p-3.5 sm:p-4 rounded-xl border ${isActive ? 'border-purple-300 bg-purple-50/40' : 'border-slate-200 bg-slate-50/60'} space-y-3 transition">
          <div class="flex items-center justify-between border-b border-slate-200/80 pb-2 gap-2">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs shrink-0">${num}</span>
              <div>
                <h3 class="font-bold text-slate-900 text-xs">Akun Pemilik ${num}</h3>
                <span class="text-[10px] font-mono text-slate-400">ID: ${o.ownerId}</span>
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              ${statusBadge}
              ${deleteBtn}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div class="sm:col-span-7">
              <label class="block font-semibold text-slate-700 mb-1">Nama Pemilik ${num}</label>
              <div class="relative">
                <i class="fa-solid fa-user-pen absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input type="text" id="${nameInputId}" data-owner-id="${o.ownerId}" placeholder="Contoh: Dewa Ayu" value="${o.name || ''}" class="owner-name-input w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none">
              </div>
            </div>

            <div class="sm:col-span-5">
              <label class="block font-semibold text-slate-700 mb-1">PIN Login (4-6 Digit)</label>
              <div class="relative">
                <i class="fa-solid fa-key absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input type="password" id="${pinInputId}" data-owner-id="${o.ownerId}" maxlength="6" value="${o.pin || ''}" placeholder="****" class="owner-pin-input w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold tracking-widest text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none">
                <button type="button" onclick="app.toggleOwnerPinVisibility('${pinInputId}', '${eyeIconId}')" class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1" title="Lihat / Sembunyikan PIN">
                  <i id="${eyeIconId}" class="fa-solid fa-eye text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  syncOwnerInputsFromDOM() {
    (this.owners || []).forEach(o => {
      const nameInput = document.getElementById(`settingOwnerName_${o.ownerId}`);
      const pinInput = document.getElementById(`settingOwnerPin_${o.ownerId}`);
      if (nameInput && nameInput.value.trim()) {
        o.name = nameInput.value.trim();
      }
      if (pinInput && pinInput.value.trim()) {
        o.pin = pinInput.value.trim();
      }
    });
  }

  addNewOwnerAccount() {
    if (!this.activeSession || this.activeSession.type !== "owner") {
      this.showToast("Hanya Pemilik Toko yang dapat menambahkan akun Pemilik baru!", "warning");
      return;
    }

    // Simpan sementara nilai yang sedang diketik di form agar tidak hilang
    this.syncOwnerInputsFromDOM();

    // Cari nomor ID pemilik berikutnya
    let nextNum = (this.owners || []).length + 1;
    let nextId = `OWNER-${nextNum}`;
    while (this.owners.some(o => o.ownerId === nextId)) {
      nextNum++;
      nextId = `OWNER-${nextNum}`;
    }

    const newOwner = {
      ownerId: nextId,
      name: `Pemilik ${nextNum}`,
      pin: "1234",
      role: "owner"
    };

    this.owners.push(newOwner);
    this.saveOwners();
    this.fillSettingsForm();
    this.showToast(`Akun Pemilik Baru (${nextId}) ditambahkan! Silakan ubah nama dan PIN-nya.`, "success");

    setTimeout(() => {
      const newNameInput = document.getElementById(`settingOwnerName_${nextId}`);
      if (newNameInput) {
        newNameInput.focus();
        if (typeof newNameInput.select === "function") newNameInput.select();
      }
    }, 80);
  }

  deleteOwnerAccount(ownerId) {
    if (!this.activeSession || this.activeSession.type !== "owner") {
      this.showToast("Hanya Pemilik Toko yang dapat menghapus akun Pemilik!", "warning");
      return;
    }

    if ((this.owners || []).length <= 1) {
      this.showToast("Minimal harus ada 1 akun Pemilik Toko!", "warning");
      return;
    }

    const target = this.owners.find(o => o.ownerId === ownerId);
    if (!target) return;

    if (this.activeSession && this.activeSession.id === ownerId) {
      this.showToast("Tidak dapat menghapus akun Pemilik yang sedang digunakan login saat ini! Pindah login terlebih dahulu.", "warning");
      return;
    }

    if (!confirm(`Hapus akun Pemilik "${target.name}" (${target.ownerId})?`)) return;

    this.syncOwnerInputsFromDOM();
    this.owners = this.owners.filter(o => o.ownerId !== ownerId);
    this.saveOwners();
    this.fillSettingsForm();
    this.showToast(`Akun Pemilik "${target.name}" telah dihapus.`, "info");
  }

  toggleOwnerPinVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input) return;
    if (input.type === "password") {
      input.type = "text";
      if (icon) icon.className = "fa-solid fa-eye-slash text-xs text-purple-600";
    } else {
      input.type = "password";
      if (icon) icon.className = "fa-solid fa-eye text-xs";
    }
  }

  saveOwnerAccountSettings(silent = false) {
    if (!this.activeSession || this.activeSession.type !== "owner") {
      if (!silent) this.showToast("Hanya Pemilik Toko yang dapat mengubah nama dan PIN Pemilik!", "warning");
      return false;
    }

    for (let i = 0; i < (this.owners || []).length; i++) {
      const o = this.owners[i];
      const nameInput = document.getElementById(`settingOwnerName_${o.ownerId}`);
      const pinInput = document.getElementById(`settingOwnerPin_${o.ownerId}`);

      const newName = nameInput ? nameInput.value.trim() : o.name;
      const newPin = pinInput ? pinInput.value.trim() : o.pin;

      if (!newName || !newPin) {
        if (!silent) {
          this.showToast(`Nama dan PIN untuk Akun Pemilik ${i + 1} (${o.ownerId}) tidak boleh kosong!`, "warning");
          if (!newName && nameInput) nameInput.focus();
          else if (!newPin && pinInput) pinInput.focus();
        }
        return false;
      }

      o.name = newName;
      o.pin = newPin;
    }

    this.saveOwners();

    // Jika sesi pemilik sedang aktif, perbarui nama di sesi aktif & header secara langsung
    if (this.activeSession && this.activeSession.type === "owner") {
      const updatedCurrentOwner = this.owners.find(o => o.ownerId === this.activeSession.id);
      if (updatedCurrentOwner) {
        this.activeSession.name = updatedCurrentOwner.name;
        this.saveActiveSession(this.activeSession);
        if (this.cashierSession) {
          this.cashierSession.employeeName = updatedCurrentOwner.name;
        }
      }
    }

    this.updateRoleUI();
    this.updateCashierShiftUI();
    this.fillSettingsForm();

    if (!silent) {
      this.showToast("Daftar Akun, Nama & PIN Login Pemilik berhasil disimpan!", "success");
    }
    return true;
  }

  saveSettings() {
    this.settings.gasUrl = document.getElementById("settingGasUrl").value.trim();
    this.settings.storeName = document.getElementById("settingStoreName").value.trim() || "Toko Berkah Grosir";
    this.settings.storePhone = document.getElementById("settingStorePhone").value.trim();
    this.settings.storeAddress = document.getElementById("settingStoreAddress").value.trim();

    // Simpan juga perubahan nama & PIN pemilik jika sedang login sebagai Pemilik
    if (this.activeSession && this.activeSession.type === "owner") {
      this.saveOwnerAccountSettings(true);
    }

    this.saveSettingsLocal();
    document.getElementById("headerStoreName").textContent = this.settings.storeName;
    this.showToast("Pengaturan toko berhasil disimpan!", "success");
  }

  async testCloudConnection() {
    const url = document.getElementById("settingGasUrl").value.trim();
    if (!url) {
      this.showToast("Masukkan Google Apps Script Web App URL terlebih dahulu!", "warning");
      return;
    }

    this.showToast("Menghubungkan ke Google Spreadsheet...", "info");
    try {
      const response = await fetch(`${url}?action=ping`, { 
        method: "GET",
        redirect: "follow"
      });

      if (response.status === 403 || response.status === 401) {
        alert("PERHATIAN:\nGoogle Apps Script mengembalikan 'Akses Ditolak' (403 Forbidden).\n\nPenyebab:\nSaat melakukan Deploy di Google Sheets, opsi 'Who has access (Siapa yang memiliki akses)' masih terpilih 'Only myself (Hanya saya)'.\n\nSolusi:\n1. Buka Apps Script di Google Sheets.\n2. Klik Deploy > Manage deployments.\n3. Edit penerapan dan ubah 'Who has access' menjadi 'Anyone (Siapa saja)'.\n4. Klik Deploy.");
        this.showToast("Akses Ditolak (403). Ubah izin akses ke 'Anyone' di Google Sheets!", "warning");
        return;
      }

      const result = await response.json();
      if (result && result.status === "success") {
        this.showToast("Koneksi ke Google Sheets BERHASIL!", "success");
      } else {
        this.showToast("Tersambung ke server tetapi ada respon tidak terduga", "warning");
      }
    } catch (err) {
      console.warn("Connection test error:", err);
      this.showToast("Gagal terhubung. Pastikan izin akses di Apps Script diatur ke 'Anyone'", "warning");
    }
  }

  async manualSync() {
    const isOnline = await this.checkNetworkStatus(false);
    if (!isOnline) {
      this.showToast("Tidak ada koneksi internet! Harap sambungkan wifi/paket data.", "warning");
      return;
    }
    if (!this.settings.gasUrl) {
      this.showToast("Google Apps Script URL belum diatur di menu Pengaturan!", "warning");
      this.switchTab("settings");
      return;
    }
    await this.syncPendingData();
  }

  // Refresh otomatis setelah transaksi (online: upload antrean lalu muat ulang data & UI)
  async autoRefreshAfterTransaction() {
    try {
      const isOnline = await this.checkNetworkStatus(true);
      if (isOnline && this.settings.gasUrl) {
        await this.syncPendingData(true);
      }
      this.softReloadData();
    } catch (err) {
      console.warn("Auto refresh error:", err);
    }
  }

  // Muat ulang state dari penyimpanan lokal & render ulang UI tanpa reload halaman (struk/keranjang aman)
  softReloadData() {
    try {
      const safeParse = (key, fallback) => {
        try {
          const v = localStorage.getItem(key);
          return v ? JSON.parse(v) : fallback;
        } catch (e) { return fallback; }
      };
      this.transactions = safeParse("toko_transactions", this.transactions);
      this.expenses = safeParse("toko_expenses", this.expenses);
      this.products = safeParse("toko_products", this.products);
      this.users = safeParse("toko_users", this.users);

      this.renderPosProducts();
      this.renderTransactionHistory();
      this.renderExpensesTable();
      this.renderProductMasterTable();
      if (this.currentRole === "admin" || this.currentRole === "owner") this.renderProfitLoss();
      this.updatePendingCount();
    } catch (err) {
      console.warn("Soft reload error:", err);
    }
  }

  // Worker: coba upload antrean tiap 30 detik & saat tab aktif kembali
  startAutoSyncWorker() {
    if (this._autoSyncStarted) return;
    this._autoSyncStarted = true;
    setInterval(() => {
      if (this.isOnlineState && this.settings.gasUrl && this.getPendingTotal() > 0) {
        this.syncPendingData(true);
      }
    }, 30000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") this.autoRefreshAfterTransaction();
    });
  }

  getPendingTotal() {
    const tx = (this.transactions || []).filter(t => !t.isSynced).length;
    const ex = (this.expenses || []).filter(e => !e.isSynced).length;
    const cc = (this.cancelledInvoices || []).length;
    return tx + ex + cc;
  }

  async syncPendingData(silent = false) {
    this.startAutoSyncWorker();
    if (this.isOnlineState === false || !this.settings.gasUrl) {
      this.updatePendingCount();
      return;
    }
    // Kunci: cegah upload ganda bila sync dipanggil bersamaan
    if (this.isSyncing) {
      this._syncAgain = true;
      return;
    }

    const pendingTx = this.transactions.filter(t => !t.isSynced);
    const pendingExp = this.expenses.filter(e => !e.isSynced);
    const cancelledSnapshot = [...(this.cancelledInvoices || [])];
    const hasCancelled = cancelledSnapshot.length > 0;

    if (pendingTx.length === 0 && pendingExp.length === 0 && !hasCancelled) {
      this.updatePendingCount();
      return;
    }

    this.isSyncing = true;
    const syncBtn = document.getElementById("syncNowBtn");
    if (syncBtn) syncBtn.classList.add("opacity-50", "pointer-events-none");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const payload = {
        action: "syncBatch",
        storeName: this.settings.storeName,
        transactions: pendingTx,
        expenses: pendingExp,
        products: this.products,
        users: this.users,
        cancelledInvoices: cancelledSnapshot
      };

      // text/plain untuk menghindari CORS preflight di Apps Script
      const res = await fetch(this.settings.gasUrl, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (res.status === 403 || res.status === 401) {
        this.showToast("Gagal kirim ke Google Sheets: Ubah izin akses Web App ke 'Anyone'!", "warning");
        return;
      }

      const data = await res.json();
      if (data && data.status === "success") {
        // Tandai HANYA item yang benar-benar terkirim (transaksi baru selama upload tetap di antrean)
        const sentTxIds = new Set(pendingTx.map(t => t.invoiceNo || t.id));
        const sentExpIds = new Set(pendingExp.map(e => e.id));
        this.transactions.forEach(t => { if (sentTxIds.has(t.invoiceNo || t.id)) t.isSynced = true; });
        this.expenses.forEach(e => { if (sentExpIds.has(e.id)) e.isSynced = true; });

        if (hasCancelled) {
          this.cancelledInvoices = (this.cancelledInvoices || []).filter(c => !cancelledSnapshot.includes(c));
          if (this.cancelledInvoices.length === 0) {
            localStorage.removeItem("toko_cancelled_invoices");
          } else {
            localStorage.setItem("toko_cancelled_invoices", JSON.stringify(this.cancelledInvoices));
          }
        }

        this.saveTransactions();
        this.saveExpenses();

        if (!silent || pendingTx.length + pendingExp.length > 0) {
          this.showToast(`${pendingTx.length} transaksi & ${pendingExp.length} pengeluaran tersinkron ke Google Sheets`, "success");
        }
        this.renderTransactionHistory();
        this.renderExpensesTable();
      } else {
        throw new Error(data ? data.message : "Gagal sinkron");
      }
    } catch (err) {
      console.error("Sync Error:", err);
      if (!silent) this.showToast("Sinkronisasi tertunda (data tetap aman di perangkat lokal, akan dikirim otomatis)", "info");
    } finally {
      clearTimeout(timeoutId);
      this.isSyncing = false;
      if (syncBtn) syncBtn.classList.remove("opacity-50", "pointer-events-none");
      this.updatePendingCount();
      // Jika ada permintaan sync baru saat proses berjalan, jalankan lagi
      if (this._syncAgain) {
        this._syncAgain = false;
        setTimeout(() => this.syncPendingData(true), 500);
      }
    }
  }

  // ==================== BACKUP & DATA RESET ====================
  exportLocalBackup() {
    const backupData = {
      timestamp: new Date().toISOString(),
      store: this.settings,
      products: this.products,
      transactions: this.transactions,
      expenses: this.expenses
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_kasir_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast("Cadangan data berhasil diunduh!", "success");
  }

  loadSampleData() {
    if (!confirm("Muat data contoh rokok & sembako?")) return;
    this.products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    this.expenses = JSON.parse(JSON.stringify(DEFAULT_EXPENSES));
    this.saveProducts();
    this.saveExpenses();
    this.renderPosProducts();
    this.renderProductMasterTable();
    this.renderExpensesTable();
    this.showToast("Data contoh berhasil dimuat!", "success");
  }

  resetAllData() {
    if (!confirm("PERINGATAN: Ini akan mereset seluruh data transaksi, stok, dan pengeluaran di browser ini. Lanjutkan?")) return;
    localStorage.clear();
    location.reload();
  }

  // ==================== KEYBOARD SHORTCUTS & HELPERS ====================
  initKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      // F9: Quick Checkout
      if (e.key === "F9") {
        e.preventDefault();
        this.processCheckout();
      }
      // Esc: Close Modals
      if (e.key === "Escape") {
        this.closeLoginChoiceModal();
        this.closeRoleModal();
        this.closeEmployeeLoginModal();
        this.closeProductModal();
        this.closeReceiptModal();
        this.closeShiftReportModal();
        this.closeCancelModal();
      }
    });
  }

  showToast(message, type = "success") {
    const toast = document.getElementById("toastNotification");
    const msgEl = document.getElementById("toastMessage");
    const iconEl = document.getElementById("toastIcon");

    msgEl.textContent = message;

    if (type === "warning") {
      iconEl.className = "fa-solid fa-triangle-exclamation text-amber-400";
    } else if (type === "info") {
      iconEl.className = "fa-solid fa-circle-info text-blue-400";
    } else {
      iconEl.className = "fa-solid fa-circle-check text-emerald-400";
    }

    toast.classList.remove("translate-y-20", "opacity-0");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.add("translate-y-20", "opacity-0");
    }, 4000);
  }
}

// Global initialization
let app;
window.addEventListener("DOMContentLoaded", () => {
  app = new KasirApp();
});
