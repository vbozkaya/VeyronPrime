/**
 * Veyron Prime Player - Uygulama durumu
 * Tek sorumluluk: global state; tüm yazmalar StateManager üzerinden (.cursorrules Kural 8)
 */
(function() {
    'use strict';
    window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };
    VeyronApp.State = {
        currentScreen: 'landing',
        apiUrl: '',
        authToken: '',
        username: '',
        deviceId: '',
        deviceKey: '',
        playlistName: '',
        categories: [],
        channels: [],
        movies: [],
        movieCategories: [],
        series: [],
        seriesCategories: [],
        contentType: 'live',
        currentChannel: null
    };
    VeyronApp.StateManager = {
        set: function(key, value) {
            if (Object.prototype.hasOwnProperty.call(VeyronApp.State, key)) {
                VeyronApp.State[key] = value;
            }
        },
        setMany: function(updates) {
            for (var key in updates) {
                if (Object.prototype.hasOwnProperty.call(updates, key) && Object.prototype.hasOwnProperty.call(VeyronApp.State, key)) {
                    VeyronApp.State[key] = updates[key];
                }
            }
        }
    };
})();
