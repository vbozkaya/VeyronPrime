/**
 * Veyron Prime Player - HLS.js Modülü
 * Emülatör ve fallback için HLS.js ile oynatma; event kurulumu player_hls_attach.js'de.
 */

(function() {
    'use strict';

    if (!window.VeyronApp || !window.VeyronApp.player) return;

    var player = window.VeyronApp.player;
    var hlsInstance = null;

    player.playWithHLS = function(url) {
        var self = this;
        try {
            if (typeof Hls === 'undefined') {
                this.showErrorMessage('HLS.js kütüphanesi yüklenemedi. js/lib/hls.min.js dosyasını kontrol edin.');
                return;
            }
            var videoPlayer = document.getElementById('videoPlayer');
            if (!videoPlayer) {
                this.showErrorMessage('Video player elementi bulunamadı');
                return;
            }
            videoPlayer.style.display = 'block';
            videoPlayer.style.width = '100%';
            videoPlayer.style.height = 'calc(100% - 80px)';
            videoPlayer.muted = true;
            videoPlayer.setAttribute('muted', 'true');
            videoPlayer.setAttribute('autoplay', 'true');
            videoPlayer.setAttribute('playsinline', 'true');
            videoPlayer.setAttribute('preload', 'auto');
            try {
                videoPlayer.focus();
            } catch (e) {
                if (typeof console !== 'undefined' && console.warn) console.warn('[Player HLS] videoPlayer.focus:', (e && e.message) || e);
            }
            videoPlayer.addEventListener('click', function() {
                if (!self.isPlaying && videoPlayer.paused) {
                    videoPlayer.muted = true;
                    videoPlayer.play().then(function() {
                        self.isPlaying = true;
                        self.isPaused = false;
                    }).catch(function() {});
                }
            });

            if (Hls.isSupported()) {
                if (hlsInstance) {
                    hlsInstance.destroy();
                    hlsInstance = null;
                }
                var hlsConfig = {
                    enableWorker: true,
                    lowLatencyMode: false,
                    backBufferLength: 90,
                    autoStartLoad: true,
                    xhrSetup: function(xhr, reqUrl) {
                        try {
                            xhr.withCredentials = false;
                            var ua = 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Boros/5.0.125.1011 Mobile Safari/537.36';
                            xhr.setRequestHeader('User-Agent', ua);
                            try {
                                var urlObj = new URL(reqUrl);
                                xhr.setRequestHeader('Referer', urlObj.origin + urlObj.pathname.split('/').slice(0, -1).join('/') + '/');
                                xhr.setRequestHeader('Origin', urlObj.origin);
                            } catch (e) {
                                var baseUrl = reqUrl.split('/').slice(0, -1).join('/') + '/';
                                xhr.setRequestHeader('Referer', baseUrl);
                            }
                        } catch (e) {
                            if (typeof console !== 'undefined' && console.warn) console.warn('[Player HLS] xhrSetup:', (e && e.message) || e);
                        }
                    }
                };
                hlsInstance = new Hls(hlsConfig);
                if (window.VeyronApp.player.hlsAttach && window.VeyronApp.player.hlsAttach.setupHlsEvents) {
                    window.VeyronApp.player.hlsAttach.setupHlsEvents(hlsInstance, videoPlayer, url, self);
                }
                hlsInstance.loadSource(url);
                hlsInstance.attachMedia(videoPlayer);
            } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                if (window.VeyronApp.player.hlsAttach && window.VeyronApp.player.hlsAttach.setupNativePlayback) {
                    window.VeyronApp.player.hlsAttach.setupNativePlayback(videoPlayer, url, self);
                }
            } else {
                this.showErrorMessage('Bu tarayıcı HLS yayınlarını desteklemiyor');
            }
        } catch (e) {
            this.showErrorMessage('Yayın başlatılamadı: ' + (e.message || 'Bilinmeyen hata'));
        }
    };

    player.cleanupHLS = function() {
        if (hlsInstance) {
            try {
                hlsInstance.destroy();
                hlsInstance = null;
            } catch (e) {
                if (typeof console !== 'undefined' && console.warn) console.warn('[Player HLS] cleanupHLS destroy:', (e && e.message) || e);
            }
        }
    };
})();
