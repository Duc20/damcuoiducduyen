/**
 * ============================================
 * GOOGLE APPS SCRIPT - BACKEND THIỆP CƯỚI
 * ============================================
 * Xử lý: Xác nhận tham dự (RSVP) + Lời chúc
 * Lưu trữ: Google Sheet
 *
 * CÁCH CÀI ĐẶT:
 * 1. Tạo 1 Google Sheet trống (Spreadsheet mới)
 * 2. Mở menu: Extensions > Apps Script
 * 3. Dán toàn bộ nội dung file này vào Code.gs
 * 4. Bấm Deploy > New deployment
 *    - Select type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy URL dạng .../exec về điền vào config.js
 *    -> backend.appsScriptUrl
 *
 * RẰNG BUỘC:
 * - Sheet sẽ TỰ TẠO 2 tab: "RSVP" và "Lời chúc"
 *   (không cần tạo sẵn)
 * ============================================
 */

var SHEET_NAME_RSVP = 'RSVP';
var SHEET_NAME_WISHES = 'Lời chúc';
var WISHES_LIMIT = 100;

/**
 * doGet - Dùng cho việc ĐỌC tường chúc (JSONP) và
 *         fallback khi trình duyệt chặn POST (ghi qua JSONP).
 */
function doGet(e) {
    var p = (e && e.parameter) ? e.parameter : {};
    var action = p.action || '';

    if (action === 'getWishes') {
        return jsonpResult_(p, listWishes());
    }
    if (action === 'rsvp') {
        return jsonpResult_(p, saveRsvp(p));
    }
    if (action === 'wish') {
        return jsonpResult_(p, saveWish(p));
    }

    return jsonpResult_(p, { success: false, message: 'Action không hợp lệ: ' + action });
}

/**
 * doPost - Dùng cho việc GHI dữ liệu (RSVP + Lời chúc).
 */
function doPost(e) {
    var p = (e && e.parameter) ? e.parameter : {};
    var action = p.action || '';

    if (action === 'rsvp') {
        return jsonResult_(saveRsvp(p));
    }
    if (action === 'wish') {
        return jsonResult_(saveWish(p));
    }

    return jsonResult_({ success: false, message: 'Action không hợp lệ: ' + action });
}

// ============================================
// XÁC NHẬN THAM DỰ
// ============================================
function saveRsvp(p) {
    try {
        var name = clean_(p.name);
        var phone = clean_(p.phone);
        var email = clean_(p.email);
        var attending = (p.attending === 'yes' || p.attending === 'true' || p.attending === '1')
            ? 'Có' : 'Không';
        var numGuests = attending === 'Có' ? (clean_(p.numGuests) || '1') : '';
        var note = clean_(p.note);

        if (!name) {
            return { success: false, message: 'Thiếu tên khách mời.' };
        }

        var sheet = getSheet_(SHEET_NAME_RSVP);
        ensureHeader_(sheet, ['Thời gian', 'Họ và tên', 'SĐT', 'Email', 'Tham dự', 'Số lượng khách', 'Ghi chú']);
        sheet.appendRow([new Date(), name, phone, email, attending, numGuests, note]);

        return { success: true, message: 'Đã ghi nhận xác nhận của: ' + name };
    } catch (err) {
        return { success: false, message: 'Lỗi: ' + err.message };
    }
}

// ============================================
// LỜI CHÚC
// ============================================
function saveWish(p) {
    try {
        var name = clean_(p.name);
        var message = clean_(p.wish || p.message);

        if (!name || !message) {
            return { success: false, message: 'Thiếu tên hoặc lời chúc.' };
        }
        if (message.length > 1000) {
            message = message.substring(0, 1000);
        }
        if (name.length > 100) {
            name = name.substring(0, 100);
        }

        var sheet = getSheet_(SHEET_NAME_WISHES);
        ensureHeader_(sheet, ['Thời gian', 'Tên người chúc', 'Lời chúc']);
        sheet.appendRow([new Date(), name, message]);

        return { success: true, message: 'Đã nhận lời chúc của: ' + name };
    } catch (err) {
        return { success: false, message: 'Lỗi: ' + err.message };
    }
}

// ============================================
// ĐỌC DANH SÁCH LỜI CHÚC (lời chúc mới nhất trước)
// ============================================
function listWishes() {
    try {
        var sheet = getSheet_(SHEET_NAME_WISHES);
        if (sheet.getLastRow() < 2) {
            return [];
        }

        var rows = sheet.getDataRange().getValues();
        var wishes = [];
        for (var i = 1; i < rows.length; i++) {
            var timeVal = rows[i][0];
            var name = String(rows[i][1] || '').trim();
            var message = String(rows[i][2] || '').trim();

            if (!name && !message) {
                continue;
            }

            var timeText = (timeVal instanceof Date)
                ? timeVal.toLocaleString('vi-VN')
                : String(timeVal || '');

            wishes.push({
                name: name,
                message: message,
                time: timeText
            });
        }

        wishes.reverse(); // mới nhất lên đầu
        return wishes.slice(0, WISHES_LIMIT);
    } catch (err) {
        return [];
    }
}

// ============================================
// HÀM HỖ TRỢ
// ============================================
function getSheet_(name) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
        sheet = ss.insertSheet(name);
    }
    return sheet;
}

function ensureHeader_(sheet, headers) {
    if (sheet.getLastRow() === 0) {
        sheet.appendRow(headers);
    }
}

function clean_(s) {
    return s ? String(s).trim() : '';
}

// Trả về JSON thuần (dùng cho doPost qua fetch)
function jsonResult_(obj) {
    return ContentService
        .createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}

// Trả về JSONP (dùng cho doGet đọc qua thẻ <script> - không bị chặn CORS)
function jsonpResult_(params, obj) {
    var callback = String((params && params.callback) || 'callback');
    callback = callback.replace(/[^A-Za-z0-9_$]/g, '');

    var body = '/**/typeof ' + callback + " === 'function' && " + callback + '(' + JSON.stringify(obj) + ');';

    return ContentService
        .createTextOutput(body)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
}