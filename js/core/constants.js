/**
 * Veyron Prime Player - Sabitler
 * Sihirli sayı ve inline sabitler bu dosyada toplanır (.cursorrules Kural 10)
 */
(function() {
    'use strict';
    window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };
    VeyronApp.core = VeyronApp.core || {};

    VeyronApp.Constants = {
        /** API istekleri için varsayılan timeout (ms) */
        API_TIMEOUT_MS: 10000,
        /** Kısa API/timeout (ms) - test bağlantısı vb. */
        API_TIMEOUT_SHORT_MS: 5000,
        /** Focus gecikmeleri (ms) */
        FOCUS_DELAY_MS: 100,
        FOCUS_DELAY_MODAL_MS: 80,
        /** Bootstrap/retry gecikmesi (ms) */
        BOOTSTRAP_DELAY_MS: 50,
        /** UI mesaj gösterim süreleri (ms) */
        UI_MESSAGE_DURATION_MS: 3000,
        UI_MESSAGE_ERROR_DURATION_MS: 2000,
        UI_HIDE_ERROR_DELAY_MS: 3000,
        /** Player buffer / playback gecikmeleri (ms) */
        PLAYER_FOCUS_DELAY_MS: 200,
        PLAYER_INIT_DELAY_MS: 100,
        PLAYER_ERROR_RESET_MS: 2000,
        PLAYER_STATE_TIMEOUT_MS: 10000,
        PLAYER_HIDE_MESSAGE_MS: 5000,
        /** AVPlay display rect (Tizen Full HD) */
        DISPLAY_WIDTH: 1920,
        DISPLAY_HEIGHT: 1080,
        /** AVPlay buffer option (ms) */
        AVPLAY_BUFFER_MS: 5000,
        /** Tizen key code - Back/Return */
        KEY_BACK: 10009,
        /** Hata rengi (UI) */
        COLOR_ERROR: '#f44336',
        /** Device key karakter seti */
        DEVICE_KEY_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    };
})();
