/**
 * Veyron Prime Player - İçerik yükleme
 * Backend get-content + M3U parse; IPTV API fallback.
 */
(function() {
    'use strict';
    window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };

    function xhrPost(url, body) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.timeout = (window.VeyronApp.Constants && window.VeyronApp.Constants.API_TIMEOUT_MS) || 10000;
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try { resolve(JSON.parse(xhr.responseText || '{}')); } catch (e) { reject(e); }
                } else { reject(new Error(xhr.status + ' ' + xhr.statusText)); }
            };
            xhr.onerror = function() { reject(new Error('Network error')); };
            xhr.ontimeout = function() { reject(new Error('Timeout')); };
            try { xhr.send(JSON.stringify(body)); } catch (e) { reject(e); }
        });
    }

    function xhrGet(url) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.timeout = (window.VeyronApp.Constants && window.VeyronApp.Constants.API_TIMEOUT_MS) || 10000;
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText || '');
                else reject(new Error(xhr.status + ' ' + xhr.statusText));
            };
            xhr.onerror = function() { reject(new Error('Network error')); };
            xhr.ontimeout = function() { reject(new Error('Timeout')); };
            try { xhr.send(); } catch (e) { reject(e); }
        });
    }

    function parseM3u(text) {
        var items = [];
        var lines = (text || '').split('\n').map(function(l) { return l.trim(); });
        var name = '', logo = '', group = '';
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.indexOf('#EXTINF') === 0) {
                var m = line.match(/,(.*)$/);
                name = m ? m[1].trim() : '';
                var logoM = line.match(/tvg-logo="(.*?)"/);
                logo = logoM ? logoM[1] : '';
                var groupM = line.match(/group-title="(.*?)"/);
                group = groupM ? groupM[1].trim() : 'Genel';
                continue;
            }
            if (line.indexOf('http') === 0) {
                items.push({ name: name || ('Kanal ' + (items.length + 1)), url: line, logo: logo, group: group || 'Genel' });
            }
        }
        return items;
    }

    function isMovieByGroupOrUrl(group, url) {
        var g = (group || '').toLowerCase();
        var u = (url || '').toLowerCase();
        return g.indexOf('film') >= 0 || g.indexOf('vod') >= 0 || g.indexOf('movie') >= 0 || u.indexOf('/movie/') >= 0;
    }

    function isSeriesByGroupOrUrl(group, url) {
        var g = (group || '').toLowerCase();
        var u = (url || '').toLowerCase();
        return g.indexOf('dizi') >= 0 || g.indexOf('series') >= 0 || u.indexOf('/series/') >= 0;
    }

    function m3uToState(items) {
        var liveItems = [];
        var movies = [];
        var series = [];
        var movieGroupSet = {};
        var seriesGroupSet = {};
        items.forEach(function(item, idx) {
            var group = item.group || 'Genel';
            var effectiveGroup = group;
            if (isMovieByGroupOrUrl(group, item.url)) {
                if (group === 'Genel' || !group) effectiveGroup = 'VOD';
                movieGroupSet[effectiveGroup] = true;
                movies.push({
                    name: item.name,
                    stream_url: item.url,
                    stream_icon: item.logo || '',
                    id: String(idx),
                    category_id: effectiveGroup,
                    cid: effectiveGroup
                });
            } else if (isSeriesByGroupOrUrl(group, item.url)) {
                if (group === 'Genel' || !group) effectiveGroup = 'Dizi';
                seriesGroupSet[effectiveGroup] = true;
                series.push({
                    name: item.name,
                    stream_url: item.url,
                    stream_icon: item.logo || '',
                    id: String(idx),
                    category_id: effectiveGroup,
                    cid: effectiveGroup
                });
            } else {
                liveItems.push({ item: item, idx: idx });
            }
        });
        var liveGroupSet = {};
        liveItems.forEach(function(o) { liveGroupSet[o.item.group || 'Genel'] = true; });
        var categories = Object.keys(liveGroupSet).sort().map(function(g) {
            return { category_id: g, category_name: g };
        });
        var channels = liveItems.map(function(o, i) {
            var item = o.item;
            return {
                stream_id: String(i),
                id: String(i),
                name: item.name,
                stream_url: item.url,
                stream_icon: item.logo || '',
                category_id: item.group || 'Genel',
                cid: item.group || 'Genel'
            };
        });
        var movieCategories = Object.keys(movieGroupSet).sort().map(function(g) {
            return { category_id: g, category_name: g };
        });
        var seriesCategories = Object.keys(seriesGroupSet).sort().map(function(g) {
            return { category_id: g, category_name: g };
        });
        var state = {
            categories: categories,
            channels: channels,
            movies: movies,
            series: series,
            movieCategories: movieCategories,
            seriesCategories: seriesCategories
        };
        if (window.VeyronApp.StateManager && window.VeyronApp.StateManager.setMany) {
            window.VeyronApp.StateManager.setMany(state);
        } else {
            Object.keys(state).forEach(function(k) {
                if (Object.prototype.hasOwnProperty.call(window.VeyronApp.State, k)) window.VeyronApp.State[k] = state[k];
            });
        }
    }

    /** Döner: { ok: true } | { ok: false, reason: 'no_base'|'no_device'|'no_playlist'|'network'|'m3u_failed' } */
    function loadContentFromBackend() {
        var app = window.VeyronApp;
        if (!app || !app.Constants || !app.State) return Promise.resolve({ ok: false, reason: 'no_base' });
        var base = (app.Constants.BACKEND_BASE_URL || '').trim();
        var deviceId = (app.State.deviceId || '').toString().trim();
        if (!base || !deviceId) return Promise.resolve({ ok: false, reason: 'no_device' });

        var url = base + '/get-content';
        return xhrPost(url, { deviceId: deviceId, device_id: deviceId })
            .then(function(data) {
                var playlistName = (data.playlist_name && String(data.playlist_name).trim()) ? String(data.playlist_name).trim() : '';
                if (window.VeyronApp.StateManager && window.VeyronApp.StateManager.set) {
                    window.VeyronApp.StateManager.set('playlistName', playlistName);
                } else if (window.VeyronApp.State) {
                    window.VeyronApp.State.playlistName = playlistName;
                }
                var m3uUrl = data.m3u_url;
                if (!m3uUrl) return { ok: false, reason: 'no_playlist' };
                var m3uContent = (data.m3u_content && String(data.m3u_content).trim()) ? String(data.m3u_content) : null;
                if (m3uContent) {
                    var items = parseM3u(m3uContent);
                    if (items.length === 0) return { ok: false, reason: 'm3u_failed' };
                    m3uToState(items);
                    return Promise.resolve({ ok: true });
                }
                return xhrGet(m3uUrl).then(function(text) {
                    var items = parseM3u(text);
                    if (items.length === 0) return { ok: false, reason: 'm3u_failed' };
                    m3uToState(items);
                    return { ok: true };
                }).catch(function() { return { ok: false, reason: 'm3u_failed' }; });
            })
            .catch(function() { return { ok: false, reason: 'network' }; });
    }

    function loadContentFromIptv() {
        return VeyronApp.api.loadCategories().then(function() {
            return VeyronApp.api.loadChannels();
        });
    }

    VeyronApp.ui.contentLoader = {
        loadContentFromBackend: loadContentFromBackend,
        loadContentFromIptv: loadContentFromIptv
    };
})();
