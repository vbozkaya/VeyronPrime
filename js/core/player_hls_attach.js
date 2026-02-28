/**
 * Veyron Prime Player - HLS event ve native playback kurulumu
 * player_hls.js 200 satır limiti için ayrıldı.
 */

(function() {
    'use strict';

    window.VeyronApp = window.VeyronApp || { player: {} };
    VeyronApp.player = VeyronApp.player || {};
    VeyronApp.player.hlsAttach = VeyronApp.player.hlsAttach || {};

    var C = window.VeyronApp.Constants;
    var resetMs = (C && C.PLAYER_ERROR_RESET_MS) || 2000;

    function setupHlsEvents(hlsInstance, videoPlayer, url, playerSelf) {
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, function() {
            videoPlayer.muted = true;
            videoPlayer.setAttribute('muted', 'true');
            videoPlayer.setAttribute('autoplay', 'true');
            videoPlayer.setAttribute('playsinline', 'true');
            var startPlayback = function() {
                videoPlayer.muted = true;
                var playPromise = videoPlayer.play();
                if (playPromise !== undefined) {
                    playPromise.then(function() {
                        playerSelf.isPlaying = true;
                        playerSelf.isPaused = false;
                    }).catch(function() {
                        setTimeout(function() {
                            videoPlayer.muted = true;
                            videoPlayer.setAttribute('muted', 'true');
                            videoPlayer.play().then(function() {
                                playerSelf.isPlaying = true;
                                playerSelf.isPaused = false;
                            }).catch(function() {
                                playerSelf.showErrorMessage('Oynatma başlatılamadı. Lütfen video elementine tıklayın.');
                            });
                        }, 500);
                    });
                } else {
                    playerSelf.isPlaying = true;
                    playerSelf.isPaused = false;
                }
            };
            if (videoPlayer.readyState >= 3) {
                startPlayback();
            } else {
                var playbackStarted = false;
                var onReady = function() {
                    if (!playbackStarted) {
                        playbackStarted = true;
                        videoPlayer.removeEventListener('canplay', onReady);
                        videoPlayer.removeEventListener('loadeddata', onReady);
                        startPlayback();
                    }
                };
                videoPlayer.addEventListener('canplay', onReady, { once: true });
                videoPlayer.addEventListener('loadeddata', onReady, { once: true });
                setTimeout(function() {
                    if (!playbackStarted && !playerSelf.isPlaying) {
                        videoPlayer.removeEventListener('canplay', onReady);
                        videoPlayer.removeEventListener('loadeddata', onReady);
                        startPlayback();
                    }
                }, resetMs);
            }
        });
        hlsInstance.on(Hls.Events.ERROR, function(event, data) {
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        try {
                            hlsInstance.startLoad();
                        } catch (e) {
                            try {
                                hlsInstance.loadSource(url);
                                hlsInstance.startLoad();
                            } catch (reloadErr) {
                                playerSelf.showErrorMessage('Ağ hatası. Bağlantıyı kontrol edin.');
                            }
                        }
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        try {
                            hlsInstance.recoverMediaError();
                        } catch (e) {
                            try {
                                hlsInstance.loadSource(url);
                                hlsInstance.startLoad();
                            } catch (reloadErr) {
                                playerSelf.showErrorMessage('Medya hatası. Lütfen tekrar deneyin.');
                            }
                        }
                        break;
                    default:
                        try {
                            hlsInstance.loadSource(url);
                            hlsInstance.startLoad();
                        } catch (e) {
                            hlsInstance.destroy();
                            playerSelf.showErrorMessage('Yayın açılamadı. Lütfen tekrar deneyin.');
                        }
                        break;
                }
            } else if (data.details === 'fragLoadError' && data.response && data.response.code === 403) {
                try {
                    hlsInstance.startLoad();
                } catch (e) {
                    if (typeof console !== 'undefined' && console.warn) console.warn('[Player HLS] startLoad 403 recovery:', (e && e.message) || e);
                }
            }
        });
    }

    function setupNativePlayback(videoPlayer, url, playerSelf) {
        videoPlayer.muted = true;
        videoPlayer.setAttribute('muted', 'true');
        videoPlayer.setAttribute('autoplay', 'true');
        videoPlayer.setAttribute('playsinline', 'true');
        videoPlayer.src = url;
        videoPlayer.load();
        var startNativePlayback = function() {
            videoPlayer.muted = true;
            videoPlayer.play().then(function() {
                playerSelf.isPlaying = true;
                playerSelf.isPaused = false;
            }).catch(function(error) {
                setTimeout(function() {
                    videoPlayer.muted = true;
                    videoPlayer.setAttribute('muted', 'true');
                    videoPlayer.play().then(function() {
                        playerSelf.isPlaying = true;
                        playerSelf.isPaused = false;
                    }).catch(function() {
                        playerSelf.showErrorMessage('Oynatma başlatılamadı: ' + (error && error.message ? error.message : ''));
                    });
                }, 500);
            });
        };
        if (videoPlayer.readyState >= 3) {
            startNativePlayback();
        } else {
            var playbackStarted = false;
            var onReady = function() {
                if (!playbackStarted) {
                    playbackStarted = true;
                    videoPlayer.removeEventListener('canplay', onReady);
                    videoPlayer.removeEventListener('loadeddata', onReady);
                    startNativePlayback();
                }
            };
            videoPlayer.addEventListener('canplay', onReady, { once: true });
            videoPlayer.addEventListener('loadeddata', onReady, { once: true });
            setTimeout(function() {
                if (!playbackStarted && !playerSelf.isPlaying) {
                    videoPlayer.removeEventListener('canplay', onReady);
                    videoPlayer.removeEventListener('loadeddata', onReady);
                    startNativePlayback();
                }
            }, resetMs);
        }
    }

    VeyronApp.player.hlsAttach.setupHlsEvents = setupHlsEvents;
    VeyronApp.player.hlsAttach.setupNativePlayback = setupNativePlayback;
})();
