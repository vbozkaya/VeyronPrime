/**
 * Veyron Prime Player - Player Yardımcı Fonksiyonlar
 * Player ile ilgili yardımcı fonksiyonlar ve utility'ler
 */

window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };
if (!window.VeyronApp.player) {
    window.VeyronApp.player = {};
}

/**
 * Player yardımcı fonksiyonları
 */
VeyronApp.player.Utils = {
    /**
     * Emülatörde miyiz kontrolü
     * @returns {boolean} Emülatörde ise true
     */
    isEmulator: function() {
        // Tizen emülatör tespiti
        try {
            // User-Agent kontrolü
            const userAgent = navigator.userAgent || '';
            if (userAgent.includes('Tizen') && (userAgent.includes('Emulator') || userAgent.includes('emulator'))) {
                return true;
            }
            
            // Tizen API kontrolü - emülatörde genellikle bazı özellikler eksik olur
            if (typeof tizen !== 'undefined' && tizen.systeminfo) {
                // Gerçek cihazda genellikle daha fazla bilgi vardır
                // Bu basit bir kontrol, daha gelişmiş tespit gerekebilir
            }
            
            // AVPlay state kontrolü - emülatörde genellikle çalışmaz
            if (typeof webapis !== 'undefined' && webapis.avplay) {
                try {
                    const state = webapis.avplay.getState();
                    // Emülatörde genellikle NONE veya hata verir
                    if (state === 'NONE' || state === null) {
                        return true;
                    }
                } catch (e) {
                    // Emülatörde AVPlay genellikle hata verir
                    return true;
                }
            }
            
            return false;
        } catch (e) {
            console.warn('[Player Utils] Emülatör tespiti hatası:', e);
            return false;
        }
    },
    
    /**
     * Buffering mesajını gösterir
     */
    showBufferingMessage: function() {
        const channelInfo = document.getElementById('channelInfo');
        if (channelInfo) {
            const originalText = channelInfo.dataset.originalText || channelInfo.textContent;
            channelInfo.dataset.originalText = originalText;
            channelInfo.textContent = 'Yükleniyor...';
            channelInfo.classList.add('buffering');
        }
    },
    
    /**
     * Buffering mesajını gizler
     */
    hideBufferingMessage: function() {
        const channelInfo = document.getElementById('channelInfo');
        if (channelInfo) {
            const originalText = channelInfo.dataset.originalText;
            if (originalText) {
                channelInfo.textContent = originalText;
                channelInfo.classList.remove('buffering');
            }
        }
    },
    
    /**
     * Hata mesajını gösterir
     * @param {string} message - Hata mesajı
     */
    showErrorMessage: function(message) {
        const channelInfo = document.getElementById('channelInfo');
        if (channelInfo) {
            channelInfo.textContent = message;
            channelInfo.classList.add('error');
        }
        
        var hideDelay = (window.VeyronApp.Constants && window.VeyronApp.Constants.PLAYER_HIDE_MESSAGE_MS) || 5000;
        setTimeout(() => {
            this.hideErrorMessage();
        }, hideDelay);
    },
    
    /**
     * Hata mesajını gizler
     */
    hideErrorMessage: function() {
        const channelInfo = document.getElementById('channelInfo');
        if (channelInfo) {
            channelInfo.classList.remove('error');
            // Orijinal kanal adını geri yükle
            if (window.VeyronApp && window.VeyronApp.State && window.VeyronApp.State.currentChannel) {
                channelInfo.textContent = window.VeyronApp.State.currentChannel.name || 'Bilinmeyen Kanal';
            }
        }
    }
};
