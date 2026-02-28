/**
 * Supabase backend API: check-device, get-content.
 * Ortak fetch ve içerik eşleme burada (tekrarsız).
 */
(function() {
    'use strict';

    window.VeyronApp = window.VeyronApp || { api: {} };
    VeyronApp.api = VeyronApp.api || {};

    var TIMEOUT_MS = (window.VeyronApp.Constants && window.VeyronApp.Constants.API_TIMEOUT_MS) || 10000;

    function getBackendConfig() {
        if (!window.VeyronApp.backend || !window.VeyronApp.backend.BASE_URL || !window.VeyronApp.backend.ANON_KEY) {
            return null;
        }
        return window.VeyronApp.backend;
    }

    function backendFetch(path, options) {
        var config = getBackendConfig();
        if (!config) return Promise.reject(new Error('Backend yapılandırması yok'));
        var url = config.BASE_URL.replace(/\/+$/, '') + '/' + path.replace(/^\//, '');
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, TIMEOUT_MS);
        var headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + config.ANON_KEY,
            'apikey': config.ANON_KEY
        };
        if (options && options.headers) {
            for (var k in options.headers) headers[k] = options.headers[k];
        }
        return fetch(url, {
            method: options && options.method ? options.method : 'POST',
            headers: headers,
            body: options && options.body ? options.body : undefined,
            mode: 'cors',
            credentials: 'omit',
            signal: controller.signal
        }).then(function(response) {
            clearTimeout(timeoutId);
            return response;
        }, function(err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') throw new Error('İstek zaman aşımına uğradı');
            throw err;
        });
    }

    /**
     * Cihazı doğrular; yoksa oluşturur.
     * @returns {Promise<{ ok: boolean, status: string }>}
     */
    VeyronApp.api.checkDevice = function(deviceId, deviceKey) {
        var body = { device_id: deviceId, device_key: deviceKey, deviceId: deviceId, deviceKey: deviceKey };
        return backendFetch('check-device', {
            method: 'POST',
            body: JSON.stringify(body)
        }).then(function(response) {
            if (!response.ok) {
                return response.text().then(function(t) { throw new Error(t || 'Cihaz doğrulanamadı'); });
            }
            return response.json().then(function(data) {
                return { ok: true, status: data.status || 'valid' };
            });
        });
    };

    /**
     * Cihaza ait parse edilmiş içeriği döner.
     * Supabase row: { content_json: { live } } veya dizi [ { content_json } ] veya doğrudan { live }.
     * @returns {Promise<{ live: Array }>}
     */
    VeyronApp.api.getContent = function(deviceId) {
        if (!deviceId || String(deviceId).trim() === '') {
            return Promise.reject(new Error('missing device id'));
        }
        var body = { device_id: deviceId, deviceId: deviceId };
        return backendFetch('get-content', {
            method: 'POST',
            body: JSON.stringify(body)
        }).then(function(response) {
            if (!response.ok) {
                return response.text().then(function(t) {
                    var errMsg = t || 'İçerik alınamadı';
                    try {
                        var parsed = JSON.parse(t);
                        if (parsed && (parsed.error || parsed.message)) errMsg = parsed.error || parsed.message;
                    } catch (e) {}
                    throw new Error(errMsg);
                });
            }
            return response.json();
        }).then(function(data) {
            var live = [];
            if (!data) return { live: [] };
            var row = data.data || data;
            var cj = data.content_json || (row && row.content_json);
            if (typeof cj === 'string') {
                try { cj = JSON.parse(cj); } catch (e) { cj = null; }
            }
            if (Array.isArray(data.live)) live = data.live;
            else if (cj && Array.isArray(cj.live)) live = cj.live;
            else if (data.content_json && Array.isArray(data.content_json.live)) live = data.content_json.live;
            else if (row && row.content_json && Array.isArray(row.content_json.live)) live = row.content_json.live;
            else if (row && row.content && Array.isArray(row.content.live)) live = row.content.live;
            else if (row && Array.isArray(row.live)) live = row.live;
            else if (Array.isArray(data) && data.length > 0) {
                row = data[0];
                cj = row && (row.content_json || row.content);
                if (typeof cj === 'string') try { cj = JSON.parse(cj); } catch (e) { cj = null; }
                if (cj && Array.isArray(cj.live)) live = cj.live;
                else if (row && row.content_json && Array.isArray(row.content_json.live)) live = row.content_json.live;
                else if (row && row.content && Array.isArray(row.content.live)) live = row.content.live;
                else if (row && Array.isArray(row.live)) live = row.live;
            }
            return { live: live };
        });
    };

    /**
     * get-content yanıtını State.categories ve State.channels formatına dönüştürür.
     * live: [ { name, url, group? } ] -> categories + channels (url doğrudan oynatma için).
     */
    VeyronApp.api.mapBackendContentToState = function(content) {
        if (!content || !Array.isArray(content.live)) return;
        var live = content.live;
        var groupSet = {};
        var categories = [];
        live.forEach(function(item) {
            var group = (item.group || item.category_name || '').trim() || 'Genel';
            if (!groupSet[group]) {
                groupSet[group] = true;
                categories.push({ category_id: group, category_name: group });
            }
        });
        if (categories.length === 0) categories.push({ category_id: 'Genel', category_name: 'Genel' });
        var channels = live.map(function(item, index) {
            var group = (item.group || item.category_name || '').trim() || 'Genel';
            return {
                name: item.name || 'Kanal ' + (index + 1),
                id: '' + index,
                stream_id: '' + index,
                category_id: group,
                cid: group,
                url: item.url || item.stream_url || item.streamUrl || ''
            };
        });
        if (VeyronApp.StateManager) {
            VeyronApp.StateManager.set('categories', categories);
            VeyronApp.StateManager.set('channels', channels);
        } else {
            VeyronApp.State.categories = categories;
            VeyronApp.State.channels = channels;
        }
    };
})();
