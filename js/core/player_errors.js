/**
 * Veyron Prime Player - Oynatıcı hata mesajı eşlemesi
 * player_manager.js 200 satır limiti için ayrıldı.
 */

(function() {
    'use strict';

    window.VeyronApp = window.VeyronApp || { player: {} };
    VeyronApp.player = VeyronApp.player || {};
    VeyronApp.player.errors = VeyronApp.player.errors || {};

    function getPlayerErrorMessage(errorType, currentUrl) {
        var errorMessage = 'Yayın şu anda kullanılamıyor';
        var errorCode = errorType;
        if (typeof errorType === 'string') {
            if (errorType.indexOf('CONNECTION_FAILED') !== -1 || errorType.indexOf('CONNECTION') !== -1) {
                errorMessage = 'Bağlantı hatası - Sunucuya erişilemiyor. URL ve şifre kontrolü yapın.';
                errorCode = 'CONNECTION_FAILED';
                if (currentUrl && currentUrl.indexOf('//') === -1) errorMessage += ' URL formatı hatalı.';
            } else if (errorType.indexOf('NETWORK') !== -1 || errorType.indexOf('NET') !== -1) {
                errorMessage = 'Ağ bağlantı hatası';
                errorCode = 'NETWORK_ERROR';
            } else if (errorType.indexOf('STREAM') !== -1 || errorType.indexOf('STREAMING') !== -1) {
                errorMessage = 'Yayın akışı hatası';
                errorCode = 'STREAM_ERROR';
            } else if (errorType.indexOf('DECODE') !== -1 || errorType.indexOf('CODEC') !== -1) {
                errorMessage = 'Video çözümleme hatası';
                errorCode = 'DECODE_ERROR';
            } else if (errorType.indexOf('PLAYER') !== -1 || errorType.indexOf('PLAY') !== -1) {
                errorMessage = 'Oynatıcı hatası oluştu';
                errorCode = 'PLAYER_ERROR';
            }
        } else if (typeof errorType === 'number') {
            errorCode = 'ERR_' + errorType;
            if (errorType === 100 || errorType === -100) {
                errorMessage = 'Bağlantı hatası - Sunucuya erişilemiyor';
            }
        } else if (errorType && typeof errorType === 'object') {
            errorCode = errorType.code || errorType.type || 'UNKNOWN';
            errorMessage = errorType.message || errorMessage;
        }
        return { message: errorMessage, code: errorCode };
    }

    VeyronApp.player.errors.getPlayerErrorMessage = getPlayerErrorMessage;
})();
