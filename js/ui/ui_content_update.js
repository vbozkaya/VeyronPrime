/**
 * Veyron Prime Player - Veri güncelleme (Güncelle butonu)
 * .cursorrules Rule 2: max 200 satır; ui_content.js'den ayrıldı.
 */
(function() {
    'use strict';
    window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };
    var C = window.VeyronApp.Constants;

    function getLoader() {
        return VeyronApp.ui.contentLoader;
    }

    function refreshMainScreen() {
        if (VeyronApp.State.currentScreen !== 'main') return;
        if (VeyronApp.State.contentType === 'movies') {
            VeyronApp.ui.renderMovieCategories();
            VeyronApp.ui.renderMovies();
        } else if (VeyronApp.State.contentType === 'series') {
            VeyronApp.ui.renderSeriesCategories();
            VeyronApp.ui.renderSeries();
        } else {
            VeyronApp.ui.renderCategories();
            VeyronApp.ui.renderChannels();
        }
    }

    VeyronApp.ui.updateData = function() {
        var updateBtn = document.getElementById('updateBtn');
        if (updateBtn) {
            updateBtn.classList.add('updating');
            updateBtn.disabled = true;
        }
        VeyronApp.ui.showLoading();
        var loader = getLoader();
        (loader && loader.loadContentFromBackend ? loader.loadContentFromBackend() : Promise.resolve({ ok: false })).then(function(result) {
            var usedBackend = result && result.ok;
            if (usedBackend) {
                refreshMainScreen();
                return;
            }
            if (!VeyronApp.State.apiUrl || !VeyronApp.State.username) return;
            return (loader && loader.loadContentFromIptv ? loader.loadContentFromIptv() : Promise.resolve());
        }).then(function() {
            refreshMainScreen();
            var channelInfo = document.getElementById('channelInfo');
            if (channelInfo) {
                var originalText = channelInfo.textContent;
                channelInfo.textContent = 'Veriler güncellendi!';
                channelInfo.classList.remove('error');
                channelInfo.style.color = '#4CAF50';
                setTimeout(function() {
                    channelInfo.textContent = originalText;
                    channelInfo.style.color = '';
                }, (C && C.UI_MESSAGE_ERROR_DURATION_MS) || 2000);
            }
        }).catch(function(error) {
            if (typeof console !== 'undefined' && console.warn) console.warn('[Veyron] updateData hata:', error && error.message);
            var channelInfo = document.getElementById('channelInfo');
            if (channelInfo) {
                channelInfo.textContent = 'Güncelleme hatası: ' + (error && error.message ? error.message : 'Bilinmeyen hata');
                channelInfo.classList.add('error');
                channelInfo.style.color = (C && C.COLOR_ERROR) || '#f44336';
                setTimeout(function() {
                    channelInfo.classList.remove('error');
                    channelInfo.style.color = '';
                    if (VeyronApp.State.currentChannel) {
                        channelInfo.textContent = VeyronApp.State.currentChannel.name || 'Bilinmeyen Kanal';
                    }
                }, (C && C.UI_HIDE_ERROR_DELAY_MS) || 3000);
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
