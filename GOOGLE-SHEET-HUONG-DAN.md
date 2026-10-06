# 🔒 Hướng dẫn kết nối Google Sheet (RSVP + Lời chúc)

Website thiệp cưới là **static** (host GitHub Pages/Netlify), không có server riêng.
Để lưu **Xác nhận tham dự** và **Lời chúc**, ta dùng **Google Apps Script + Google Sheet** (miễn phí, không cần trả phí).

Code đã sẵn trong thư mục: `google-apps-script/Code.gs`

---

## 1. Tạo Google Sheet

1. Vào [sheets.new](https://sheets.new) tạo 1 **Google Sheet trống** mới.
2. Đổi tên sheet nếu muốn (vd: `Thiệp cưới Đức Duyên`).
   - **Không cần tạo tab sẵn** — script sẽ tự tạo 2 tab: `RSVP` và `Lời chúc`.

## 2. Mở trình soạn thảo Apps Script

Trong Google Sheet: chọn menu **Extensions** → **Apps Script**.

## 3. Dán code

1. Xoá code mặc định trong `Code.gs`.
2. Mở file `google-apps-script/Code.gs` trong repo, copy toàn bộ và dán vào.
3. Bấm **Save** (Ctrl + S).

## 4. Deploy Web App

1. Bấm **Deploy** → **New deployment**.
2. Chọn type: **Web app**.
3. Điền:
   - **Description**: `RSVP + Wishes backend`
   - **Execute as**: `Me` (chính là account bạn)
   - **Who has access**: `Anyone` ⚠️ bắt buộc để khách gửi được
4. Bấm **Deploy** → xác nhận quyền với tài khoản Google.
5. Copy **Web app URL** — có dạng: `https://script.google.com/macros/s/ABCDEFG/exec`

## 5. Dán URL vào cấu hình

Mở `config.js` trong repo, sửa:

```js
backend: {
    appsScriptUrl: "https://script.google.com/macros/s/ABCDEFG/exec", // ← thay bằng URL vừa copy
    maxWishesLoaded: 100,
    pollIntervalMs: 30000
}
```

> URL phải kết thúc bằng `/exec` (không phải `/dev`).

## 6. Kiểm thử

1. Mở trang thiệp cưới, điền form **Xác nhận tham dự** → gửi.
2. Mở Google Sheet → tab **RSVP** → phải có 1 dòng dữ liệu.
3. Gửi 1 **Lời chúc** → lời chúc bay ngang màn hình → tab **Lời chúc** có dòng dữ liệu.
4. Reload lại trang thiệp cưới → lời chúc hiển thị ở **tường chúc** (cập nhật mỗi 30 giây).

## Lưu ý

- Mỗi lần **sửa code** trong Apps Script phải **Deploy lại** (Deploy → Manage deployments → Edit → New version) thì thay đổi mới có hiệu lực.
- Nếu gửi mà không vào Sheet: kiểm tra deploy đã chọn **Anyone**, và URL có `/exec`.
- Dữ liệu chưa vào Sheet là **tạm lưu localStorage trên máy khách** để demo; khi có URL thật thì gửi thẳng vào Google Sheet.
- Muốn xuất Excel: mở Google Sheet → **File → Download → Microsoft Excel (.xlsx)**.