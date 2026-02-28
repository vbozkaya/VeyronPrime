/**
 * Veyron Prime Player - Ana Orkestrasyon
 * State, initialize, play, stop, pause, resume, hata/stream tamamlama, Utils delegasyonu
 */

(function() {
    'use strict';

    if (!window.VeyronApp || !window.VeyronApp.player) {
        console.error('[Player Manager] VeyronApp.player bulunamadı. player_utils, player_avplay, player_hls yüklü mü?');
        return;
    }

    const player = window.VeyronApp.player;
    const Utils = window.VeyronApp.player.Utils;

    player.isInitialized = false;
    player.isPlaying = false;
    player.isPaused = false;
    player.currentUrl = null;

    player.isEmulator = function() {
        return Utils && typeof Utils.isEmulator === 'function' ? Utils.isEmulator() : false;
    };

    /** Samsung TV (webapis.avplay) varsa AVPlay öncelikli; emülatör veya AVPlay yoksa HLS */
    player.initialize = function() {
        this.useAVPlay = typeof webapis !== 'undefined' && !!webapis.avplay;
        this.isInitialized = true;
    };

    player.play = function(url) {
        if (!window.VeyronApp || !window.VeyronApp.player) {
            this.showErrorMessage('Player API yüklenemedi. Lütfen sayfayı yenileyin.');
            return;
        }
        if (!url) {
            this.showErrorMessage('Yayın URL\'i bulunamadı');
            return;
        }
        this.currentUrl = url;
        try {
            if (this.isPlaying || this.isPaused) {
                this.stop();
            }
            if (window.VeyronApp.ui && typeof window.VeyronApp.ui.switchScreen === 'function') {
                window.VeyronApp.ui.switchScreen('player');
            }
            /* Emülatörde AVPlay çalışmaz; doğrudan HLS */
            if (this.isEmulator()) {
                if (typeof this.playWithHLS === 'function') {
                    setTimeout(function() { player.playWithHLS(url); }, 0);
                } else {
                    this.showErrorMessage('Emülatörde yayın desteklenmiyor. Gerçek TV\'de deneyin.');
                }
                return;
            }
            /* Samsung TV: AVPlay mevcutsa önce AVPlay; başarısız olursa player_avplay içinde HLS fallback */
            if (typeof webapis !== 'undefined' && webapis.avplay) {
                this.playWithAVPlay(url);
            } else if (typeof this.playWithHLS === 'function') {
                this.playWithHLS(url);
            } else {
                this.showErrorMessage('Oynatıcı hazır değil.');
            }
        } catch (e) {
            this.handleError('PLAY_ERROR');
            this.showErrorMessage('Yayın başlatılamadı: ' + (e.message || ''));
        }
    };

    player.stop = function() {
        try {
            if (this.isPlaying || this.isPaused) {
                if (this.useAVPlay && typeof webapis !== 'undefined' && webapis.avplay) {
                    try {
                        webapis.avplay.stop();
                    } catch (e) {
                        if (typeof console !== 'undefined' && console.warn) console.warn('[Player] avplay.stop:', (e && e.message) || e);
                    }
                    if (typeof this.cleanupAVPlay === 'function') {
                        this.cleanupAVPlay();
                    }
                }
                if (typeof this.cleanupHLS === 'function') {
                    this.cleanupHLS();
                }
                const videoPlayer = document.getElementById('videoPlayer');
                if (videoPlayer) {
                    try {
                        videoPlayer.pause();
                        videoPlayer.src = '';
                        videoPlayer.load();
                        videoPlayer.style.display = 'none';
                    } catch (e) {
                        if (typeof console !== 'undefined' && console.warn) console.warn('[Player] videoPlayer cleanup:', (e && e.message) || e);
                    }
                }
                this.isPlaying = false;
                this.isPaused = false;
                this.currentUrl = null;
                this.hideBufferingMessage();
                this.hideErrorMessage();
            }
        } catch (e) {
            console.error('[Player] Durdurma hatası:', e);
        }
    };

    player.pause = function() {
        try {
            if (this.isPlaying && !this.isPaused && typeof webapis !== 'undefined' && webapis.avplay) {
                webapis.avplay.pause();
                this.isPaused = true;
            }
        } catch (e) {
            console.error('[Player] Duraklatma hatası:', e);
        }
    };

    player.resume = function() {
        try {
            if (this.isPaused && typeof webapis !== 'undefined' && webapis.avplay) {
                webapis.avplay.play();
                this.isPaused = false;
            }
        } catch (e) {
            console.error('[Player] Devam ettirme hatası:', e);
        }
    };

    player.handleError = function(errorType) {
        this.isPlaying = false;
        this.isPaused = false;
        var videoPlayer = document.getElementById('videoPlayer');
        if (videoPlayer) videoPlayer.style.display = '';
        var currentState = 'UNKNOWN';
        try {
            if (typeof webapis !== 'undefined' && webapis.avplay) currentState = webapis.avplay.getState();
        } catch (e) {
            if (typeof console !== 'undefined' && console.warn) console.warn('[Player] getState:', (e && e.message) || e);
        }
        var resolved = (window.VeyronApp.player.errors && window.VeyronApp.player.errors.getPlayerErrorMessage)
            ? window.VeyronApp.player.errors.getPlayerErrorMessage(errorType, this.currentUrl)
            : { message: 'Yayın şu anda kullanılamıyor', code: errorType };
        this.showErrorMessage(resolved.message + ' (Hata: ' + resolved.code + ', State: ' + currentState + ')');
    };

    player.handleStreamCompleted = function() {
        this.isPlaying = false;
        this.isPaused = false;
    };

    player.showBufferingMessage = function() {
        if (Utils && typeof Utils.showBufferingMessage === 'function') {
            Utils.showBufferingMessage();
        }
    };

    player.hideBufferingMessage = function() {
        if (Utils && typeof Utils.hideBufferingMessage === 'function') {
            Utils.hideBufferingMessage();
        }
    };

    player.showErrorMessage = function(message) {
        if (Utils && typeof Utils.showErrorMessage === 'function') {
            Utils.showErrorMessage(message);
        }
    };

    player.hideErrorMessage = function() {
        if (Utils && typeof Utils.hideErrorMessage === 'function') {
            Utils.hideErrorMessage();
        }
    };

    function initPlayer() {
        if (!window.VeyronApp || !window.VeyronApp.player) {
            return;
        }
        if (typeof window.VeyronApp.player.initialize !== 'function') {
            return;
        }
        try {
            window.VeyronApp.player.initialize();
        } catch (e) {
            console.error('[Player Manager] Player başlatma hatası:', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPlayer);
    } else {
        var delay = (window.VeyronApp.Constants && window.VeyronApp.Constants.PLAYER_INIT_DELAY_MS) || 100;
        setTimeout(initPlayer, delay);
    }
})();
