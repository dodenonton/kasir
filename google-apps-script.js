/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT (GAS) - DATABASE BACKEND UNTUK APLIKASI KASIR
 * =========================================================================================
 * 
 * CARA MEMASANG DI GOOGLE SPREADSHEETS:
 * 1. Buka Google Spreadsheet baru di Google Drive Anda.
 * 2. Beri nama spreadsheet Anda, contoh: "Database Kasir Toko Berkah".
 * 3. Klik menu "Ekstensi" (Extensions) -> "Apps Script".
 * 4. Hapus seluruh isi default pada "Kode.gs" dan tempel (paste) seluruh isi file ini.
 * 5. Klik ikon Simpan (Disket) atau tekan Ctrl+S / Cmd+S.
 * 6. Klik tombol biru "Terapkan" (Deploy) di kanan atas -> Pilih "Penerapan baru" (New deployment).
 * 7. Pada ikon Gerigi (Select type), pilih jenis "Aplikasi Web" (Web app).
 * 8. Konfigurasi:
 *    - Deskripsi: "Backend Kasir v1"
 *    - Jalankan sebagai (Execute as): "Saya (email Anda)"
 *    - Siapa yang memiliki akses (Who has access): "Siapa saja" (Anyone) -> SANGAT PENTING agar web kasir bisa kirim data!
 * 9. Klik "Terapkan" (Deploy). Berikan izin akses (Review Permissions -> Lanjutan -> Buka).
 * 10. Salin URL Aplikasi Web (akhiran /exec) dan tempelkan ke menu "Pengaturan Database" di web kasir Anda.
 * =========================================================================================
 */

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : "";
  
  if (action === "ping") {
    return createJsonResponse({
      status: "success",
      message: "Koneksi ke Google Spreadsheet Berhasil!",
      timestamp: new Date().toISOString()
    });
  }

  return createJsonResponse({
    status: "success",
    message: "Google Apps Script Kasir Online Siap Menerima Data.",
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Lock timeout 30 detik untuk mencegah race conditions saat banyak kasir kirim bersamaan
  lock.tryLock(30000);

  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var action = data.action;

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Inisialisasi Sheet jika belum ada
    initSheetsIfNotExist(ss);

    if (action === "syncBatch") {
      var syncResult = processSyncBatch(ss, data);
      return createJsonResponse({
        status: "success",
        message: "Data berhasil disinkronkan ke Google Sheets",
        result: syncResult
      });
    }

    return createJsonResponse({
      status: "error",
      message: "Action tidak dikenali"
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Memproses batch transaksi dan pengeluaran secara idempotent (mencegah duplikat)
 */
function processSyncBatch(ss, payload) {
  var transactions = payload.transactions || [];
  var expenses = payload.expenses || [];
  var products = payload.products || [];

  var txSheet = ss.getSheetByName("Transaksi");
  var itemSheet = ss.getSheetByName("Item_Transaksi");
  var expSheet = ss.getSheetByName("Pengeluaran");
  var prodSheet = ss.getSheetByName("Produk_Stok");

  // A. Hapus Transaksi yang Dibatalkan (jika ada pembatalan / tambah barang)
  var cancelledInvoices = payload.cancelledInvoices || [];
  if (cancelledInvoices.length > 0) {
    deleteInvoicesFromSheet(txSheet, cancelledInvoices);
    deleteInvoicesFromSheet(itemSheet, cancelledInvoices);
  }

  // B. Ambil Invoice & Expense ID yang sudah ada di spreadsheet agar tidak duplikat
  var existingInvoices = getColumnValues(txSheet, 1); // Kolom A: No Faktur
  var existingExpenseIds = getColumnValues(expSheet, 1); // Kolom A: ID Biaya

  var txRows = [];
  var itemRows = [];
  var expRows = [];

  // B. Proses Transaksi & Detail Item
  for (var i = 0; i < transactions.length; i++) {
    var tx = transactions[i];
    if (existingInvoices.indexOf(tx.invoiceNo) === -1) {
      // Baris Header Transaksi
      txRows.push([
        tx.invoiceNo,
        tx.date,
        tx.time,
        tx.cashier,
        tx.customerName,
        tx.paymentType,
        tx.subtotal,
        tx.discount,
        tx.total,
        tx.totalHpp,
        tx.grossProfit,
        tx.cashReceived,
        tx.change,
        new Date()
      ]);

      // Baris Detail Item Transaksi
      if (tx.items && tx.items.length > 0) {
        for (var j = 0; j < tx.items.length; j++) {
          var itm = tx.items[j];
          itemRows.push([
            tx.invoiceNo,
            tx.date,
            itm.productId,
            itm.productName,
            itm.category,
            itm.unitName,
            itm.multiplier,
            itm.qty,
            itm.sellPrice,
            itm.buyPrice,
            itm.subtotal,
            itm.hppTotal,
            (itm.subtotal - itm.hppTotal)
          ]);
        }
      }
    }
  }

  // C. Proses Pengeluaran Biaya
  for (var k = 0; k < expenses.length; k++) {
    var exp = expenses[k];
    if (existingExpenseIds.indexOf(exp.id) === -1) {
      expRows.push([
        exp.id,
        exp.date,
        exp.category,
        exp.amount,
        exp.notes || "",
        new Date()
      ]);
    }
  }

  // D. Simpan Transaksi ke Sheet
  if (txRows.length > 0) {
    txSheet.getRange(txSheet.getLastRow() + 1, 1, txRows.length, txRows[0].length).setValues(txRows);
  }
  if (itemRows.length > 0) {
    itemSheet.getRange(itemSheet.getLastRow() + 1, 1, itemRows.length, itemRows[0].length).setValues(itemRows);
  }

  // E. Simpan Pengeluaran ke Sheet
  if (expRows.length > 0) {
    expSheet.getRange(expSheet.getLastRow() + 1, 1, expRows.length, expRows[0].length).setValues(expRows);
  }

  // F. Perbarui Master Stok Produk
  if (products.length > 0) {
    updateProductStockSheet(prodSheet, products);
  }

  return {
    syncedTransactions: txRows.length,
    syncedExpenses: expRows.length
  };
}

/**
 * Update lembar data stok produk
 */
function updateProductStockSheet(prodSheet, products) {
  // Kosongkan baris lama kecuali header
  var lastRow = prodSheet.getLastRow();
  if (lastRow > 1) {
    prodSheet.getRange(2, 1, lastRow - 1, 6).clearContent();
  }

  var rows = [];
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var unitSummary = p.units.map(function(u) {
      return u.unitName + " (Rp" + u.sellPrice + ")";
    }).join(", ");

    rows.push([
      p.id,
      p.name,
      p.category,
      p.stock,
      p.baseUnit,
      unitSummary
    ]);
  }

  if (rows.length > 0) {
    prodSheet.getRange(2, 1, rows.length, 6).setValues(rows);
  }
}

/**
 * Buat lembar kerja dengan header rapi secara otomatis
 */
function initSheetsIfNotExist(ss) {
  // 1. Transaksi
  var txSheet = ss.getSheetByName("Transaksi");
  if (!txSheet) {
    txSheet = ss.insertSheet("Transaksi");
    var headers = [
      "No Faktur", "Tanggal", "Jam", "Kasir", "Pelanggan", "Metode Bayar",
      "Subtotal", "Diskon", "Total Omset", "Total Modal (HPP)", "Laba Kotor",
      "Uang Diterima", "Kembalian", "Waktu Sync"
    ];
    txSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    formatHeaderRow(txSheet, headers.length, "#4f46e5");
  }

  // 2. Item_Transaksi
  var itemSheet = ss.getSheetByName("Item_Transaksi");
  if (!itemSheet) {
    itemSheet = ss.insertSheet("Item_Transaksi");
    var itemHeaders = [
      "No Faktur", "Tanggal", "ID Produk", "Nama Produk", "Kategori",
      "Satuan Jual", "Multiplier", "Jumlah (Qty)", "Harga Jual", "Harga Modal",
      "Subtotal Jual", "Total HPP", "Laba Item"
    ];
    itemSheet.getRange(1, 1, 1, itemHeaders.length).setValues([itemHeaders]);
    formatHeaderRow(itemSheet, itemHeaders.length, "#3b82f6");
  }

  // 3. Pengeluaran
  var expSheet = ss.getSheetByName("Pengeluaran");
  if (!expSheet) {
    expSheet = ss.insertSheet("Pengeluaran");
    var expHeaders = ["ID Pengeluaran", "Tanggal", "Kategori", "Jumlah Biaya (Rp)", "Keterangan", "Waktu Sync"];
    expSheet.getRange(1, 1, 1, expHeaders.length).setValues([expHeaders]);
    formatHeaderRow(expSheet, expHeaders.length, "#ef4444");
  }

  // 4. Produk_Stok
  var prodSheet = ss.getSheetByName("Produk_Stok");
  if (!prodSheet) {
    prodSheet = ss.insertSheet("Produk_Stok");
    var prodHeaders = ["ID Produk", "Nama Barang", "Kategori", "Sisa Stok", "Satuan Terkecil", "Daftar Satuan Jual & Harga"];
    prodSheet.getRange(1, 1, 1, prodHeaders.length).setValues([prodHeaders]);
    formatHeaderRow(prodSheet, prodHeaders.length, "#10b981");
  }
}

function formatHeaderRow(sheet, numCols, bgColor) {
  var headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setBackground(bgColor);
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function getColumnValues(sheet, colIndex) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var values = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  var result = [];
  for (var i = 0; i < values.length; i++) {
    result.push(values[i][0]);
  }
  return result;
}

function deleteInvoicesFromSheet(sheet, invoiceList) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    var inv = values[i][0];
    if (invoiceList.indexOf(inv) !== -1) {
      sheet.deleteRow(i + 2);
    }
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
