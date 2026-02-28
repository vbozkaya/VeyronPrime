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
                VeyronApp.ui.showMoviesChannels();
                break;
            case 'series':
                VeyronApp.ui.showSeriesChannels();
                break;
            case 'favorites':
                if (VeyronApp.appModals && VeyronApp.appModals.showInfoModal) {
                    VeyronApp.appModals.showInfoModal('Bilgi', '<div class="info-row"><span>Yakında.</span></div>');
                }
                break;
            default:
                break;
        }
    };

    var loader = VeyronApp.ui.contentLoader;

    /**
     * Landing Güncelle: sabit device id/key ile backend'den içerik dener; başarılıysa ana menüye geçer.
     */
    VeyronApp.ui.landingUpdate = function() {
        var errEl = document.getElementById('landingError');
        if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
        var deviceId = (VeyronApp.State.deviceId || '').trim();
        var deviceKey = (VeyronApp.State.deviceKey || '').trim();
        if (!deviceId || !deviceKey) {
            if (errEl) {
                errEl.textContent = 'Cihaz bilgisi yok. Lütfen uygulamayı yeniden başlatın.';
                errEl.style.display = 'block';
            }
            return;
        }
        VeyronApp.ui.showLoading();
        var registerPromise = (VeyronApp.appHandlers && VeyronApp.appHandlers.registerDeviceWithBackend)
            ? VeyronApp.appHandlers.registerDeviceWithBackend()
            : Promise.resolve();
        registerPromise.then(function() {
            return loader && loader.loadContentFromBackend ? loader.loadContentFromBackend() : Promise.resolve({ ok: false, reason: 'no_base' });
        }).then(function(result) {
            var res = result && typeof result.ok !== 'undefined' ? result : { ok: !!result, reason: 'network' };
            if (res.ok) {
                VeyronApp.ui.renderCategories();
                VeyronApp.ui.renderChannels();
                VeyronApp.ui.switchScreen('homeMenu');
                return;
            }
            if (!errEl) return;
            var msg = 'İçerik alınamadı.';
            if (res.reason === 'no_playlist') {
                msg = 'Bu cihaz için panelde playlist atanmamış. Panele (veyron-prime.vercel.app) bu ekrandaki Device ID ve Key ile giriş yapıp "Playlist ekle veya güncelle" bölümünden playlist kaydedin.';
            } else if (res.reason === 'network') {
                msg = 'Panele bağlanılamadı. İnternet bağlantınızı ve panel adresini kontrol edin.';
            } else if (res.reason === 'm3u_failed') {
                msg = 'Playlist listesi indirilemedi veya boş. Panelde kaydettiğiniz M3U linkinin erişilebilir olduğundan emin olun.';
            } else if (res.reason === 'no_device') {
                msg = 'Cihaz bilgisi eksik. Uygulamayı yeniden başlatın.';
            } else {
                msg = 'Panelden cihazı kaydedin ve playlist atayın.';
            }
            errEl.textContent = msg;
            errEl.style.display = 'block';
        }).catch(function(error) {
            if (errEl) {
                errEl.textContent = 'Hata: ' + (error && error.message ? error.message : 'Bağlantı hatası');
                errEl.style.display = 'block';
            }
        }).finally(function() {
            VeyronApp.ui.hideLoading();
        });
    };

    /**
     * Dizileri gösterir (backend/M3U parse - group Dizi/Series olanlar)
     */
    VeyronApp.ui.showSeriesChannels = function() {
        VeyronApp.State.contentType = 'series';
        VeyronApp.ui.switchScreen('main');
        if (!VeyronApp.State.series || VeyronApp.State.series.length === 0) {
            VeyronApp.ui.showLoading();
            (loader && loader.loadContentFromBackend ? loader.loadContentFromBackend() : Promise.resolve({ ok: false })).then(function(result) {
                var usedBackend = result && result.ok;
                if (usedBackend && VeyronApp.State.series && VeyronApp.State.series.length > 0) {
                    VeyronApp.ui.renderSeriesCategories();
                    VeyronApp.ui.renderSeries();
                    var t = document.getElementById('mainScreenTitle');
                    if (t) t.textContent = 'Diziler';
                    return;
                }
                if (!VeyronApp.State.series || VeyronApp.State.series.length === 0) {
                    VeyronApp.ui.showError('Dizi bulunamadı. M3U playlist\'te group-title="Dizi" veya "Series" olan kayıtlar dizi olarak gösterilir.');
                    VeyronApp.ui.switchScreen('homeMenu');
                }
            }).finally(function() { VeyronApp.ui.hideLoading(); });
        } else {
            VeyronApp.ui.renderSeriesCategories();
            VeyronApp.ui.renderSeries();
            var t = document.getElementById('mainScreenTitle');
            if (t) t.textContent = 'Diziler';
        }
    };

    /**
     * Filmleri gösterir (backend/M3U parse - group Film/VOD olanlar)
     */
    VeyronApp.ui.showMoviesChannels = function() {
        VeyronApp.State.contentType = 'movies';
        VeyronApp.ui.switchScreen('main');
        if (!VeyronApp.State.movies || VeyronApp.State.movies.length === 0) {
            VeyronApp.ui.showLoading();
            (loader && loader.loadContentFromBackend ? loader.loadContentFromBackend() : Promise.resolve({ ok: false })).then(function(result) {
                var usedBackend = result && result.ok;
                if (usedBackend && VeyronApp.State.movies && VeyronApp.State.movies.length > 0) {
                    VeyronApp.ui.renderMovieCategories();
                    VeyronApp.ui.renderMovies();
                    var t = document.getElementById('mainScreenTitle');
                    if (t) t.textContent = 'Filmler';
                    return;
                }
                if (!VeyronApp.State.movies || VeyronApp.State.movies.length === 0) {
                    VeyronApp.ui.showError('Film bulunamadı. M3U playlist\'te group-title="Film" veya "VOD" olan kayıtlar film olarak gösterilir.');
                    VeyronApp.ui.switchScreen('homeMenu');
                }
            }).finally(function() { VeyronApp.ui.hideLoading(); });
        } else {
            VeyronApp.ui.renderMovieCategories();
            VeyronApp.ui.renderMovies();
            var t = document.getElementById('mainScreenTitle');
            if (t) t.textContent = 'Filmler';
        }
    };

    /**
     * Canlı kanalları gösterir (önce backend, yoksa IPTV)
     */
    VeyronApp.ui.showLiveChannels = function() {
        VeyronApp.State.contentType = 'live';
        VeyronApp.ui.switchScreen('main');
        if (VeyronApp.State.categories.length === 0 || VeyronApp.State.channels.length === 0) {
            VeyronApp.ui.showLoading();
            (loader && loader.loadContentFromBackend ? loader.loadContentFromBackend() : Promise.resolve({ ok: false })).then(function(result) {
                var usedBackend = result && result.ok;
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
                return (loader && loader.loadContentFromIptv ? loader.loadContentFromIptv() : Promise.resolve()).then(function() {
                    VeyronApp.ui.renderCategories();
                    VeyronApp.ui.renderChannels();
                    var titleEl = document.getElementById('mainScreenTitle');
                    if (titleEl) titleEl.textContent = 'Canlı Yayınlar';
                });
            }).catch(function(error) {
                if (VeyronApp.State.apiUrl && VeyronApp.State.username) {
                    return (loader && loader.loadContentFromIptv ? loader.loadContentFromIptv() : Promise.resolve()).then(function() {
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
})();
