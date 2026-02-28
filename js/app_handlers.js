/**
 * Veyron Prime Player - Ana Event ve Giriş İşleyicileri
 * init, setupEventListeners, login/test/logout (300 satır limiti için app.js'den ayrıldı)
 */

(function() {
    'use strict';

    window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };

    function registerDeviceWithBackend() {
        if (!VeyronApp.backend || !VeyronApp.device || !VeyronApp.api.checkDevice) return;
        var deviceId = (VeyronApp.device.getDeviceId() || '').trim();
        var deviceKey = (VeyronApp.device.getDeviceKey() || '').trim();
        if (!deviceId || !deviceKey) return;
        VeyronApp.api.checkDevice(deviceId, deviceKey).catch(function() {});
    }

    function checkAndSetInitialScreen() {
        var hasCredentials = VeyronApp.core.Config.checkSavedCredentials();
        if (hasCredentials) {
            if (VeyronApp.ui && VeyronApp.ui.switchScreen) VeyronApp.ui.switchScreen('homeMenu');
        } else {
            if (VeyronApp.ui && VeyronApp.ui.switchScreen) {
                VeyronApp.ui.switchScreen('landing');
            } else {
                var landingScreen = document.getElementById('landingScreen');
                if (landingScreen) landingScreen.classList.add('active');
            }
        }
    }

    function handleLogin(e) {
        e.preventDefault();
        var serverUrl = document.getElementById('serverUrl').value.trim();
        var username = document.getElementById('username').value.trim();
        var password = document.getElementById('password').value.trim();
        if (!serverUrl || !username || !password) {
            VeyronApp.ui.showError('Lütfen tüm alanları doldurun');
            return;
        }
        var normalizedUrl = VeyronApp.api.normalizeUrl(serverUrl);
        if (VeyronApp.StateManager) {
            VeyronApp.StateManager.set('apiUrl', normalizedUrl);
            VeyronApp.StateManager.set('username', username);
        } else {
            VeyronApp.State.apiUrl = normalizedUrl;
            VeyronApp.State.username = username;
        }
        VeyronApp.ui.showLoading();
        VeyronApp.ui.hideError();
        VeyronApp.api.login(normalizedUrl, username, password)
            .then(function(authResult) {
                if (authResult.success) {
                    if (VeyronApp.StateManager) VeyronApp.StateManager.set('authToken', authResult.token);
                    else VeyronApp.State.authToken = authResult.token;
                    VeyronApp.core.Config.saveCredentials(normalizedUrl, username, authResult.token, password);
                    VeyronApp.ui.hideError();
                    VeyronApp.ui.switchScreen('homeMenu');
                } else {
                    VeyronApp.ui.showError(authResult.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
                }
            })
            .catch(function() {
                VeyronApp.ui.showError('Bağlantı hatası. Lütfen sunucu URL\'sini ve internet bağlantınızı kontrol edin.');
            })
            .finally(function() { VeyronApp.ui.hideLoading(); });
    }

    function handleTestConnection() {
        var serverUrl = document.getElementById('serverUrl').value.trim();
        if (!serverUrl) {
            VeyronApp.ui.showError('Lütfen önce DNS adresini girin');
            return;
        }
        var normalizedUrl = VeyronApp.api.normalizeUrl(serverUrl);
        VeyronApp.ui.showLoading();
        VeyronApp.ui.hideError();
        VeyronApp.api.testConnection(normalizedUrl)
            .then(function(result) {
                if (result.success) {
                    VeyronApp.ui.showError(result.message);
                    setTimeout(function() {
                        VeyronApp.ui.hideError();
                    }, (window.VeyronApp.Constants && window.VeyronApp.Constants.UI_HIDE_ERROR_DELAY_MS) || 3000);
                } else {
                    VeyronApp.ui.showError(result.error);
                }
            })
            .catch(function() {
                VeyronApp.ui.showError('Bağlantı testi başarısız. Lütfen DNS adresini ve internet bağlantınızı kontrol edin.');
            })
            .finally(function() { VeyronApp.ui.hideLoading(); });
    }

    function handleLogout() {
        VeyronApp.core.Config.clearCredentials();
        if (VeyronApp.StateManager) {
            VeyronApp.StateManager.setMany({ categories: [], channels: [], currentChannel: null });
        } else {
            VeyronApp.State.categories = [];
            VeyronApp.State.channels = [];
            VeyronApp.State.currentChannel = null;
        }
        var passwordInput = document.getElementById('password');
        if (passwordInput) passwordInput.value = '';
        VeyronApp.ui.pauseVideo();
        VeyronApp.ui.switchScreen('landing');
    }

    function setupEventListeners() {
        var landingUpdateBtn = document.getElementById('landingUpdateBtn');
        if (landingUpdateBtn) {
            landingUpdateBtn.addEventListener('click', function() {
                if (VeyronApp.ui && VeyronApp.ui.landingUpdate) VeyronApp.ui.landingUpdate();
            });
            landingUpdateBtn.addEventListener('keydown', function(e) {
                if (e.keyCode === 13) {
                    e.preventDefault();
                    if (VeyronApp.ui && VeyronApp.ui.landingUpdate) VeyronApp.ui.landingUpdate();
                }
            });
        }
        var loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.addEventListener('submit', handleLogin);
        var testConnectionBtn = document.getElementById('testConnectionBtn');
        if (testConnectionBtn) testConnectionBtn.addEventListener('click', handleTestConnection);
        document.querySelectorAll('.menu-item').forEach(function(item) {
            var menuType = item.dataset.menu;
            item.addEventListener('click', function() { if (VeyronApp.ui && VeyronApp.ui.handleMenuSelection) VeyronApp.ui.handleMenuSelection(menuType); });
            item.addEventListener('keydown', function(e) { if (e.keyCode === 13) { e.preventDefault(); if (VeyronApp.ui && VeyronApp.ui.handleMenuSelection) VeyronApp.ui.handleMenuSelection(menuType); } });
        });
        var backToHomeBtn = document.getElementById('backToHomeBtn');
        if (backToHomeBtn) {
            backToHomeBtn.addEventListener('click', function() { VeyronApp.ui.switchScreen('homeMenu'); });
            backToHomeBtn.addEventListener('keydown', function(e) { if (e.keyCode === 13) { e.preventDefault(); VeyronApp.ui.switchScreen('homeMenu'); } });
        }
        var logoutFromHomeBtn = document.getElementById('logoutFromHomeBtn');
        if (logoutFromHomeBtn) {
            logoutFromHomeBtn.addEventListener('click', handleLogout);
            logoutFromHomeBtn.addEventListener('keydown', function(e) { if (e.keyCode === 13) { e.preventDefault(); handleLogout(); } });
        }
        var backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.addEventListener('click', function() { VeyronApp.ui.handleBackToChannels(); });
        var updateBtn = document.getElementById('updateBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', function(e) { e.preventDefault(); if (VeyronApp.ui && VeyronApp.ui.updateData) VeyronApp.ui.updateData(); });
            updateBtn.addEventListener('keydown', function(e) { if (e.keyCode === 13) { e.preventDefault(); if (VeyronApp.ui && VeyronApp.ui.updateData) VeyronApp.ui.updateData(); } });
        }
        var userInfoBtn = document.getElementById('userInfoBtn');
        if (userInfoBtn) {
            userInfoBtn.addEventListener('click', function() { VeyronApp.appModals.loadUserManagementScreen(); VeyronApp.ui.switchScreen('userManagement'); });
            userInfoBtn.addEventListener('keydown', function(e) { if (e.keyCode === 13) { e.preventDefault(); VeyronApp.appModals.loadUserManagementScreen(); VeyronApp.ui.switchScreen('userManagement'); } });
        }
        var deviceInfoBtn = document.getElementById('deviceInfoBtn');
        if (deviceInfoBtn) {
            deviceInfoBtn.addEventListener('click', function() { VeyronApp.appModals.showDeviceInfoModal(); });
            deviceInfoBtn.addEventListener('keydown', function(e) { if (e.keyCode === 13) { e.preventDefault(); VeyronApp.appModals.showDeviceInfoModal(); } });
        }
        var infoModalClose = document.getElementById('infoModalClose');
        if (infoModalClose) {
            infoModalClose.addEventListener('click', function() { VeyronApp.appModals.hideInfoModal(); });
            infoModalClose.addEventListener('keydown', function(e) { if (e.keyCode === 13) { e.preventDefault(); VeyronApp.appModals.hideInfoModal(); } });
        }
        var infoModal = document.getElementById('infoModal');
        if (infoModal) {
            var backdrop = infoModal.querySelector('.info-modal-backdrop');
            if (backdrop) backdrop.addEventListener('click', function() { VeyronApp.appModals.hideInfoModal(); });
        }
        var confirmModalOk = document.getElementById('confirmModalOk');
        var confirmModalCancel = document.getElementById('confirmModalCancel');
        var confirmModalBackdrop = document.querySelector('#confirmModal .confirm-modal-backdrop');
        if (confirmModalOk) {
            confirmModalOk.addEventListener('click', function() { VeyronApp.appModals.handleConfirmModalOk(); });
            confirmModalOk.addEventListener('keydown', function(e) { if (e.keyCode === 13) { e.preventDefault(); VeyronApp.appModals.handleConfirmModalOk(); } });
        }
        if (confirmModalCancel) {
            confirmModalCancel.addEventListener('click', function() { VeyronApp.appModals.hideConfirmModal(); });
            confirmModalCancel.addEventListener('keydown', function(e) { if (e.keyCode === 13) { e.preventDefault(); VeyronApp.appModals.hideConfirmModal(); } });
        }
        if (confirmModalBackdrop) confirmModalBackdrop.addEventListener('click', function() { VeyronApp.appModals.hideConfirmModal(); });
        var userManagementBackBtn = document.getElementById('userManagementBackBtn');
        if (userManagementBackBtn) {
            userManagementBackBtn.addEventListener('click', function() { VeyronApp.ui.switchScreen('homeMenu'); });
            userManagementBackBtn.addEventListener('keydown', function(e) { if (e.keyCode === 13) { e.preventDefault(); VeyronApp.ui.switchScreen('homeMenu'); } });
        }
    }

    function init() {
        var landingScreen = document.getElementById('landingScreen');
        if (landingScreen && !landingScreen.classList.contains('active')) {
            document.querySelectorAll('.screen').forEach(function(screen) { screen.classList.remove('active'); });
            landingScreen.classList.add('active');
        }
        if (VeyronApp.core && VeyronApp.core.Config) {
            VeyronApp.core.Config.initializeDeviceInfo();
            VeyronApp.core.Config.initializeDefaultCredentials();
        }
        registerDeviceWithBackend();
        setupEventListeners();
        if (VeyronApp.appModals && VeyronApp.appModals.setupLogoErrorHandlers) VeyronApp.appModals.setupLogoErrorHandlers();
        if (VeyronApp.core && VeyronApp.core.Navigation && VeyronApp.core.Navigation.setup) VeyronApp.core.Navigation.setup();
        checkAndSetInitialScreen();
        document.addEventListener('visibilitychange', function() {
            if (document.hidden && VeyronApp.ui && VeyronApp.ui.pauseVideo) VeyronApp.ui.pauseVideo();
        });
    }

    VeyronApp.appHandlers = { init: init };
})();
