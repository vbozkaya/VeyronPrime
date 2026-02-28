/**
 * Veyron Prime Player - AVPlay continuePlayback (prepare + play)
 * player_avplay.js 200 satır limiti için ayrıldı.
 */

(function() {
    'use strict';

    window.VeyronApp = window.VeyronApp || { core: {}, player: {} };
    if (!window.VeyronApp.player) window.VeyronApp.player = {};
    VeyronApp.player.avplayPlayback = VeyronApp.player.avplayPlayback || {};

    var C = window.VeyronApp.Constants;
    var stateTimeoutMs = (C && C.PLAYER_STATE_TIMEOUT_MS) || 10000;

    function applyStreamingProperties(url) {
        try {
            var ua = 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Boros/5.0.125.1011 Mobile Safari/537.36';
            webapis.avplay.setStreamingProperty('USER_AGENT', ua);
        } catch (e) {
            if (typeof console !== 'undefined' && console.warn) console.warn('[Player AVPlay] setStreamingProperty USER_AGENT:', (e && e.message) || e);
        }
        if (url.endsWith('.m3u8') || url.includes('.m3u8')) {
            try {
                webapis.avplay.setStreamingProperty('ADAPTIVE_INFO', 'BITRATE=10000000|STARTBITRATE=LOWEST');
            } catch (e) {
                if (typeof console !== 'undefined' && console.warn) console.warn('[Player AVPlay] setStreamingProperty ADAPTIVE_INFO:', (e && e.message) || e);
            }
        }
        try {
            webapis.avplay.setStreamingProperty('COOKIE', '');
        } catch (e) {
            if (typeof console !== 'undefined' && console.warn) console.warn('[Player AVPlay] setStreamingProperty COOKIE:', (e && e.message) || e);
        }
        try {
            webapis.avplay.setDisplayRect(0, 0, (C && C.DISPLAY_WIDTH) || 1920, (C && C.DISPLAY_HEIGHT) || 1080);
        } catch (e) {
            if (typeof console !== 'undefined' && console.warn) console.warn('[Player AVPlay] setDisplayRect:', (e && e.message) || e);
        }
        try {
            if (typeof webapis.avplay.setOption === 'function') {
                webapis.avplay.setOption('PLAYER_BUFFER_FOR_PLAYBACK', String((C && C.AVPLAY_BUFFER_MS) || 5000));
            }
        } catch (e) {
            if (typeof console !== 'undefined' && console.warn) console.warn('[Player AVPlay] setOption:', (e && e.message) || e);
        }
    }

    function continuePlayback(playerSelf, url, isLiveStreamParam, state) {
        state.isLiveStream = isLiveStreamParam || false;
        try {
            applyStreamingProperties(url);
            if (state.isLiveStream) {
                try {
                    webapis.avplay.play();
                } catch (e) {
                    playerSelf.handleError('PLAY_ERROR');
                    playerSelf.showErrorMessage('Oynatma başlatılamadı: ' + (e.message || ''));
                    return;
                }
                playerSelf.isPlaying = true;
                playerSelf.isPaused = false;
                return;
            }
            state.isPreparing = true;
            var successCallback = function() {
                state.isPreparing = false;
                try {
                    webapis.avplay.play();
                } catch (e) {
                    playerSelf.handleError('PLAY_ERROR');
                    playerSelf.showErrorMessage('Oynatma başlatılamadı: ' + (e.message || ''));
                    return;
                }
                playerSelf.isPlaying = true;
                playerSelf.isPaused = false;
                if (state.playbackTimeout) {
                    clearTimeout(state.playbackTimeout);
                    state.playbackTimeout = null;
                }
            };
            var errorCallback = function() {
                state.isPreparing = false;
                try {
                    webapis.avplay.stop();
                } catch (e) {
                    if (typeof console !== 'undefined' && console.warn) console.warn('[Player AVPlay] stop in errorCallback:', (e && e.message) || e);
                }
                state.avPlayFailed = true;
                playerSelf.playWithHLS(url);
            };
            var prepareCalled = false;
            if (typeof webapis.avplay.prepareAsync === 'function') {
                try {
                    webapis.avplay.prepareAsync(successCallback, errorCallback);
                    prepareCalled = true;
                } catch (e) {
                    try {
                        webapis.avplay.prepare();
                        prepareCalled = true;
                        state.prepareCallback = successCallback;
                    } catch (e2) {
                        state.isPreparing = false;
                        errorCallback();
                        return;
                    }
                }
            } else {
                try {
                    webapis.avplay.prepare();
                    prepareCalled = true;
                    state.prepareCallback = successCallback;
                } catch (e) {
                    state.isPreparing = false;
                    errorCallback();
                    return;
                }
            }
            if (!prepareCalled) {
                state.isPreparing = false;
                errorCallback();
                return;
            }
            state.playbackTimeout = setTimeout(function() {
                if (state.isPreparing) {
                    try {
                        var currentState = webapis.avplay.getState();
                        if (currentState !== 'PLAYING' && currentState !== 'READY') {
                            state.avPlayFailed = true;
                            state.isPreparing = false;
                            try {
                                webapis.avplay.stop();
                            } catch (stopErr) {
                                if (typeof console !== 'undefined' && console.warn) console.warn('[Player AVPlay] stop on timeout:', (stopErr && stopErr.message) || stopErr);
                            }
                            playerSelf.playWithHLS(url);
                        }
                    } catch (e) {
                        state.avPlayFailed = true;
                        state.isPreparing = false;
                        if (typeof console !== 'undefined' && console.warn) console.warn('[Player AVPlay] playbackTimeout check:', (e && e.message) || e);
                        playerSelf.playWithHLS(url);
                    }
                }
            }, stateTimeoutMs);
        } catch (e) {
            state.isPreparing = false;
            playerSelf.handleError('PLAY_ERROR');
            playerSelf.showErrorMessage('Yayın başlatılamadı: ' + (e.message || ''));
        }
    }

    VeyronApp.player.avplayPlayback.continuePlayback = continuePlayback;
})();
