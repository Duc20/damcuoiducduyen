// ===================================
// LOADING SCREEN
// ===================================
window.addEventListener('load', () => {
    const loadingScreen = document.querySelector('.loading-screen');
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
    }, 1500);
});

// ===================================
// COUNTDOWN TIMER
// ===================================
function initCountdown() {
    const weddingDate = new Date('2026-10-15T15:00:00').getTime();
    const countdownElement = document.getElementById('countdown');
    
    if (!countdownElement) return;

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = weddingDate - now;

        if (distance < 0) {
            countdownElement.innerHTML = '<div class="countdown-item"><span>🎉</span><small>Đã diễn ra!</small></div>';
            clearInterval(countdownInterval);
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownElement.innerHTML = `
            <div class="countdown-item">
                <span>${days}</span>
                <small>Ngày</small>
            </div>
            <div class="countdown-item">
                <span>${hours}</span>
                <small>Giờ</small>
            </div>
            <div class="countdown-item">
                <span>${minutes}</span>
                <small>Phút</small>
            </div>
            <div class="countdown-item">
                <span>${seconds}</span>
                <small>Giây</small>
            </div>
        `;
    }

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
}

// ===================================
// MUSIC PLAYER
// ===================================
function initMusicPlayer() {
    const musicToggle = document.querySelector('.music-toggle');
    const musicPlayer = document.getElementById('music-player');
    let isPlaying = false;

    if (!musicToggle || !musicPlayer) return;

    musicToggle.addEventListener('click', () => {
        if (isPlaying) {
            musicPlayer.pause();
            musicToggle.classList.remove('playing');
            isPlaying = false;
        } else {
            musicPlayer.play().catch(err => {
                console.log('Audio playback failed:', err);
            });
            musicToggle.classList.add('playing');
            isPlaying = true;
        }
    });

    // Auto play on first user interaction
    document.addEventListener('click', function autoPlay() {
        if (!isPlaying) {
            musicPlayer.play().catch(err => {
                console.log('Auto-play prevented:', err);
            });
            musicToggle.classList.add('playing');
            isPlaying = true;
        }
        document.removeEventListener('click', autoPlay);
    }, { once: true });
}

// ===================================
// SCROLL TO TOP BUTTON
// ===================================
function initScrollTop() {
    const scrollTopBtn = document.querySelector('.scroll-top');
    
    if (!scrollTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ===================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===================================
// IMAGE LIGHTBOX
// ===================================
function initLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.querySelector('.lightbox');
    const lightboxImg = lightbox?.querySelector('img');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');
    
    if (!lightbox || !lightboxImg) return;

    let currentIndex = 0;
    const images = Array.from(galleryItems).map(item => item.querySelector('img').src);

    function showImage(index) {
        currentIndex = index;
        lightboxImg.src = images[currentIndex];
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLight() {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    function showPrev() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        lightboxImg.src = images[currentIndex];
    }

    function showNext() {
        currentIndex = (currentIndex + 1) % images.length;
        lightboxImg.src = images[currentIndex];
    }

    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => showImage(index));
    });

    lightboxClose?.addEventListener('click', closeLight);
    lightboxPrev?.addEventListener('click', showPrev);
    lightboxNext?.addEventListener('click', showNext);

    // Close lightbox on backdrop click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLight();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') closeLight();
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === 'ArrowRight') showNext();
    });
}

// ===================================
// RSVP FORM HANDLING
// ===================================
function initRSVPForm() {
    const rsvpForm = document.getElementById('rsvp-form');
    const successMessage = document.querySelector('.success-message');
    const btnSubmit = document.querySelector('.btn-submit');
    
    if (!rsvpForm) return;

    rsvpForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Show loading state
        btnSubmit.classList.add('loading');
        btnSubmit.disabled = true;

        // Collect form data
        const formData = new FormData(rsvpForm);
        const data = Object.fromEntries(formData.entries());

        // Log data to console (replace with actual API call)
        console.log('RSVP Data:', data);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Hide form and show success message
        rsvpForm.style.display = 'none';
        successMessage.classList.add('show');

        // Remove loading state
        btnSubmit.classList.remove('loading');
        btnSubmit.disabled = false;

        // Optional: Save to localStorage
        try {
            const existingRSVPs = JSON.parse(localStorage.getItem('weddingRSVPs') || '[]');
            existingRSVPs.push({
                ...data,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('weddingRSVPs', JSON.stringify(existingRSVPs));
        } catch (err) {
            console.error('Error saving RSVP:', err);
        }

        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Form validation enhancement
    const inputs = rsvpForm.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
        input.addEventListener('invalid', (e) => {
            e.preventDefault();
            input.classList.add('error');
        });

        input.addEventListener('input', () => {
            input.classList.remove('error');
        });
    });
}

// ===================================
// COPY TO CLIPBOARD
// ===================================
function initCopyToClipboard() {
    const copyButtons = document.querySelectorAll('.btn-copy');
    
    copyButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const accountNumber = this.dataset.account;
            
            if (!accountNumber) return;

            // Create temporary input to copy text
            const tempInput = document.createElement('input');
            tempInput.value = accountNumber;
            document.body.appendChild(tempInput);
            tempInput.select();
            
            try {
                document.execCommand('copy');
                
                // Show success feedback
                const originalText = this.textContent;
                this.textContent = '✓ Đã sao chép!';
                this.style.background = '#4caf50';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.background = '';
                }, 2000);
            } catch (err) {
                console.error('Copy failed:', err);
                alert('Không thể sao chép. Vui lòng chọn và copy thủ công.');
            } finally {
                document.body.removeChild(tempInput);
            }
        });
    });
}

// ===================================
// SCROLL ANIMATIONS (AOS alternative)
// ===================================
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-aos]');
    
    if (!animatedElements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const animation = element.dataset.aos;
                
                element.style.opacity = '1';
                
                switch(animation) {
                    case 'fade-up':
                        element.style.transform = 'translateY(0)';
                        break;
                    case 'fade-down':
                        element.style.transform = 'translateY(0)';
                        break;
                    case 'fade-left':
                        element.style.transform = 'translateX(0)';
                        break;
                    case 'fade-right':
                        element.style.transform = 'translateX(0)';
                        break;
                    case 'zoom-in':
                        element.style.transform = 'scale(1)';
                        break;
                }
                
                observer.unobserve(element);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(element => {
        // Set initial state
        element.style.opacity = '0';
        element.style.transition = 'all 0.8s ease';
        
        const animation = element.dataset.aos;
        switch(animation) {
            case 'fade-up':
                element.style.transform = 'translateY(50px)';
                break;
            case 'fade-down':
                element.style.transform = 'translateY(-50px)';
                break;
            case 'fade-left':
                element.style.transform = 'translateX(50px)';
                break;
            case 'fade-right':
                element.style.transform = 'translateX(-50px)';
                break;
            case 'zoom-in':
                element.style.transform = 'scale(0.8)';
                break;
        }
        
        observer.observe(element);
    });
}

// ===================================
// WISHES WALL (Load existing wishes)
// ===================================
function initWishesWall() {
    const wishesList = document.querySelector('.wishes-list');
    
    if (!wishesList) return;

    // Sample wishes data (replace with API call)
    const sampleWishes = [
        {
            name: 'Nguyễn Văn A',
            message: 'Chúc cho cô dâu chú rể trăm năm hạnh phúc, sớm có tin vui!',
            time: '2 giờ trước'
        },
        {
            name: 'Trần Thị B',
            message: 'Hạnh phúc mãi bên nhau, yêu thương nhau mỗi ngày!',
            time: '5 giờ trước'
        },
        {
            name: 'Lê Văn C',
            message: 'Chúc hai bạn luôn giữ được tình yêu như ngày đầu tiên!',
            time: '1 ngày trước'
        }
    ];

    // Load wishes from localStorage or use sample data
    let wishes = [];
    try {
        const storedWishes = localStorage.getItem('weddingWishes');
        wishes = storedWishes ? JSON.parse(storedWishes) : sampleWishes;
    } catch (err) {
        wishes = sampleWishes;
    }

    // Render wishes
    if (wishes.length > 0) {
        wishesList.innerHTML = wishes.map(wish => `
            <div class="wish-item" data-aos="fade-up">
                <div class="wish-avatar">👤</div>
                <div class="wish-content">
                    <h4>${wish.name}</h4>
                    <p>${wish.message}</p>
                    <small>${wish.time}</small>
                </div>
            </div>
        `).join('');
    }
}

// ===================================
// PARALLAX EFFECT (Optional)
// ===================================
function initParallax() {
    const hero = document.querySelector('.hero');
    
    if (!hero) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxSpeed = 0.5;
        
        if (scrolled < window.innerHeight) {
            hero.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
        }
    });
}

// ===================================
// CONFETTI EFFECT (Optional)
// ===================================
function createConfetti() {
    const colors = ['#c41e3a', '#ff69b4', '#fff', '#ffd700'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.opacity = Math.random();
        confetti.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '10000';
        
        document.body.appendChild(confetti);
        
        const fallDuration = Math.random() * 3 + 2;
        const fallDelay = Math.random() * 2;
        
        confetti.animate([
            { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
            { transform: `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
            duration: fallDuration * 1000,
            delay: fallDelay * 1000,
            easing: 'ease-in'
        }).onfinish = () => confetti.remove();
    }
}

// Trigger confetti on page load
window.addEventListener('load', () => {
    setTimeout(createConfetti, 2000);
});

// ===================================
// DEVICE DETECTION & OPTIMIZATION
// ===================================
function detectDevice() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        document.body.classList.add('mobile-device');
        
        // Disable parallax on mobile for better performance
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.backgroundAttachment = 'scroll';
        }
    }
}

// ===================================
// SHARE FUNCTIONALITY
// ===================================
function initShareButtons() {
    const shareButtons = document.querySelectorAll('.share-btn');
    
    shareButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const shareData = {
                title: 'Thiệp Cưới - Anh Tú & Diệu Nhi',
                text: 'Trân trọng kính mời bạn tham dự đám cưới của chúng tôi!',
                url: window.location.href
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    // Fallback: Copy link to clipboard
                    await navigator.clipboard.writeText(window.location.href);
                    alert('Đã sao chép link thiệp cưới!');
                }
            } catch (err) {
                console.error('Share failed:', err);
            }
        });
    });
}

// ===================================
// PERFORMANCE MONITORING
// ===================================
function monitorPerformance() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                console.log(`Page Load Time: ${pageLoadTime}ms`);
            }, 0);
        });
    }
}

// ===================================
// ERROR HANDLING
// ===================================
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    // Could send to error tracking service
});

// ===================================
// INITIALIZE ALL FUNCTIONS
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    try {
        detectDevice();
        initCountdown();
        initMusicPlayer();
        initScrollTop();
        initSmoothScroll();
        initLightbox();
        initRSVPForm();
        initCopyToClipboard();
        initScrollAnimations();
        initWishesWall();
        initParallax();
        initShareButtons();
        monitorPerformance();
        
        console.log('Wedding invitation initialized successfully! 💍');
    } catch (err) {
        console.error('Initialization error:', err);
    }
});

// ===================================
// UTILITY FUNCTIONS
// ===================================

// Format date
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    return new Date(date).toLocaleDateString('vi-VN', options);
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone (Vietnam format)
function validatePhone(phone) {
    const re = /^(0|\+84)[0-9]{9}$/;
    return re.test(phone.replace(/\s/g, ''));
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initCountdown,
        initMusicPlayer,
        initRSVPForm,
        validateEmail,
        validatePhone
    };
}
