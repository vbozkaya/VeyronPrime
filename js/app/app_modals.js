/**
 * Veyron Prime Player - Modal ve Kullanıcı Yönetimi UI
 * Onay/hata modalı ve kullanıcı listesi (300 satır limiti için app.js'den ayrıldı)
 */

(function() {
    'use strict';

    window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };

    var confirmModalResolve = null;

    function showInfoModal(title, contentHtml) {
        var titleEl = document.getElementById('infoModalTitle');
        var contentEl = document.getElementById('infoModalContent');
        var modal = document.getElementById('infoModal');
        if (titleEl) titleEl.textContent = title;
        if (contentEl) contentEl.innerHTML = contentHtml;
        if (modal) modal.setAttribute('aria-hidden', 'false');
        var closeBtn = document.getElementById('infoModalClose');
        if (closeBtn) setTimeout(function() { closeBtn.focus(); }, (window.VeyronApp.Constants && window.VeyronApp.Constants.FOCUS_DELAY_MODAL_MS) || 80);
    }

    function hideInfoModal() {
        var modal = document.getElementById('infoModal');
        if (modal) modal.setAttribute('aria-hidden', 'true');
    }

    function showConfirmModal(title, message, onConfirm, onCancel) {
        var titleEl = document.getElementById('confirmModalTitle');
        var messageEl = document.getElementById('confirmModalMessage');
        var modal = document.getElementById('confirmModal');
        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
        if (modal) {
            modal.setAttribute('aria-hidden', 'false');
            confirmModalResolve = { onConfirm: onConfirm || null, onCancel: onCancel || null };
        }
        var cancelBtn = document.getElementById('confirmModalCancel');
        if (cancelBtn) setTimeout(function() { cancelBtn.focus(); }, (window.VeyronApp.Constants && window.VeyronApp.Constants.FOCUS_DELAY_MODAL_MS) || 80);
    }

    function hideConfirmModal() {
        var modal = document.getElementById('confirmModal');
        if (modal) modal.setAttribute('aria-hidden', 'true');
        if (confirmModalResolve && confirmModalResolve.onCancel) confirmModalResolve.onCancel();
        confirmModalResolve = null;
    }

    function handleConfirmModalOk() {
        var modal = document.getElementById('confirmModal');
        if (modal) modal.setAttribute('aria-hidden', 'true');
        if (confirmModalResolve && confirmModalResolve.onConfirm) confirmModalResolve.onConfirm();
        confirmModalResolve = null;
    }

    function showErrorModal(message) {
        var html = '<div class="info-row"><span>' + (message || 'Bir hata oluştu.') + '</span></div>';
        showInfoModal('Hata', html);
    }

    function setupLogoErrorHandlers() {
        document.querySelectorAll('.js-logo-hide-on-error').forEach(function(img) {
            img.addEventListener('error', function() { img.classList.add('error-loaded'); });
        });
    }

    function showUserInfoModal() {
        var apiUrl = (VeyronApp.State && VeyronApp.State.apiUrl) ? VeyronApp.State.apiUrl : '';
        var username = (VeyronApp.State && VeyronApp.State.username) ? VeyronApp.State.username : '';
        var html = '<div class="info-row"><label>DNS</label><span>' + (apiUrl || '-') + '</span></div>';
        html += '<div class="info-row"><label>Kullanıcı Adı</label><span>' + (username || '-') + '</span></div>';
        showInfoModal('Kullanıcı Bilgileri', html);
    }

    function showDeviceInfoModal() {
        var deviceId = (VeyronApp.State && VeyronApp.State.deviceId) ? VeyronApp.State.deviceId : (localStorage.getItem('device_id') || '-');
        var deviceKey = (VeyronApp.State && VeyronApp.State.deviceKey) ? VeyronApp.State.deviceKey : (localStorage.getItem('device_key') || '-');
        var playlistName = (VeyronApp.State && VeyronApp.State.playlistName) ? VeyronApp.State.playlistName : '';
        var html = '<div class="info-row"><label>Device ID</label><span>' + (deviceId || '-') + '</span></div>';
        html += '<div class="info-row"><label>Device Key</label><span>' + (deviceKey || '-') + '</span></div>';
        html += '<div class="info-row"><label>Playlist adı</label><span>' + (playlistName || '-') + '</span></div>';
        showInfoModal('Cihaz Bilgileri', html);
    }

    function loadUserManagementScreen() {
        var userList = document.getElementById('userList');
        var noUsersMessage = document.getElementById('noUsersMessage');
        if (!userList || !noUsersMessage) return;
        var users = VeyronApp.core.Config.getSavedUsers();
        var currentUrl = VeyronApp.State.apiUrl || '';
        var currentUsername = VeyronApp.State.username || '';
        userList.innerHTML = '';
        if (users.length === 0) {
            userList.classList.add('is-hidden');
            noUsersMessage.classList.remove('is-hidden');
        } else {
            userList.classList.remove('is-hidden');
            noUsersMessage.classList.add('is-hidden');
            users.forEach(function(user) {
                var isActive = (user.url === currentUrl && user.username === currentUsername);
                var userItem = document.createElement('div');
                userItem.className = 'user-item' + (isActive ? ' active' : '');
                userItem.tabIndex = 0;
                var infoHtml = '<div class="user-item-info"><div class="user-item-label">DNS</div><div class="user-item-value">' + (user.url || '-') + '</div><div class="user-item-label">Kullanıcı Adı</div><div class="user-item-value">' + (user.username || '-') + '</div></div>';
                var actionsHtml = '<div class="user-item-actions">';
                if (isActive) actionsHtml += '<span class="user-item-active-badge">Aktif</span>';
                actionsHtml += '<button class="btn btn-delete-user" tabindex="0">Sil</button></div>';
                userItem.innerHTML = infoHtml + actionsHtml;
                userList.appendChild(userItem);
                var deleteBtn = userItem.querySelector('.btn-delete-user');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function(e) { e.stopPropagation(); VeyronApp.appModals.handleDeleteUser(user.url, user.username); });
                    deleteBtn.addEventListener('keydown', function(e) { if (e.keyCode === 13) { e.preventDefault(); e.stopPropagation(); VeyronApp.appModals.handleDeleteUser(user.url, user.username); } });
                }
            });
        }
    }

    function handleDeleteUser(url, username) {
        if (!url || !username) return;
        var message = 'Bu kullanıcıyı silmek istediğinizden emin misiniz?\n\nDNS: ' + url + '\nKullanıcı: ' + username;
        showConfirmModal('Kullanıcıyı Sil', message, function() {
            var success = VeyronApp.core.Config.deleteUser(url, username);
            if (success) {
                var remainingUsers = VeyronApp.core.Config.getSavedUsers();
                loadUserManagementScreen();
                if (remainingUsers.length === 0) VeyronApp.ui.switchScreen('landing');
            } else {
                showErrorModal('Kullanıcı silinirken bir hata oluştu.');
            }
        }, null);
    }

    VeyronApp.appModals = {
        showInfoModal: showInfoModal,
        hideInfoModal: hideInfoModal,
        showConfirmModal: showConfirmModal,
        hideConfirmModal: hideConfirmModal,
        handleConfirmModalOk: handleConfirmModalOk,
        showErrorModal: showErrorModal,
        setupLogoErrorHandlers: setupLogoErrorHandlers,
        showUserInfoModal: showUserInfoModal,
        showDeviceInfoModal: showDeviceInfoModal,
        loadUserManagementScreen: loadUserManagementScreen,
        handleDeleteUser: handleDeleteUser
    };
})();
