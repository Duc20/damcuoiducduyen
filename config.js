/**
 * ============================================
 * CẤU HÌNH THIỆP CƯỚI ONLINE
 * ============================================
 * Điền đầy đủ thông tin vào file này
 * Sau đó chạy lệnh: node update-wedding.js
 * hoặc copy thông tin vào các file tương ứng
 */

const weddingConfig = {
    // ==========================================
    // THÔNG TIN CẶP ĐÔI
    // ==========================================
    couple: {
        groom: {
            fullName: "Dương Hồng Đức",           // Tên đầy đủ chú rể
            firstName: "Hồng Đức",                 // Tên gọi ngắn
            phone: "0339230195",                 // Số điện thoại (tùy chọn)
            facebook: "",                        // Link Facebook (tùy chọn)
            instagram: "",                       // Link Instagram (tùy chọn)
        },
        bride: {
            fullName: "Nghiêm Thị Mỹ Duyên",          // Tên đầy đủ cô dâu
            firstName: "Mỹ Duyên",               // Tên gọi ngắn
            phone: "0964336786",                 // Số điện thoại (tùy chọn)
            facebook: "",                        // Link Facebook (tùy chọn)
            instagram: "",                       // Link Instagram (tùy chọn)
        }
    }, 

    // ==========================================
    // THÔNG TIN PHỤ HUYNH
    // ==========================================
    parents: {
        groom: {
            father: "Ông Dương Văn Dưỡng",           // Tên bố chú rể
            mother: "Bà Nguyễn Thị Phương Oanh",        // Tên mẹ chú rể
            address: "Thôn Nội, Văn Hoàng, Phú Xuyên, Hà Nội" // Địa chỉ nhà trai
        },
        bride: {
            father: "Ông Nghiêm Văn Hải",             // Tên bố cô dâu - THAY ĐỔI
            mother: "Bà Nguyễn Thị Hải Yến",              // Tên mẹ cô dâu - THAY ĐỔI
            address: "Thôn Nội, Văn Hoàng, Phú Xuyên, Hà Nội" // Địa chỉ nhà gái - THAY ĐỔI
        }
    },

    // ==========================================
    // THÔNG TIN NGÀY CƯỚI
    // ==========================================
    wedding: {
        date: "2026-10-15",                     // Định dạng: YYYY-MM-DD
        time: "15:00",                          // Giờ tổ chức (24h format)
        dayOfWeek: "Thứ Năm",                   // Thứ trong tuần
        lunarDate: "ngày 06 tháng 09 năm Bính Ngọ", // Âm lịch
        
        // Hiển thị đẹp
        displayDate: {
            day: "15",
            month: "10",
            year: "2026",
            monthText: "Tháng 10"
        }
    },

    // ==========================================
    // ĐỊA ĐIỂM TỔ CHỨC
    // ==========================================
    venue: {
        name: "Nhà Trai",               // Tên địa điểm
        address: "Thôn Nội, Văn Hoàng",             // Địa chỉ chi tiết - THAY ĐỔI
        district: "Phú Xuyên",                   // Quận/Huyện - THAY ĐỔI
        city: "Hà Nội",               // Thành phố
        
        // Link Google Maps
        googleMapsUrl: "https://maps.app.goo.gl/rCuYeE6Qf1R8rABE6",
        
        // Embed Google Maps (lấy từ Google Maps > Share > Embed)
        googleMapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d314.28717616055314!2d105.85054534174674!3d20.76592254882732!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135b5b63876fe3d%3A0x51501cf14c3f5bcd!2zVEjDlE4gTuG7mEksIFBodW9uZyBEdWMsIEhhIE5vaSwgVmlldG5hbQ!5e1!3m2!1sen!2s!4v1790615254362!5m2!1sen!2s"
    },

    // ==========================================
    // HÌNH ẢNH (CDN URLs hoặc Google Drive)
    // ==========================================
    images: {
        // Album ảnh cưới (6 ảnh)
        gallery: [
            "images/1(1).jpg", 
             "images/1(2).jpg",  
              "images/1(3).jpg", 
              "images/1(4).jpg", 
              "images/1(5).jpg", 
              "images/1(6).jpg", 
              "images/1(7).jpg", 
              "images/1(8).jpg", 
              "images/1(9).jpg", 
              "images/1(10).jpg", 
              "images/1(11).jpg", 
              "images/1(12).jpg", 
              "images/1(13).jpg", 
            
             ],
        
        // QR Code chuyển khoản
        qrCode: "images/qr-code.png"  // THAY ĐỔI: Link Google Drive hoặc đường dẫn local
    },

    // ==========================================
    // NHẠC NỀN
    // ==========================================
    music: {
        // TÙY CHỌN 1: File MP3 local (KHUYẾN NGHỊ - đang dùng)
        localFile: "audio/I_Do.mp3",

        // TÙY CHỌN 2: Link YouTube - KHÔNG DÙNG ĐƯỢC cho thẻ <audio>.
        // update-wedding.js ưu tiên youtubeUrl nên để trống để không ghi đè sai src.
        // Muốn dùng YouTube thì phải chuyển sang YouTube IFrame Player API.
        youtubeUrl: "",

        // TÙY CHỌN 3: Link MP3 trực tiếp (phải là URL file .mp3 thật, không phải trang watch)
        directUrl: ""
    },

    // ==========================================
    // THÔNG TIN NGÂN HÀNG (Mừng cưới)
    // ==========================================
    banking: {
        bank: {
            name: "k",                    // Tên ngân hàng
            shortName: "",                // Tên viết tắt
            logo: "🏦"                          // Icon/Emoji
        },
        account: {
            name: "",              // Tên chủ tài khoản (IN HOA)
            number: "",               // Số tài khoản
            branch: ""                          // Chi nhánh (tùy chọn)
        }
    },

    // ==========================================
    // MẠNG XÃ HỘI
    // ==========================================
    social: {
        facebook: "",      // Link Facebook của cặp đôi
        instagram: "",     // Link Instagram
        zalo: "",          // Link Zalo
        tiktok: ""         // Link TikTok (tùy chọn)
    },

    // ==========================================
    // CÀI ĐẶT KHÁC
    // ==========================================
    settings: {
        rsvpDeadline: "15/10/2026",            // Hạn xác nhận tham dự
        maxGuests: 200,                         // Số khách tối đa mỗi người mời
        showCountdown: true,                   // Hiển thị đếm ngược
        showGallery: true,                     // Hiển thị album ảnh
        showRSVP: true,                        // Hiển thị form xác nhận
        showBanking: true,                     // Hiển thị thông tin chuyển khoản
        autoPlayMusic: false,                  // Tự động phát nhạc (false = yêu cầu click)
        
        // Màu chủ đạo (tùy chỉnh trong CSS)
        theme: {
            primaryColor: "#ffffffff",           // Màu đỏ chủ đạo
            secondaryColor: "#fff5f5",         // Màu hồng nhạt
            accentColor: "#ffffffff"             // Màu đỏ đậm
        }
    },

    // ==========================================
    // METADATA (SEO)
    // ==========================================
    meta: {
        title: "Thiệp Cưới - Đức & Duyên",
        description: "Thiệp cưới online của Đức & Duyên - 15.10.2026",
        keywords: "thiệp cưới, wedding invitation, Đức, Duyên",
        author: "Happy Wedding"
    }
};

// ============================================
// XUẤT CẤU HÌNH
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = weddingConfig;
}

// ============================================
// HƯỚNG DẪN SỬ DỤNG
// ============================================
/*

📝 CÁCH SỬ DỤNG FILE CONFIG:

1. ĐIỀN THÔNG TIN:
   - Thay đổi các thông tin đánh dấu "THAY ĐỔI"
   - Điền đầy đủ thông tin cặp đôi, phụ huynh, địa điểm

2. HÌNH ẢNH:
   - Thay link trong mảng gallery[] bằng link Google Drive
   - Format Google Drive: https://drive.google.com/uc?export=view&id=FILE_ID
   - Hoặc dùng link CDN như hiện tại

3. NHẠC NỀN:
   - CÁCH 1: Upload file MP3 vào folder audio/
   - CÁCH 2: Dùng link YouTube (cần code thêm YouTube Player)
   - CÁCH 3: Dùng link MP3 trực tiếp

4. QR CODE:
   - Tạo QR code ngân hàng tại: https://qr.sepay.vn/
   - Upload lên Google Drive hoặc folder images/
   - Cập nhật link vào config.images.qrCode

5. CẬP NHẬT VÀO WEBSITE:
   - CÁCH 1 (Thủ công): Copy từng thông tin vào index.html
   - CÁCH 2 (Tự động): Chạy: node update-wedding.js
   - CÁCH 3 (Nâng cao): Dùng JavaScript đọc config động

==============================================

🔗 HƯỚNG DẪN LẤY LINK GOOGLE DRIVE:

1. Upload ảnh lên Google Drive
2. Click chuột phải > Get link > Change to "Anyone with the link"
3. Copy link, có dạng: https://drive.google.com/file/d/1ABC...XYZ/view
4. Lấy phần ID (giữa /d/ và /view)
5. Tạo link mới: https://drive.google.com/uc?export=view&id=ID_CỦA_BẠN

Ví dụ:
- Link gốc: https://drive.google.com/file/d/1A2B3C4D5/view
- Link dùng: https://drive.google.com/uc?export=view&id=1A2B3C4D5

==============================================

🎵 HƯỚNG DẪN THÊM NHẠC YOUTUBE:

1. Lấy Video ID từ YouTube
   - Link: https://www.youtube.com/watch?v=dQw4w9WgXcQ
   - Video ID: dQw4w9WgXcQ

2. Cập nhật vào config.music.youtubeUrl

3. Sửa code trong js/main.js để dùng YouTube Player API

==============================================

📞 HỖ TRỢ:
- Email: support@longthinhwedding.com
- Website: https://www.longthinhwedding.site

*/
