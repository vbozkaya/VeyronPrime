/**
 * Veyron Prime Player - Kalıcı depolama
 * Tizen Preference + localStorage fallback (.cursorrules Kural 2)
 */
(function() {
    'use strict';

    function logError(op, key, e) {
        console.error('[Storage]', op, key, e && e.message);
    }

    window.persistentGet = function(key) {
        try {
            if (typeof tizen !== 'undefined' && tizen.preference) {
                var val = tizen.preference.getValue(key);
                if (val != null && val !== undefined) {
                    var str = typeof val === 'string' ? val : String(val);
                    try {
                        localStorage.setItem(key, str);
                    } catch (syncErr) {
                        logError('sync', key, syncErr);
                    }
                    return str;
                }
            }
        } catch (e) {
            logError('persistentGet tizen', key, e);
        }
        try {
            return localStorage.getItem(key);
        } catch (e) {
            logError('persistentGet', key, e);
            return null;
        }
    };

    window.persistentSet = function(key, value) {
        var str = value == null ? '' : String(value);
        try {
            if (typeof tizen !== 'undefined' && tizen.preference) {
                tizen.preference.setValue(key, str);
            }
        } catch (e) {
            logError('persistentSet tizen', key, e);
        }
        try {
            localStorage.setItem(key, str);
        } catch (e) {
            logError('persistentSet', key, e);
        }
    };

    window.persistentRemove = function(key) {
        try {
            if (typeof tizen !== 'undefined' && tizen.preference) {
                tizen.preference.remove(key);
            }
        } catch (e) {
            logError('persistentRemove tizen', key, e);
        }
        try {
            localStorage.removeItem(key);
        } catch (e) {
            logError('persistentRemove', key, e);
        }
    };
})();
