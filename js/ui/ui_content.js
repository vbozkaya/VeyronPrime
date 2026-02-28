/**
 * Veyron Prime Player - UI İçerik (Canlı/Veri güncelleme/Menü)
 * 300 satır limiti için ui_manager'dan ayrıldı
 */

(function() {
    'use strict';

    window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };

    /**
     * Menü seçimini işler
     */
    VeyronApp.ui.handleMenuSelection = function(menuType) {
        switch (menuType) {
            case 'live':
                VeyronApp.ui.showLiveChannels();
                break;
            case 'movies':
            case 'series':
            case 'favorites':
                if (VeyronApp.appModals && VeyronApp.appModals.showInfoModal) {
                    VeyronApp.appModals.showInfoModal('Bilgi', '<div class="info-row"><span>Bu bir demodur, şu an çalışmaz.</span></div>');
                }
                break;
            default:
                break;
        }
    };

    function loadContentFromBackend() {
        if (!VeyronApp.backend || !VeyronApp.device) return Promise.resolve(false);
        var deviceId = (VeyronApp.device.getDeviceId() || '').trim();
        var deviceKey = (VeyronApp.device.getDeviceKey() || '').trim();
        if (!deviceId) return Promise.resolve(false);
        if (!VeyronApp.api.getContent || !VeyronApp.api.mapBackendContentToState) return Promise.resolve(false);
        function tryGetContent() {
            return VeyronApp.api.getContent(deviceId).then(function(content) {
                if (content.live && content.live.length > 0) {
                    VeyronApp.api.mapBackendContentToState(content);
                    return true;
                }
                return false;
            });
        }
        if (VeyronApp.api.checkDevice) {
            return VeyronApp.api.checkDevice(deviceId, deviceKey)
                .then(tryGetContent)
                .catch(function() { return tryGetContent(); });
        }
        return tryGetContent();
    }

    function loadContentFromIptv() {
        return VeyronApp.api.loadCategories().then(function() {
            return VeyronApp.api.loadChannels();
        });
    }

    /**
     * Landing ekranındaki Güncelle butonu: Supabase'den içerik çeker, başarılıysa ana listeye gider.
     */
    VeyronApp.ui.landingUpdate = function() {
        var errEl = document.getElementById('landingError');
        if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
        VeyronApp.ui.showLoading();
        loadContentFromBackend().then(function(usedBackend) {
            if (usedBackend) {
                VeyronApp.ui.switchScreen('main');
                VeyronApp.ui.renderCategories();
                VeyronApp.ui.renderChannels();
                var t = document.getElementById('mainScreenTitle');
                if (t) t.textContent = 'Canlı Yayınlar';
                return;
            }
            if (errEl) {
                var hasDeviceId = (VeyronApp.device && (VeyronApp.device.getDeviceId() || '').trim());
                errEl.textContent = hasDeviceId
                    ? 'İçerik yok. Panelden cihazı kaydedin ve M3U playlist ekleyin.'
                    : 'Cihaz kimliği alınamadı. Lütfen uygulamayı yeniden başlatın.';
                errEl.style.display = 'block';
            }
        }).catch(function(error) {
            if (errEl) {
                var msg = (error && error.message) ? error.message : 'Bağlantı hatası';
                if (/missing device id/i.test(msg)) {
                    msg = 'Cihaz kimliği alınamadı. Lütfen uygulamayı yeniden başlatın.';
                }
                errEl.textContent = 'Güncelleme hatası: ' + msg;
                errEl.style.display = 'block';
            }
        }).finally(function() {
            VeyronApp.ui.hideLoading();
        });
    };

    /**
     * Canlı kanalları gösterir (önce backend, yoksa IPTV)
     */
    VeyronApp.ui.showLiveChannels = function() {
        VeyronApp.ui.switchScreen('main');
        if (VeyronApp.State.categories.length === 0 || VeyronApp.State.channels.length === 0) {
            VeyronApp.ui.showLoading();
            loadContentFromBackend().then(function(usedBackend) {
                if (usedBackend) {
                    VeyronApp.ui.renderCategories();
                    VeyronApp.ui.renderChannels();
                    var titleElement = document.getElementById('mainScreenTitle');
                    if (titleElement) titleElement.textContent = 'Canlı Yayınlar';
                    return;
                }
                var hasIptv = VeyronApp.State.apiUrl && VeyronApp.State.username;
                if (!hasIptv) {
                    VeyronApp.ui.showError('İçerik yok. Panelden cihazı kaydedin veya Manuel Kurulum ile giriş yapın.');
                    VeyronApp.ui.switchScreen('homeMenu');
                    return;
                }
                return loadContentFromIptv().then(function() {
                    VeyronApp.ui.renderCategories();
                    VeyronApp.ui.renderChannels();
                    var titleEl = document.getElementById('mainScreenTitle');
                    if (titleEl) titleEl.textContent = 'Canlı Yayınlar';
                });
            }).catch(function(error) {
                if (VeyronApp.State.apiUrl && VeyronApp.State.username) {
                    return loadContentFromIptv().then(function() {
                        VeyronApp.ui.renderCategories();
                        VeyronApp.ui.renderChannels();
                        var t = document.getElementById('mainScreenTitle');
                        if (t) t.textContent = 'Canlı Yayınlar';
                    }).catch(function(e) {
                        VeyronApp.ui.showError('Kanallar yüklenirken hata: ' + (e && e.message ? e.message : 'Bilinmeyen'));
                        VeyronApp.ui.switchScreen('homeMenu');
                    });
                } else {
                    VeyronApp.ui.showError('Kanallar yüklenirken hata: ' + (error && error.message ? error.message : 'Bilinmeyen'));
                    VeyronApp.ui.switchScreen('homeMenu');
                }
            }).finally(function() {
                VeyronApp.ui.hideLoading();
            });
        } else {
            VeyronApp.ui.renderCategories();
            VeyronApp.ui.renderChannels();
            var titleEl = document.getElementById('mainScreenTitle');
            if (titleEl) titleEl.textContent = 'Canlı Yayınlar';
        }
    };

    /**
     * IPTV/Backend verilerini günceller
     */
    VeyronApp.ui.updateData = function() {
        var updateBtn = document.getElementById('updateBtn');
        if (updateBtn) {
            updateBtn.classList.add('updating');
            updateBtn.disabled = true;
        }
        VeyronApp.ui.showLoading();
        loadContentFromBackend().then(function(usedBackend) {
            if (usedBackend) {
                if (VeyronApp.State.currentScreen === 'main') {
                    VeyronApp.ui.renderCategories();
                    VeyronApp.ui.renderChannels();
                }
                return;
            }
            if (!VeyronApp.State.apiUrl || !VeyronApp.State.username) return;
            return loadContentFromIptv();
        }).then(function() {
            if (VeyronApp.State.currentScreen === 'main') {
                VeyronApp.ui.renderCategories();
                VeyronApp.ui.renderChannels();
            }
            var channelInfo = document.getElementById('channelInfo');
            if (channelInfo) {
                var originalText = channelInfo.textContent;
                channelInfo.textContent = 'Veriler güncellendi!';
                channelInfo.classList.remove('error');
                channelInfo.style.color = '#4CAF50';
                setTimeout(function() {
                    channelInfo.textContent = originalText;
                    channelInfo.style.color = '';
                }, (window.VeyronApp.Constants && window.VeyronApp.Constants.UI_MESSAGE_ERROR_DURATION_MS) || 2000);
            }
        }).catch(function(error) {
            var channelInfo = document.getElementById('channelInfo');
            if (channelInfo) {
                channelInfo.textContent = 'Güncelleme hatası: ' + (error && error.message ? error.message : 'Bilinmeyen hata');
                channelInfo.classList.add('error');
                channelInfo.style.color = '#f44336';
                setTimeout(function() {
                    channelInfo.classList.remove('error');
                    channelInfo.style.color = '';
                    if (VeyronApp.State.currentChannel) {
                        channelInfo.textContent = VeyronApp.State.currentChannel.name || 'Bilinmeyen Kanal';
                    }
                }, (window.VeyronApp.Constants && window.VeyronApp.Constants.UI_HIDE_ERROR_DELAY_MS) || 3000);
            }
        }).finally(function() {
            VeyronApp.ui.hideLoading();
            if (updateBtn) {
                updateBtn.classList.remove('updating');
                updateBtn.disabled = false;
            }
        });
    };
})();
