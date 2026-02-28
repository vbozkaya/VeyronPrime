/**
 * Veyron Prime Player - UI Yönetimi
 * Ekran geçişleri, render işlemleri ve mesaj yönetimi
 */

window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };
VeyronApp.ui = VeyronApp.ui || {};

/**
 * Ekran değiştirir
 * Navigasyon stack kullanarak ekran geçişlerini yönetir
 * @param {string} screenName - Hedef ekran adı
 * @param {{ isBack?: boolean }} [options] - isBack: true ise stack'e push yapılmaz (Return ile geri dönüş)
 */
VeyronApp.ui.switchScreen = function(screenName, options) {
    var isBack = options && options.isBack === true;

    // Landing ekranına dönüşte stack'i temizle
    if (screenName === 'landing') {
        if (VeyronApp.core.Navigation && typeof VeyronApp.core.Navigation.clearStack === 'function') {
            VeyronApp.core.Navigation.clearStack();
        }
    } else if (!isBack) {
        // İleri giderken mevcut ekranı stack'e ekle; geri dönüşte (Return) ekleme
        if (VeyronApp.core.Navigation && typeof VeyronApp.core.Navigation.pushScreen === 'function') {
            VeyronApp.core.Navigation.pushScreen(screenName);
        }
    }
    
    if (VeyronApp.StateManager) VeyronApp.StateManager.set('currentScreen', screenName);
    else VeyronApp.State.currentScreen = screenName;
    
    // Tüm ekranları gizle
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Hedef ekranı göster (player açıldığında main/home inline display:none kaldırılmış olabilir)
    const targetScreen = document.getElementById(screenName + 'Screen');
    if (targetScreen) {
        targetScreen.style.display = '';
        targetScreen.classList.add('active');
        
        // Manuel kurulum ekranına geçişte kaydedilmiş bilgileri yükle
        if (screenName === 'manualSetup') {
            VeyronApp.core.Config.loadSavedCredentialsToForm();
        }
        // Focus yönetimi nav_manager'da
        if (VeyronApp.core.Navigation && typeof VeyronApp.core.Navigation.setInitialFocus === 'function') {
            VeyronApp.core.Navigation.setInitialFocus(screenName);
        }
    } else {
        console.error('[UI] Hedef ekran bulunamadı:', screenName + 'Screen');
    }
};

/**
 * Yükleme ekranını gösterir
 */
VeyronApp.ui.showLoading = function() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
};

/**
 * Yükleme ekranını gizler
 */
VeyronApp.ui.hideLoading = function() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
};

/**
 * Hata mesajı gösterir
 */
VeyronApp.ui.showError = function(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        console.error('Hata mesajı:', message);
    }
};

/**
 * Hata mesajını gizler
 */
VeyronApp.ui.hideError = function() {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
};

/**
 * Kanalı oynatır
 */
VeyronApp.ui.playChannel = function(channel) {
    if (VeyronApp.StateManager) VeyronApp.StateManager.set('currentChannel', channel);
    else VeyronApp.State.currentChannel = channel;
    
    // Display Reset: mainScreen ve homeMenuScreen'i gizle (kaynak tüketimini azaltmak için)
    const mainScreen = document.getElementById('mainScreen');
    const homeMenuScreen = document.getElementById('homeMenuScreen');
    if (mainScreen) {
        mainScreen.style.display = 'none';
    }
    if (homeMenuScreen) {
        homeMenuScreen.style.display = 'none';
    }
    
    var streamUrl;
    if (channel.url) {
        streamUrl = channel.url;
    } else {
        const password = localStorage.getItem('iptv_password') || VeyronApp.State.authToken || '';
        if (!password) {
            var channelInfoEl = document.getElementById('channelInfo');
            if (channelInfoEl) {
                channelInfoEl.textContent = 'Şifre bulunamadı. Lütfen giriş yapın.';
                channelInfoEl.classList.add('error');
            }
            return;
        }
        streamUrl = `${VeyronApp.State.apiUrl}/live/${VeyronApp.State.username}/${password}/${channel.stream_id || channel.id}.m3u8`;
    }
    streamUrl = streamUrl.replace(/([^:]\/)\/+/g, '$1');
    
    // Kanal bilgisini göster
    const channelInfo = document.getElementById('channelInfo');
    if (channelInfo) {
        channelInfo.textContent = channel.name || 'Bilinmeyen Kanal';
        channelInfo.classList.remove('error', 'buffering');
    }
    
    if (window.VeyronApp && window.VeyronApp.player && typeof window.VeyronApp.player.play === 'function') {
        window.VeyronApp.player.play(streamUrl);
    } else {
        // Hata mesajı göster
        const channelInfo = document.getElementById('channelInfo');
        if (channelInfo) {
            channelInfo.textContent = 'Player API yüklenemedi. Lütfen sayfayı yenileyin.';
            channelInfo.classList.add('error');
        }
    }
};

/**
 * Videoyu duraklatır. Tüm oynatma PlayerEngine üzerinden yapılır (HTMLVideoElement'e UI erişmez).
 */
VeyronApp.ui.pauseVideo = function() {
    if (VeyronApp.player && typeof VeyronApp.player.stop === 'function') {
        VeyronApp.player.stop();
    }
};

/**
 * Kanallar ekranına geri döner
 */
VeyronApp.ui.handleBackToChannels = function() {
    // AVPlay API ile oynatmayı durdur
    if (VeyronApp.player && typeof VeyronApp.player.stop === 'function') {
        VeyronApp.player.stop();
    } else {
        // Fallback
        VeyronApp.ui.pauseVideo();
    }
    
    // Display Reset: mainScreen'i tekrar göster
    const mainScreen = document.getElementById('mainScreen');
    if (mainScreen) {
        mainScreen.style.display = '';
    }
    
    VeyronApp.ui.switchScreen('main');
};
