/**
 * Device identity layer for Supabase integration.
 * Generates and persists deviceId (UUID) and deviceKey.
 * persistentGet/persistentSet kullanır (storage.js sonrası yüklenmeli) böylece Tizen'da kalıcı olur.
 *
 * Geliştirme: USE_FIXED_DEVICE_DEV = true iken sabit id/key döner (panel ile aynı kullanın).
 * Production'da false yapın.
 */
(function() {
    'use strict';

    var STORAGE_KEY_ID = 'device_id';
    var STORAGE_KEY_KEY = 'device_key';
    var DEVICE_KEY_LENGTH_MIN = 8;
    var DEVICE_KEY_LENGTH_MAX = 12;
    var KEY_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    /** Geliştirme: true = her zaman sabit id/key kullan */
    var USE_FIXED_DEVICE_DEV = true;
    var FIXED_DEVICE_ID_DEV = 'dev-veyron-00000000-0000-4000-a000-000000000001';
    var FIXED_DEVICE_KEY_DEV = 'VeyronDevKey123';

    window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };

    function generateUUID() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        var hex = '0123456789abcdef';
        var s = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (Math.random() * 16) | 0;
            var v = c === 'x' ? r : (r & 0x3) | 0x8;
            return hex[v];
        });
        return s;
    }

    function generateDeviceKey() {
        var len = DEVICE_KEY_LENGTH_MIN + Math.floor(Math.random() * (DEVICE_KEY_LENGTH_MAX - DEVICE_KEY_LENGTH_MIN + 1));
        var key = '';
        for (var i = 0; i < len; i++) {
            key += KEY_CHARS.charAt(Math.floor(Math.random() * KEY_CHARS.length));
        }
        return key;
    }

    function readStorage(key) {
        try {
            if (typeof persistentGet === 'function') {
                var v = persistentGet(key);
                if (v) return v;
            }
            if (typeof localStorage !== 'undefined') return localStorage.getItem(key) || '';
        } catch (e) {
            if (typeof console !== 'undefined' && console.warn) console.warn('[device_identity] readStorage:', (e && e.message) || e);
        }
        return '';
    }

    function writeStorage(key, value) {
        try {
            if (typeof persistentSet === 'function') persistentSet(key, value);
        } catch (e) {
            if (typeof console !== 'undefined' && console.warn) console.warn('[device_identity] writeStorage persistent:', (e && e.message) || e);
        }
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        } catch (e) {
            if (typeof console !== 'undefined' && console.warn) console.warn('[device_identity] writeStorage localStorage:', (e && e.message) || e);
        }
    }

    function ensureStored() {
        try {
            var deviceId = readStorage(STORAGE_KEY_ID);
            var deviceKey = readStorage(STORAGE_KEY_KEY);
            if (!deviceId) {
                deviceId = generateUUID();
                writeStorage(STORAGE_KEY_ID, deviceId);
            }
            if (!deviceKey) {
                deviceKey = generateDeviceKey();
                writeStorage(STORAGE_KEY_KEY, deviceKey);
            }
        } catch (e) {
            if (typeof console !== 'undefined' && console.error) console.error('[device_identity] storage error:', e.message);
        }
    }

    ensureStored();

    function getFixedId() {
        if (USE_FIXED_DEVICE_DEV && FIXED_DEVICE_ID_DEV) return FIXED_DEVICE_ID_DEV;
        var b = window.VeyronApp && window.VeyronApp.backend;
        if (b && b.USE_FIXED_DEVICE && b.FIXED_DEVICE_ID) return b.FIXED_DEVICE_ID;
        return '';
    }

    function getFixedKey() {
        if (USE_FIXED_DEVICE_DEV && FIXED_DEVICE_KEY_DEV) return FIXED_DEVICE_KEY_DEV;
        var b = window.VeyronApp && window.VeyronApp.backend;
        if (b && b.USE_FIXED_DEVICE && b.FIXED_DEVICE_KEY) return b.FIXED_DEVICE_KEY;
        return '';
    }

    VeyronApp.device = {
        getDeviceId: function() {
            var fixed = getFixedId();
            if (fixed) return fixed;
            return readStorage(STORAGE_KEY_ID) || '';
        },
        getDeviceKey: function() {
            var fixed = getFixedKey();
            if (fixed) return fixed;
            return readStorage(STORAGE_KEY_KEY) || '';
        }
    };
})();
