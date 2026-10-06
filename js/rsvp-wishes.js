/**
 * ============================================
 * RSVP & LỜI CHÚC - GỬI VỀ GOOGLE SHEET
 * ============================================
 * - Form xác nhận tham dự / từ chối -> Google Sheet (RSVP)
 * - Form lời chúc -> Google Sheet (Lời chúc)
 * - Lời chúc vừa gửi + toàn bộ lời chúc BAY NGANG màn hình
 *   (đường bay ngẫu nhiên, kích hoạt 1 lần khi lướt tới khu vực lời chúc)
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
        maybeRunPendingFlyShow();
    }

    // ============================================
    // HIỆU ỨNG LỜI CHÚC BAY NGANG MÀN HÌNH
    // ============================================
    // Vùng bay theo chiều cao (% viewport) - phù hợp màn hình dọc điện thoại,
    // chừa thanh trạng thái/notch phía trên & thanh điều hướng phía dưới
    var FLY_BAND_TOP = 15;
    var FLY_BAND_BOTTOM = 75;
    // Khoảng nghỉ ngẫu nhiên giữa 2 lời chúc (ms): 3 - 6 giây
    // (đổi từ 1.5-3s theo tỉ lệ tốc độ bay, giữ nhịp như ban đầu)
    var FLY_GAP_MIN = 2000;
    var FLY_GAP_RANGE = 2000;

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    // Số ngẫu nhiên trong khoảng, làm tròn 1 chữ số thập phân
    function rand1(min, max) {
        return Math.round(rand(min, max) * 10) / 10;
    }

    function clampNum(v, min, max) {
        return v < min ? min : (v > max ? max : v);
    }

    // Đường bay ngẫu nhiên: Y lượn qua các mốc ngẫu nhiên (không thẳng hàng),
    // góc nghiêng & quãng đường X đầu vào cũng ngẫu nhiên cho từng lời chúc
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

        // Toạ độ Y xuất phát ngẫu nhiên trong vùng bay
        var y0 = rand(FLY_BAND_TOP, FLY_BAND_BOTTOM);

        // 3 mốc Y tiếp theo (tương đối, đơn vị vh) - ngẫu nhiên, luôn nằm trong band
        function relDelta(absY) {
            return Math.round((absY - y0) * 10) / 10;
        }
        var y1 = relDelta(clampNum(rand(y0 - 14, y0 + 14), FLY_BAND_TOP, FLY_BAND_BOTTOM));
        var y2 = relDelta(clampNum(rand(y0 - 12, y0 + 12), FLY_BAND_TOP, FLY_BAND_BOTTOM));
        var y3 = relDelta(clampNum(rand(y0 - 10, y0 + 10), FLY_BAND_TOP, FLY_BAND_BOTTOM));

        // Góc nghiêng ngẫu nhiên cho từng lời chúc
        var r0 = rand1(-10, 10);
        var r1 = rand1(-8, 8);
        var r2 = rand1(-8, 8);
        var r3 = rand1(-10, 10);

        var startX = Math.round(-rand(30, 55)); // -30vw ~ -55vw
        var duration = Math.round(rand(12000, 20000)); // 12 - 20 giây (tốc độ bay chậm bằng 1/2)

        el.style.top = y0 + '%';
        // Trạng thái ban đầu ngoài màn hình, tránh "nhảy" 1 frame trước khi animate
        el.style.transform = 'translate(' + startX + 'vw, 0vh) rotate(' + r0 + 'deg)';
        el.style.opacity = '0';
        layer.appendChild(el);

        el.animate([
            { transform: 'translate(' + startX + 'vw, 0vh) rotate(' + r0 + 'deg)', opacity: 0 },
            { transform: 'translate(' + Math.round(startX * 0.5) + 'vw, ' + y1 + 'vh) rotate(' + r1 + 'deg)', opacity: 1, offset: 0.14 },
            { transform: 'translate(45vw, ' + y2 + 'vh) rotate(' + r2 + 'deg)', opacity: 1, offset: 0.55 },
            { transform: 'translate(140vw, ' + y3 + 'vh) rotate(' + r3 + 'deg)', opacity: 0, offset: 1 }
        ], {
            duration: duration,
            easing: 'linear'
        }).onfinish = function () {
            el.remove();
        };
    }

    // Bay lần lượt TẤT CẢ lời chúc, cách nhau khoảng nghỉ ngẫu nhiên (3 - 6 giây)
    // (nhịp không đều, lời chúc sau có thể bay khi lời trước đang bay dở)
    function flyAllWishes(list) {
        if (!ENABLE_FLY || !list || !list.length) return;

        var i = 0;
        function next() {
            if (i >= list.length) return;
            flyWish(list[i]);
            i++;
            setTimeout(next, Math.round(rand(FLY_GAP_MIN, FLY_GAP_MIN + FLY_GAP_RANGE)));
        }
        next();
    }

    // ============================================
    // KÍCH HOẠT 1 LẦN KHI LƯỚT TỚI KHU VỰC LỜI CHÚC
    // ============================================
    var flyShowTriggered = false;
    var flyShowPending = false;

    function triggerFlyShow() {
        if (flyShowTriggered) return;
        flyShowTriggered = true;
        if (flyShowObserver) {
            flyShowObserver.disconnect();
            flyShowObserver = null;
        }

        if (wishes.length) {
            flyAllWishes(wishes.slice());
        } else {
            // Chưa tải xong dữ liệu -> bay ngay sau lần nạp đầu tiên
            flyShowPending = true;
        }
    }

    var flyShowObserver = null;

    // Nếu người dùng đã lướt tới khu vực lời chúc khi dữ liệu còn rỗng ->
    // chạy show ngay khi có lời chúc đầu tiên
    function maybeRunPendingFlyShow() {
        if (flyShowPending && wishes.length) {
            flyShowPending = false;
            flyAllWishes(wishes.slice());
        }
    }

    function initFlyShowTrigger() {
        if (!ENABLE_FLY || !('IntersectionObserver' in window)) return;

        var target = document.querySelector('.wishes-wall');
        if (!target) return;

        flyShowObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    triggerFlyShow();
                }
            });
        }, { threshold: 0.15 });

        flyShowObserver.observe(target);
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
        initFlyShowTrigger();

        // Nạp lời chúc: cache local trước (nhanh), rồi cập nhật từ server
        var cached = loadWishesCache();
        if (cached.length) {
            wishes = cached.slice(0, WISHES_LIMIT);
            renderWishes();
            maybeRunPendingFlyShow();
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