/**
 * Veyron Prime Player - Konfigürasyon ve Cihaz Bilgileri
 * Tizen API kullanarak cihaz bilgilerini yönetir (state.js ve storage.js yüklü olmalı)
 */
window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };
VeyronApp.core = VeyronApp.core || {};

VeyronApp.core.Config = {
    /**
     * Cihaz bilgilerini başlatır ve ekranda gösterir.
     * VeyronApp.device varsa sadece oradan oku (asla yazma). Yoksa eski davranış.
     */
    initializeDeviceInfo: function() {
        try {
            var deviceId, deviceKey;
            if (VeyronApp.device && typeof VeyronApp.device.getDeviceId === 'function' && typeof VeyronApp.device.getDeviceKey === 'function') {
                deviceId = VeyronApp.device.getDeviceId() || '-';
                deviceKey = VeyronApp.device.getDeviceKey() || '-';
            } else {
                deviceId = persistentGet('device_id') || '';
                deviceKey = persistentGet('device_key') || '';
                if (!deviceId) {
                    deviceId = this.getDeviceId();
                    persistentSet('device_id', deviceId);
                }
                if (!deviceKey) {
                    deviceKey = this.generateDeviceKey();
                    persistentSet('device_key', deviceKey);
                }
            }
            if (VeyronApp.StateManager) {
                VeyronApp.StateManager.set('deviceId', deviceId);
                VeyronApp.StateManager.set('deviceKey', deviceKey);
            } else {
                VeyronApp.State.deviceId = deviceId;
                VeyronApp.State.deviceKey = deviceKey;
            }
            this.displayDeviceInfo(deviceId, deviceKey);
        } catch (e) {
            console.error('Cihaz bilgisi başlatma hatası:', e);
        }
    },
    
    /**
     * Tizen API kullanarak cihaz ID alır
     * Simülatörde çalışmazsa fallback ID üretir
     */
    getDeviceId: function() {
        // Tizen Web API ile cihaz ID al
        if (typeof webapis !== 'undefined' && webapis.productinfo) {
            try {
                const duid = webapis.productinfo.getDUID();
                if (duid && duid.length > 0) return duid;
            } catch (e) {
                console.error('[Config] getDeviceId webapis failed:', e.message);
            }
        }
        
        // Eski Tizen API denemesi (geriye uyumluluk)
        if (typeof tizen !== 'undefined' && tizen.systeminfo) {
            try {
                tizen.systeminfo.getPropertyValue('DUID', function(duid) {
                    if (duid && duid.value) {
                        if (VeyronApp.StateManager) VeyronApp.StateManager.set('deviceId', duid.value);
                        else VeyronApp.State.deviceId = duid.value;
                        persistentSet('device_id', duid.value);
                        VeyronApp.core.Config.displayDeviceInfo(duid.value, VeyronApp.State.deviceKey);
                    }
                });
            } catch (e) {
                console.error('[Config] getDeviceId systeminfo failed:', e.message);
            }
        }
        
        const fallbackId = 'SIM-ID-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        return fallbackId;
    },
    
    /**
     * Rastgele cihaz anahtarı üretir
     */
    generateDeviceKey: function() {
        const chars = (window.VeyronApp.Constants && window.VeyronApp.Constants.DEVICE_KEY_CHARS) || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let key = '';
        for (let i = 0; i < 16; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    },
    
    /**
     * Cihaz bilgilerini ekranda gösterir
     */
    displayDeviceInfo: function(deviceId, deviceKey) {
        const deviceIdElement = document.getElementById('deviceId');
        const deviceKeyElement = document.getElementById('deviceKey');
        
        if (deviceIdElement) {
            deviceIdElement.textContent = deviceId;
        }
        if (deviceKeyElement) {
            deviceKeyElement.textContent = deviceKey;
        }
    },
    
    /**
     * Kaydedilmiş kimlik bilgilerini temizler
     */
    clearCredentials: function() {
        persistentRemove('iptv_server_url');
        persistentRemove('iptv_username');
        persistentRemove('iptv_auth_token');
        persistentRemove('iptv_password');
        if (VeyronApp.StateManager) {
            VeyronApp.StateManager.setMany({ apiUrl: '', username: '', authToken: '' });
        } else {
            VeyronApp.State.apiUrl = '';
            VeyronApp.State.username = '';
            VeyronApp.State.authToken = '';
        }
    }
};
