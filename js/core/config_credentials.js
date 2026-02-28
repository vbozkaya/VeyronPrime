/**
 * Veyron Prime Player - Kimlik bilgileri ve form yükleme
 * Config nesnesine credentials ve form metodları ekler (.cursorrules Kural 2 - dosya boyutu)
 */
(function() {
    'use strict';
    if (!window.VeyronApp || !window.VeyronApp.core || !window.VeyronApp.core.Config) return;

    var Config = VeyronApp.core.Config;

    Config.checkSavedCredentials = function() {
        try {
            var savedUrl = persistentGet('iptv_server_url');
            var savedUsername = persistentGet('iptv_username');
            var savedPassword = persistentGet('iptv_password');
            var savedToken = persistentGet('iptv_auth_token');
            if (savedUrl && savedUsername && savedPassword) {
                if (VeyronApp.StateManager) {
                    VeyronApp.StateManager.set('apiUrl', savedUrl);
                    VeyronApp.StateManager.set('username', savedUsername);
                    VeyronApp.StateManager.set('authToken', savedToken || '');
                } else {
                    VeyronApp.State.apiUrl = savedUrl;
                    VeyronApp.State.username = savedUsername;
                    VeyronApp.State.authToken = savedToken || '';
                }
                return true;
            }
            return false;
        } catch (e) {
            console.error('Kimlik bilgisi kontrol hatası:', e);
            return false;
        }
    };

    Config.saveCredentials = function(url, username, token, password) {
        try {
            persistentSet('iptv_server_url', url);
            persistentSet('iptv_username', username);
            if (token) persistentSet('iptv_auth_token', token);
            if (password) persistentSet('iptv_password', password);
            var users = this.getSavedUsers();
            var existingIndex = users.findIndex(function(u) {
                return u.url === url && u.username === username;
            });
            var userData = {
                url: url,
                username: username,
                token: token || '',
                password: password || '',
                createdAt: existingIndex >= 0 ? users[existingIndex].createdAt : new Date().toISOString(),
                lastUsed: new Date().toISOString()
            };
            if (existingIndex >= 0) {
                users[existingIndex] = userData;
            } else {
                users.push(userData);
            }
            persistentSet('iptv_users', JSON.stringify(users));
        } catch (e) {
            console.error('Kimlik bilgisi kaydetme hatası:', e);
        }
    };

    Config.getSavedUsers = function() {
        try {
            var usersJson = persistentGet('iptv_users');
            if (usersJson) return JSON.parse(usersJson);
            return [];
        } catch (e) {
            console.error('Kullanıcı listesi okuma hatası:', e);
            return [];
        }
    };

    Config.deleteUser = function(url, username) {
        try {
            var users = this.getSavedUsers();
            users = users.filter(function(u) {
                return !(u.url === url && u.username === username);
            });
            persistentSet('iptv_users', JSON.stringify(users));
            if (VeyronApp.State.apiUrl === url && VeyronApp.State.username === username) {
                this.clearCredentials();
            }
            return true;
        } catch (e) {
            console.error('Kullanıcı silme hatası:', e);
            return false;
        }
    };

    Config.loadSavedCredentialsToForm = function() {
        try {
            var savedUrl = persistentGet('iptv_server_url');
            var savedUsername = persistentGet('iptv_username');
            var savedPassword = persistentGet('iptv_password');
            var serverUrlInput = document.getElementById('serverUrl');
            var usernameInput = document.getElementById('username');
            var passwordInput = document.getElementById('password');
            if (serverUrlInput && savedUrl) serverUrlInput.value = savedUrl;
            if (usernameInput && savedUsername) usernameInput.value = savedUsername;
            if (passwordInput && savedPassword) passwordInput.value = savedPassword;
        } catch (e) {
            console.error('Form bilgisi yükleme hatası:', e);
        }
    };

    Config.initializeDefaultCredentials = function() {
        try {
            var existingUrl = persistentGet('iptv_server_url');
            var existingUsername = persistentGet('iptv_username');
            if (existingUrl && existingUsername) {
                if (VeyronApp.StateManager) {
                    VeyronApp.StateManager.set('apiUrl', existingUrl);
                    VeyronApp.StateManager.set('username', existingUsername);
                } else {
                    VeyronApp.State.apiUrl = existingUrl;
                    VeyronApp.State.username = existingUsername;
                }
            }
        } catch (e) {
            console.error('[Config] Bilgi yükleme hatası:', e);
        }
    };
})();
