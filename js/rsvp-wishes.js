/**
 * ============================================
 * RSVP & LỜI CHÚC - GỬI VỀ GOOGLE SHEET
 * ============================================
 * - Form xác nhận tham dự / từ chối -> Google Sheet (RSVP)
 * - Form lời chúc -> Google Sheet (Lời chúc)
 * - Lời chúc vừa gửi BAY NGANG màn hình + xuất hiện trên tường chúc
 *
 * Backend: Google Apps Script (xem google-apps-script/Code.gs
 *          và GOOGLE-SHEET-HUONG-DAN.md)
 * URL web app lấy từ: config.js -> backend.appsScriptUrl
 * ============================================
 */

(function () {
    'use strict';

    // ============================================
    // CẤU HÌNH
    // ============================================
    var BACKEND = (typeof weddingConfig !== 'undefined' && weddingConfig && weddingConfig.backend)
        ? weddingConfig.backend
        : null;

    var APPS_SCRIPT_URL = BACKEND ? (BACKEND.appsScriptUrl || '') : '';
    var WISHES_LIMIT = BACKEND && BACKEND.maxWishesLoaded ? BACKEND.maxWishesLoaded : 100;
    var POLL_MS = BACKEND && BACKEND.pollIntervalMs ? BACKEND.pollIntervalMs : 30000;

    // Chưa thay URL thật (đang là placeholder) → chạy chế độ demo bằng localStorage
    function hasBackend() {
        if (!APPS_SCRIPT_URL) return false;
        if (/XXXXXX|PLACEHOLDER|CHUA_DIEN|CHƯA_ĐIỀN/i.test(APPS_SCRIPT_URL)) return false;
        return true;
    }

    var WISHES_CACHE_KEY = 'weddingWishesCache_v2';
    var RSVP_CACHE_KEY = 'weddingRSVPsCache_v2';

    // Tôn trọng cài đặt giảm chuyển động của người dùng
    var ENABLE_FLY = !window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ============================================
    // HÀM HỖ TRỢ
    // ============================================
    function val(id) {
        var el = document.getElementById(id);
        if (!el || el.value == null) return '';
        return String(el.value).trim();
    }

    function escapeText(str) {
        return String(str == null ? '' : str);
    }

    function readLocal(key) {
        try {
            var raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            return null;
        }
    }

    function writeLocal(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (err) {
            // localStorage đầy/bị chặn -> bỏ qua, không ảnh hưởng chức năng
        }
    }

    function onReady(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    function setBtnLoading(btn, loading) {
        if (!btn) return;
        btn.classList.toggle('loading', loading);
        btn.disabled = loading;
    }

    // ============================================
    // GỬI DỮ LIỆU LÊN GOOGLE APPS SCRIPT
    // ============================================
    // Ghi: fetch POST (mode no-cors - ghi được 100% kể cả khi bị chặn CORS)
    // Nếu thất bại: fallback ghi qua JSONP GET
    // Nếu chưa có URL (chưa deploy): lưu tạm localStorage để demo, vẫn báo thành công
    function sendForm(data, done) {
        // Chưa deploy backend -> demo bằng localStorage
        if (!hasBackend()) {
            saveLocalDemo(data);
            done(true);
            return;
        }

        var body = Object.keys(data).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(data[key] == null ? '' : data[key]);
        }).join('&');

        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body
        })
            .then(function () { done(true); })
            .catch(function () { jsonpWrite(data, done); });
    }

    function jsonpWrite(data, done) {
        var cbName = '__weddingWriteCb_' + Date.now();
        var params = [];
        Object.keys(data).forEach(function (key) {
            params.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key] == null ? '' : data[key]));
        });
        params.push('callback=' + cbName);

        var sep = APPS_SCRIPT_URL.indexOf('?') === -1 ? '?' : '&';
        var script = document.createElement('script');

        window[cbName] = function (res) {
            try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
            script.remove();
            done(!!(res && res.success));
        };

        script.src = APPS_SCRIPT_URL + sep + params.join('&');
        script.onerror = function () {
            try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
            script.remove();
            done(false);
        };
        document.body.appendChild(script);
    }

    // Lưu tạm khi chưa có backend (demo / xem trước)
    function saveLocalDemo(data) {
        if (data.action === 'rsvp') {
            var rsvps = readLocal(RSVP_CACHE_KEY) || [];
            rsvps.push({
                name: data.name,
                phone: data.phone || '',
                email: data.email || '',
                attending: data.attending,
                numGuests: data.numGuests || '',
                note: data.note || '',
                time: new Date().toLocaleString('vi-VN')
            });
            writeLocal(RSVP_CACHE_KEY, rsvps);
        } else if (data.action === 'wish') {
            var wishes = readLocal(WISHES_CACHE_KEY) || [];
            wishes.unshift({
                name: data.name,
                message: data.wish,
                time: 'Vừa gửi'
            });
            writeLocal(WISHES_CACHE_KEY, wishes.slice(0, WISHES_LIMIT));
        }
    }

    // ============================================
    // FORM XÁC NHẬN THAM DỰ (RSVP)
    // ============================================
    function initRSVP() {
        var form = document.getElementById('rsvpForm');
        if (!form) return;

        var guestsGroup = document.getElementById('guestCountGroup');
        var radios = form.querySelectorAll('input[name="attending"]');

        // Hiện/ẩn ô số lượng khách khi chọn "Tham dự"
        function updateGuestsVisibility() {
            var isAttending = false;
            radios.forEach(function (radio) {
                if (radio.checked && radio.value === 'yes') isAttending = true;
            });
            if (guestsGroup) guestsGroup.style.display = isAttending ? 'block' : 'none';
        }
        radios.forEach(function (radio) {
            radio.addEventListener('change', updateGuestsVisibility);
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var name = val('rsvpName');
            var attending = '';
            radios.forEach(function (radio) {
                if (radio.checked) attending = radio.value;
            });

            if (!name) {
                alert('Vui lòng nhập họ và tên của bạn.');
                form.querySelector('#rsvpName').focus();
                return;
            }
            if (!attending) {
                alert('Vui lòng chọn "Tham dự" hoặc "Không tham dự".');
                return;
            }

            var btn = form.querySelector('.btn-submit');
            setBtnLoading(btn, true);

            var data = {
                action: 'rsvp',
                name: name,
                phone: val('rsvpPhone'),
                email: val('rsvpEmail'),
                attending: attending,
                numGuests: attending === 'yes' ? (val('rsvpGuests') || '1') : '',
                note: val('rsvpNote')
            };

            sendForm(data, function (ok) {
                setBtnLoading(btn, false);
                if (!ok) {
                    alert('Gửi xác nhận không thành công. Vui lòng thử lại sau.');
                    return;
                }

                form.style.display = 'none';
                var success = document.getElementById('rsvpSuccess');
                if (success) success.classList.add('show');
            });
        });
    }

    // ============================================
    // TƯỜNG CHÚC
    // ============================================
    var wishes = [];

    function loadWishesCache() {
        return readLocal(WISHES_CACHE_KEY) || [];
    }

    function createWishItem(wish, isNew) {
        var item = document.createElement('div');
        item.className = 'wish-item' + (isNew ? ' is-new' : '');

        var avatar = document.createElement('div');
        avatar.className = 'wish-avatar';
        avatar.textContent = '💬';

        var content = document.createElement('div');
        content.className = 'wish-content';

        var h4 = document.createElement('h4');
        h4.textContent = escapeText(wish.name);

        var p = document.createElement('p');
        p.textContent = escapeText(wish.message);

        var small = document.createElement('small');
        small.textContent = escapeText(wish.time);

        content.appendChild(h4);
        content.appendChild(p);
        content.appendChild(small);

        item.appendChild(avatar);
        item.appendChild(content);
        return item;
    }

    function renderWishes() {
        var list = document.getElementById('wishesList');
        var empty = document.getElementById('wishesEmpty');
        if (!list) return;

        list.innerHTML = '';

        if (!wishes.length) {
            if (empty) empty.style.display = 'block';
            return;
        }

        if (empty) empty.style.display = 'none';

        // Chỉ hiện tối đa WISHES_LIMIT
        var shown = wishes.slice(0, WISHES_LIMIT);
        shown.forEach(function (wish) {
            list.appendChild(createWishItem(wish, false));
        });
    }

    // Đọc lời chúc từ Google Sheet qua JSONP (không bị chặn CORS)
    function loadWishesFromServer(done) {
        if (!hasBackend()) {
            done(null);
            return;
        }

        var cbName = '__weddingWishesCb_' + Date.now();
        var sep = APPS_SCRIPT_URL.indexOf('?') === -1 ? '?' : '&';
        var script = document.createElement('script');

        window[cbName] = function (data) {
            try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
            script.remove();
            done(Array.isArray(data) ? data : null);
        };

        script.src = APPS_SCRIPT_URL + sep + 'action=getWishes&callback=' + cbName;
        script.onerror = function () {
            try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
            script.remove();
            done(null);
        };
        document.body.appendChild(script);
    }

    function mergeServerWishes(serverWishes) {
        // Lời chúc từ server (xu hướng đầy đủ nhất) + cache local (đã gửi trên máy này)
        var local = loadWishesCache();
        var seen = {};
        var merged = [];

        function pushUnique(wish) {
            var key = (wish.name || '') + '|' + (wish.message || '');
            if (!seen[key]) {
                seen[key] = true;
                merged.push(wish);
            }
        }

        (serverWishes || []).forEach(pushUnique);
        local.forEach(pushUnique);

        wishes = merged.slice(0, WISHES_LIMIT);
        writeLocal(WISHES_CACHE_KEY, wishes);
        renderWishes();
    }

    // ============================================
    // HIỆU ỨNG LỜI CHÚC BAY NGANG MÀN HÌNH
    // ============================================
    function flyWish(wish) {
        if (!ENABLE_FLY) return;

        var layer = document.getElementById('flyingLayer');
        if (!layer) return;

        var el = document.createElement('div');
        el.className = 'flying-wish';

        var nameEl = document.createElement('span');
        nameEl.className = 'flying-wish-name';
        nameEl.textContent = escapeText(wish.name);

        var msgEl = document.createElement('span');
        msgEl.className = 'flying-wish-message';
        msgEl.textContent = escapeText(wish.message);

        el.appendChild(nameEl);
        el.appendChild(msgEl);

        // Chọn 1 trong 5 "lane" chiều cao để tránh trùng nhau
        var lanes = [12, 26, 40, 54, 68];
        var lane = lanes[Math.floor(Math.random() * lanes.length)];
        var duration = 6000 + Math.random() * 4000; // 6 - 10 giây
        var startX = Math.round(-(30 + Math.random() * 15)); // -30vw ~ -45vw

        el.style.top = lane + '%';
        layer.appendChild(el);

        el.animate([
            { transform: 'translateX(' + startX + 'vw) rotate(-8deg)', opacity: 0 },
            { transform: 'translateX(' + startX + 'vw) rotate(-4deg)', opacity: 0, offset: 0.02 },
            { transform: 'translateX(5vw) rotate(-2deg)', opacity: 1, offset: 0.15 },
            { transform: 'translateX(60vw) rotate(3deg)', opacity: 1, offset: 0.72 },
            { transform: 'translateX(135vw) rotate(8deg)', opacity: 0, offset: 1 }
        ], {
            duration: duration,
            easing: 'linear'
        }).onfinish = function () {
            el.remove();
        };
    }

    // ============================================
    // FORM LỜI CHÚC
    // ============================================
    function initWishesForm() {
        var form = document.getElementById('wishForm');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var name = val('wishName');
            var message = val('wishMessage');

            if (!name) {
                alert('Vui lòng nhập tên của bạn.');
                document.getElementById('wishName').focus();
                return;
            }
            if (!message) {
                alert('Vui lòng nhập lời chúc.');
                document.getElementById('wishMessage').focus();
                return;
            }

            var btn = document.getElementById('wishSubmitBtn');
            setBtnLoading(btn, true);

            var data = {
                action: 'wish',
                name: name,
                wish: message
            };

            sendForm(data, function (ok) {
                setBtnLoading(btn, false);
                if (!ok) {
                    alert('Gửi lời chúc không thành công. Vui lòng thử lại sau.');
                    return;
                }

                // Hiện ngay lập tức (optimistic) + bay ngang màn hình
                var newWish = { name: name, message: message, time: 'Vừa gửi' };
                wishes.unshift(newWish);
                wishes = wishes.slice(0, WISHES_LIMIT);
                writeLocal(WISHES_CACHE_KEY, wishes);

                var list = document.getElementById('wishesList');
                var empty = document.getElementById('wishesEmpty');
                if (list) {
                    if (empty) empty.style.display = 'none';
                    var firstItem = list.firstChild;
                    list.insertBefore(createWishItem(newWish, true), firstItem);
                }

                flyWish(newWish);
                form.reset();
            });
        });
    }

    // ============================================
    // KHỞI CHẠY
    // ============================================
    onReady(function () {
        initRSVP();
        initWishesForm();

        // Nạp lời chúc: cache local trước (nhanh), rồi cập nhật từ server
        var cached = loadWishesCache();
        if (cached.length) {
            wishes = cached.slice(0, WISHES_LIMIT);
            renderWishes();
        }

        loadWishesFromServer(function (serverWishes) {
            if (serverWishes) {
                mergeServerWishes(serverWishes);
            } else if (!cached.length) {
                renderWishes();
            }

            // Làm mới định kỳ để lời chúc của khách khác xuất hiện
            setInterval(function () {
                loadWishesFromServer(function (data) {
                    if (data) mergeServerWishes(data);
                });
            }, POLL_MS);
        });
    });
})();