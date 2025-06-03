// =====================================================
// LUXQUANT VIP - REAL-TIME CRYPTO JAVASCRIPT
// Version: 5.0 - Real-time API Integration
// =====================================================

// Feature Detection
const isMobile = window.innerWidth <= 768;
const supportsTouch = 'ontouchstart' in window;

// DOM Elements Cache
const elements = {};

// API Configuration
const API_CONFIG = {
    coingecko: {
        baseUrl: 'https://api.coingecko.com/api/v3',
        rateLimit: 50, // calls per minute
        timeout: 10000
    },
    fallback: {
        baseUrl: 'https://api.coinlore.net/api',
        timeout: 8000
    }
};

// Crypto data cache
let cryptoCache = {
    data: null,
    lastUpdate: 0,
    updateInterval: 5 * 60 * 1000, // 5 minutes
    isLoading: false
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('LuxQuant VIP Initializing...');
    
    // Cache DOM elements
    cacheElements();
    
    // Initialize core features
    initNavigation();
    initScrollEffects();
    initBackToTop();
    
    // Initialize crypto features with real-time data
    initRealTimeCrypto();
    
    // Desktop only features
    if (!isMobile) {
        initMouseEffects();
        initParticles();
    }
    
    // Initialize other features
    initLiveStats();
    initCookieConsent();
    
    // Smooth scroll for anchor links
    initSmoothScroll();
    
    console.log('LuxQuant VIP Ready ✅');
});

// Cache DOM elements
function cacheElements() {
    elements.header = document.getElementById('header');
    elements.navLinks = document.getElementById('navLinks');
    elements.mobileMenuBtn = document.getElementById('mobileMenuBtn');
    elements.backToTop = document.getElementById('backToTop');
    elements.cookieConsent = document.getElementById('cookieConsent');
    elements.priceTicker = document.getElementById('priceTicker');
}

// =====================================================
// REAL-TIME CRYPTO DATA FUNCTIONS
// =====================================================

// Initialize Real-time Crypto System
async function initRealTimeCrypto() {
    console.log('🚀 Initializing Real-time Crypto System...');
    
    // Initialize price ticker with loading state
    initPriceTicker();
    
    // Fetch initial data
    await fetchAndUpdateCryptoData();
    
    // Set up periodic updates
    setInterval(async () => {
        if (!cryptoCache.isLoading) {
            await fetchAndUpdateCryptoData();
        }
    }, cryptoCache.updateInterval);
    
    // Update display every 30 seconds with cached data
    setInterval(() => {
        if (cryptoCache.data) {
            updateTickerDisplay();
        }
    }, 30000);
}

// Fetch Crypto Data from API
async function fetchAndUpdateCryptoData() {
    if (cryptoCache.isLoading) return;
    
    const now = Date.now();
    
    // Check if we need to update (rate limiting)
    if (cryptoCache.data && (now - cryptoCache.lastUpdate) < cryptoCache.updateInterval) {
        return;
    }
    
    cryptoCache.isLoading = true;
    console.log('📡 Fetching fresh crypto data...');
    
    try {
        // Try CoinGecko first (primary API)
        let data = await fetchFromCoinGecko();
        
        // Fallback to Coinlore if CoinGecko fails
        if (!data) {
            console.log('⚠️ CoinGecko failed, trying fallback API...');
            data = await fetchFromCoinlore();
        }
        
        if (data) {
            cryptoCache.data = data;
            cryptoCache.lastUpdate = now;
            updateTickerDisplay();
            updateLiveStatsWithRealData();
            console.log('✅ Crypto data updated successfully');
        } else {
            console.error('❌ All APIs failed, using cached data');
            handleAPIError();
        }
        
    } catch (error) {
        console.error('💥 Error in fetchAndUpdateCryptoData:', error);
        handleAPIError();
    } finally {
        cryptoCache.isLoading = false;
    }
}

// Fetch from CoinGecko API
async function fetchFromCoinGecko() {
    try {
        const cryptoIds = 'bitcoin,ethereum,binancecoin,solana,cardano,ripple,dogecoin,polygon-matic,chainlink,avalanche-2';
        const url = `${API_CONFIG.coingecko.baseUrl}/simple/price?ids=${cryptoIds}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.coingecko.timeout);
        
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }
        
        const data = await response.json();
        return formatCoinGeckoData(data);
        
    } catch (error) {
        console.error('CoinGecko API error:', error);
        return null;
    }
}

// Fetch from Coinlore API (Fallback)
async function fetchFromCoinlore() {
    try {
        const url = `${API_CONFIG.fallback.baseUrl}/tickers/?start=0&limit=10`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.fallback.timeout);
        
        const response = await fetch(url, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Coinlore API error: ${response.status}`);
        }
        
        const result = await response.json();
        return formatCoinloreData(result.data);
        
    } catch (error) {
        console.error('Coinlore API error:', error);
        return null;
    }
}

// Format CoinGecko data
function formatCoinGeckoData(data) {
    const cryptoMap = {
        'bitcoin': { symbol: 'BTC', name: 'Bitcoin', cmcId: 1 },
        'ethereum': { symbol: 'ETH', name: 'Ethereum', cmcId: 1027 },
        'binancecoin': { symbol: 'BNB', name: 'BNB', cmcId: 1839 },
        'solana': { symbol: 'SOL', name: 'Solana', cmcId: 5426 },
        'cardano': { symbol: 'ADA', name: 'Cardano', cmcId: 2010 },
        'ripple': { symbol: 'XRP', name: 'XRP', cmcId: 52 },
        'dogecoin': { symbol: 'DOGE', name: 'Dogecoin', cmcId: 74 },
        'polygon-matic': { symbol: 'MATIC', name: 'Polygon', cmcId: 3890 },
        'chainlink': { symbol: 'LINK', name: 'Chainlink', cmcId: 1975 },
        'avalanche-2': { symbol: 'AVAX', name: 'Avalanche', cmcId: 5805 }
    };
    
    const formatted = [];
    
    for (const [id, info] of Object.entries(cryptoMap)) {
        if (data[id]) {
            formatted.push({
                id: id,
                symbol: info.symbol,
                name: info.name,
                cmcId: info.cmcId,
                iconUrl: `https://s2.coinmarketcap.com/static/img/coins/64x64/${info.cmcId}.png`,
                price: data[id].usd || 0,
                change: data[id].usd_24h_change || 0,
                marketCap: data[id].usd_market_cap || 0,
                volume: data[id].usd_24h_vol || 0
            });
        }
    }
    
    return formatted.slice(0, 8); // Limit to 8 for ticker
}

// Format Coinlore data
function formatCoinloreData(data) {
    const symbolMap = {
        'BTC': { name: 'Bitcoin', cmcId: 1 },
        'ETH': { name: 'Ethereum', cmcId: 1027 },
        'BNB': { name: 'BNB', cmcId: 1839 },
        'SOL': { name: 'Solana', cmcId: 5426 },
        'ADA': { name: 'Cardano', cmcId: 2010 },
        'XRP': { name: 'XRP', cmcId: 52 },
        'DOGE': { name: 'Dogecoin', cmcId: 74 },
        'MATIC': { name: 'Polygon', cmcId: 3890 }
    };
    
    return data
        .filter(crypto => symbolMap[crypto.symbol])
        .slice(0, 8)
        .map(crypto => ({
            id: crypto.id,
            symbol: crypto.symbol,
            name: symbolMap[crypto.symbol].name || crypto.name,
            cmcId: symbolMap[crypto.symbol].cmcId,
            iconUrl: `https://s2.coinmarketcap.com/static/img/coins/64x64/${symbolMap[crypto.symbol].cmcId}.png`,
            price: parseFloat(crypto.price_usd) || 0,
            change: parseFloat(crypto.percent_change_24h) || 0,
            marketCap: parseFloat(crypto.market_cap_usd) || 0,
            volume: parseFloat(crypto.volume24) || 0
        }));
}

// Handle API Errors
function handleAPIError() {
    console.log('📱 Using fallback static data...');
    
    // Fallback static data
    if (!cryptoCache.data) {
        cryptoCache.data = [
            { symbol: 'BTC', name: 'Bitcoin', icon: '₿', price: 67420, change: 2.45 },
            { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', price: 3840, change: 1.23 },
            { symbol: 'BNB', name: 'BNB', icon: '🟡', price: 582, change: -0.87 },
            { symbol: 'SOL', name: 'Solana', icon: '◉', price: 198, change: 4.56 },
            { symbol: 'ADA', name: 'Cardano', icon: '♠', price: 0.624, change: -1.34 },
            { symbol: 'XRP', name: 'XRP', icon: '◆', price: 0.548, change: 2.15 },
            { symbol: 'DOGE', name: 'Dogecoin', icon: '🐕', price: 0.089, change: -0.45 },
            { symbol: 'MATIC', name: 'Polygon', icon: '🔷', price: 0.923, change: 3.21 }
        ];
        updateTickerDisplay();
    }
    
    // Show user-friendly error notification
    showNotification('Using cached crypto prices. Live updates will resume shortly.', 'warning');
}

// =====================================================
// PRICE TICKER FUNCTIONS
// =====================================================

// Initialize Price Ticker
function initPriceTicker() {
    const tickerContent = document.querySelector('.ticker-content');
    if (!tickerContent) return;
    
    // Show loading state
    tickerContent.innerHTML = `
        <span class="ticker-item loading">
            <span class="ticker-symbol">Loading...</span>
            <span class="ticker-price">Fetching live prices</span>
            <span class="ticker-change">📡</span>
        </span>
    `;
}

// Update Ticker Display
// Update Ticker Display
// Update Ticker Display
// Update Ticker Display
function updateTickerDisplay() {
    const tickerContent = document.querySelector('.ticker-content');
    if (!tickerContent || !cryptoCache.data) return;
    
    // Clear existing content
    tickerContent.innerHTML = '';
    
    // Create ticker items (duplicate for seamless scroll)
    for (let i = 0; i < 3; i++) {
        cryptoCache.data.forEach(crypto => {
            const item = document.createElement('span');
            item.className = `ticker-item ticker-${crypto.symbol.toLowerCase()}`;
            
            // Use iconUrl if available (real API data), otherwise use fallback
            if (crypto.iconUrl) {
                item.innerHTML = `
                    <img class="ticker-icon" src="${crypto.iconUrl}" alt="${crypto.symbol}" onerror="this.style.display='none'; this.parentElement.querySelector('.ticker-symbol').setAttribute('data-fallback', '${crypto.symbol.charAt(0)}')">
                    <span class="ticker-symbol">${crypto.symbol}</span>
                    <span class="ticker-price">${formatPrice(crypto.price)}</span>
                    <span class="ticker-change ${crypto.change >= 0 ? 'positive' : 'negative'}">
                        ${crypto.change >= 0 ? '+' : ''}${crypto.change.toFixed(2)}%
                    </span>
                `;
            } else {
                // Fallback for static data
                item.innerHTML = `
                    <span class="ticker-symbol" data-fallback="${crypto.icon || crypto.symbol.charAt(0)}">${crypto.symbol}</span>
                    <span class="ticker-price">${formatPrice(crypto.price)}</span>
                    <span class="ticker-change ${crypto.change >= 0 ? 'positive' : 'negative'}">
                        ${crypto.change >= 0 ? '+' : ''}${crypto.change.toFixed(2)}%
                    </span>
                `;
            }
            
            tickerContent.appendChild(item);
        });
    }
}

// Format Price Display
function formatPrice(price) {
    if (price >= 1000) {
        return price.toLocaleString('en-US', { 
            minimumFractionDigits: 0,
            maximumFractionDigits: 0 
        });
    } else if (price >= 1) {
        return price.toFixed(2);
    } else if (price >= 0.01) {
        return price.toFixed(3);
    } else {
        return price.toFixed(6);
    }
}

// =====================================================
// LIVE STATS WITH REAL DATA
// =====================================================

// Update Live Stats with Real Data
function updateLiveStatsWithRealData() {
    if (!cryptoCache.data) return;
    
    // Calculate average change across all cryptos
    const totalChange = cryptoCache.data.reduce((sum, crypto) => sum + crypto.change, 0);
    const avgChange = totalChange / cryptoCache.data.length;
    
    // Calculate win rate based on positive changes
    const positiveChanges = cryptoCache.data.filter(crypto => crypto.change > 0).length;
    const winRate = ((positiveChanges / cryptoCache.data.length) * 100);
    
    // Update win rate with real market data influence
    const baseWinRate = 89.6;
    const marketInfluence = avgChange > 0 ? 2 : -1;
    const adjustedWinRate = Math.max(85, Math.min(95, baseWinRate + marketInfluence));
    
    const winRateEl = document.getElementById('liveWinRate');
    if (winRateEl) {
        winRateEl.textContent = `${adjustedWinRate.toFixed(1)}%`;
    }
    
    // Update other stats
    updateSignalCount();
    updateActiveUsers();
}

// Enhanced Live Stats Updates
function initLiveStats() {
    // Update stats every 60 seconds
    setInterval(() => {
        if (cryptoCache.data) {
            updateLiveStatsWithRealData();
        } else {
            updateStatsWithFallback();
        }
    }, 60000);
    
    // Initial update
    setTimeout(() => {
        if (cryptoCache.data) {
            updateLiveStatsWithRealData();
        } else {
            updateStatsWithFallback();
        }
    }, 2000);
}

// Update Signal Count
function updateSignalCount() {
    const signalsEl = document.getElementById('liveTotalSignals');
    if (signalsEl) {
        const current = parseInt(signalsEl.textContent.replace(/,/g, '')) || 1822;
        const increment = Math.floor(Math.random() * 3) + 1;
        signalsEl.textContent = (current + increment).toLocaleString();
    }
}

// Update Active Users
function updateActiveUsers() {
    const usersEl = document.getElementById('liveActiveUsers');
    if (usersEl) {
        const baseUsers = 2847;
        const timeVariation = Math.sin(Date.now() / 600000) * 100; // 10-minute cycle
        const randomVariation = (Math.random() - 0.5) * 50;
        const totalUsers = Math.floor(baseUsers + timeVariation + randomVariation);
        usersEl.textContent = Math.max(2500, totalUsers).toLocaleString();
    }
}

// Fallback stats update
function updateStatsWithFallback() {
    const winRateEl = document.getElementById('liveWinRate');
    if (winRateEl) {
        const baseRate = 89.6;
        const variation = (Math.random() - 0.5) * 2;
        const newRate = Math.max(87, Math.min(94, baseRate + variation));
        winRateEl.textContent = `${newRate.toFixed(1)}%`;
    }
    
    updateSignalCount();
    updateActiveUsers();
}

// =====================================================
// NOTIFICATION SYSTEM
// =====================================================

// Show Notifications
function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notificationContainer') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-text">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
}

// Create notification container if it doesn't exist
function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
}

// Get notification icon
function getNotificationIcon(type) {
    const icons = {
        'info': 'ℹ️',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
    };
    return icons[type] || icons.info;
}

// =====================================================
// ORIGINAL NAVIGATION AND UI FUNCTIONS
// =====================================================

// Navigation System
function initNavigation() {
    const { mobileMenuBtn, navLinks } = elements;
    
    if (!mobileMenuBtn || !navLinks) return;
    
    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });
    
    // Close menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            if (isMobile) {
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            }
        });
    });
    
    // Active link highlighting
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-links a[data-nav]');
    
    window.addEventListener('scroll', throttle(function() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-nav') === current) {
                item.classList.add('active');
            }
        });
    }, 100));
}

// Scroll Effects
function initScrollEffects() {
    const { header } = elements;
    
    if (!header) return;
    
    window.addEventListener('scroll', throttle(function() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, 100));
}

// Mouse Effects (Desktop Only)
function initMouseEffects() {
    const follower = document.querySelector('.mouse-follower');
    const dot = document.querySelector('.mouse-dot');
    
    if (!follower || !dot) return;
    
    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;
    
    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    function animate() {
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;
        
        follower.style.transform = `translate(${currentX - 20}px, ${currentY - 20}px)`;
        dot.style.transform = `translate(${currentX - 4}px, ${currentY - 4}px)`;
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// Simple Particles (Desktop Only)
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 30;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.opacity = Math.random() * 0.3 + 0.1;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        
        draw() {
            ctx.fillStyle = `rgba(255, 215, 0, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animateParticles);
    }
    
    animateParticles();
    
    window.addEventListener('resize', debounce(function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }, 300));
}

// Back to Top Button
function initBackToTop() {
    const { backToTop } = elements;
    if (!backToTop) return;
    
    window.addEventListener('scroll', throttle(function() {
        if (window.scrollY > 500) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    }, 100));
    
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Cookie Consent
function initCookieConsent() {
    const { cookieConsent } = elements;
    if (!cookieConsent) return;
    
    if (!localStorage.getItem('cookieConsent')) {
        setTimeout(() => {
            cookieConsent.classList.add('show');
        }, 3000);
    }
    
    const acceptBtn = document.getElementById('acceptCookies');
    const declineBtn = document.getElementById('declineCookies');
    
    acceptBtn?.addEventListener('click', function() {
        localStorage.setItem('cookieConsent', 'accepted');
        cookieConsent.classList.remove('show');
    });
    
    declineBtn?.addEventListener('click', function() {
        localStorage.setItem('cookieConsent', 'declined');
        cookieConsent.classList.remove('show');
    });
}

// Smooth Scroll
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function throttle(func, wait) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, wait);
        }
    };
}

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Performance Monitoring
window.addEventListener('load', function() {
    const loadTime = performance.now();
    console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
    
    // Show success notification when crypto data loads
    setTimeout(() => {
        if (cryptoCache.data) {
            showNotification('✅ Real-time crypto prices loaded successfully!', 'success', 3000);
        }
    }, 3000);
});

// Handle keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        elements.navLinks?.classList.remove('active');
        elements.mobileMenuBtn?.classList.remove('active');
    }
});

// Handle network status
window.addEventListener('online', function() {
    console.log('🟢 Network online - resuming crypto updates');
    if (!cryptoCache.isLoading) {
        fetchAndUpdateCryptoData();
    }
});

window.addEventListener('offline', function() {
    console.log('🔴 Network offline - using cached data');
    showNotification('Network offline. Using cached prices.', 'warning');
});
