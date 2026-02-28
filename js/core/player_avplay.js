/**
 * Veyron Prime Player - AVPlay API Modülü
 * Samsung Tizen AVPlay: event listener, open, prepare delegasyonu (continuePlayback: player_avplay_playback.js)
 */

(function() {
    'use strict';

    window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };
    if (!window.VeyronApp.player) window.VeyronApp.player = {};

    var player = window.VeyronApp.player;
    var state = {
        isPreparing: false,
        prepareCallback: null,
        playbackTimeout: null,
        avPlayFailed: false,
        isLiveStream: false
    };

    player.useAVPlay = true;

    player.setupEventListeners = function() {
        try {
            var self = this;
            webapis.avplay.setListener({
                onbufferingstart: function() { self.showBufferingMessage(); },
                onbufferingcomplete: function() {
                    self.hideBufferingMessage();
                    if (state.isLiveStream) return;
                    if (state.isPreparing && state.prepareCallback) {
                        state.isPreparing = false;
                        if (state.playbackTimeout) {
                            clearTimeout(state.playbackTimeout);
                            state.playbackTimeout = null;
                        }
                        var cb = state.prepareCallback;
                        state.prepareCallback = null;
                        cb();
                    }
                },
                oncurrentplaytime: function() {
                    if (state.playbackTimeout) {
                        clearTimeout(state.playbackTimeout);
                        state.playbackTimeout = null;
                    }
                },
                onstreamcompleted: function() {
                    if (state.isLiveStream) return;
                    self.handleStreamCompleted();
                },
                onerror: function(errorType) {
                    if (self.currentUrl && typeof self.playWithHLS === 'function') {
                        self.playWithHLS(self.currentUrl);
                    } else {
                        self.handleError(errorType);
                    }
                },
                onevent: function() {}
            });
        } catch (e) {
            console.error('[Player AVPlay] Event listener ayarlama hatası:', e);
        }
    };

    player.playWithAVPlay = function(url) {
        var self = this;
        state.isLiveStream = url && url.includes('.m3u8');
        state.avPlayFailed = false;
        setTimeout(function() {
            try {
                var videoPlayer = document.getElementById('videoPlayer');
                if (videoPlayer) videoPlayer.style.display = 'none';
                webapis.avplay.open(url);
                setTimeout(function() {
                    var currentState = 'UNKNOWN';
                    try {
                        currentState = webapis.avplay.getState();
                    } catch (e) {
                        if (typeof console !== 'undefined' && console.warn) console.warn('[Player AVPlay] getState:', (e && e.message) || e);
                    }
                    if (currentState !== 'READY' && currentState !== 'IDLE') {
                        setTimeout(function() {
                            if (window.VeyronApp.player.avplayPlayback && window.VeyronApp.player.avplayPlayback.continuePlayback) {
                                window.VeyronApp.player.avplayPlayback.continuePlayback(self, url, state.isLiveStream, state);
                            }
                        }, 200);
                        return;
                    }
                    if (window.VeyronApp.player.avplayPlayback && window.VeyronApp.player.avplayPlayback.continuePlayback) {
                        window.VeyronApp.player.avplayPlayback.continuePlayback(self, url, state.isLiveStream, state);
                    }
                }, 100);
            } catch (e) {
                state.isPreparing = false;
                state.prepareCallback = null;
                state.avPlayFailed = true;
                self.playWithHLS(url);
            }
        }, 200);
    };

    player.continuePlayback = function(url, isLiveStreamParam) {
        if (window.VeyronApp.player.avplayPlayback && window.VeyronApp.player.avplayPlayback.continuePlayback) {
            window.VeyronApp.player.avplayPlayback.continuePlayback(this, url, isLiveStreamParam, state);
        }
    };

    player.configureStreamingProperties = function(url) {
        try {
            var ua = 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Boros/5.0.125.1011 Mobile Safari/537.36';
            webapis.avplay.setStreamingProperty('USER_AGENT', ua);
            if (url.startsWith('http://')) {
                try {
                    webapis.avplay.setStreamingProperty('COOKIE', '');
                } catch (e) {
                    if (typeof console !== 'undefined' && console.warn) console.warn('[Player AVPlay] setStreamingProperty COOKIE (configure):', (e && e.message) || e);
                }
            }
        } catch (e) {
            console.error('[Player AVPlay] Streaming özellik hatası:', e);
        }
    };

    player.cleanupAVPlay = function() {
        if (state.playbackTimeout) {
            clearTimeout(state.playbackTimeout);
            state.playbackTimeout = null;
        }
        state.isPreparing = false;
        state.prepareCallback = null;
        state.isLiveStream = false;
    };
})();
