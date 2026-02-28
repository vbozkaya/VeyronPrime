/**
 * Veyron Prime Player - Ana Ekran (Kategori/Kanal) Navigasyonu
 * nav_handlers.js 200 satır limiti için ayrıldı.
 */

(function() {
    'use strict';

    window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };
    VeyronApp.core = VeyronApp.core || {};
    VeyronApp.core.NavMain = VeyronApp.core.NavMain || {};

    var C = window.VeyronApp.Constants;
    var focusDelayMs = (C && C.FOCUS_DELAY_MS) || 100;

    function navigateMainLeft(activeElement, nav) {
        var backToHomeBtn = document.getElementById('backToHomeBtn');
        if (activeElement && activeElement === backToHomeBtn) return;
        if (activeElement && activeElement.classList.contains('channel-card')) {
            var channels = Array.from(document.querySelectorAll('.channel-card'));
            var currentIndex = channels.indexOf(activeElement);
            if (currentIndex === -1) return;
            var columnIndex = currentIndex % nav.gridColumns;
            if (columnIndex === 0) {
                var categories = Array.from(document.querySelectorAll('.category-item'));
                if (categories.length > 0) {
                    var activeCategory = document.querySelector('.category-item.active');
                    (activeCategory || categories[0]).focus();
                }
            } else {
                var newIndex = currentIndex - 1;
                if (channels[newIndex]) channels[newIndex].focus();
            }
        } else if (activeElement && activeElement.classList.contains('category-item')) {
            var categories = Array.from(document.querySelectorAll('.category-item'));
            var catIndex = categories.indexOf(activeElement);
            if (catIndex === 0 && backToHomeBtn) {
                backToHomeBtn.focus();
            } else {
                if (VeyronApp.core.NavNavigate && VeyronApp.core.NavNavigate.navigateCategories) {
                    VeyronApp.core.NavNavigate.navigateCategories(nav, -1);
                }
            }
        }
    }

    function navigateMainRight(activeElement, nav) {
        var backToHomeBtn = document.getElementById('backToHomeBtn');
        if (activeElement && activeElement === backToHomeBtn) {
            var categories = Array.from(document.querySelectorAll('.category-item'));
            if (categories.length > 0) categories[0].focus();
            return;
        }
        if (activeElement && activeElement.classList.contains('category-item')) {
            var channels = Array.from(document.querySelectorAll('.channel-card'));
            if (channels.length > 0) {
                var targetIndex = Math.min(nav.lastChannelIndex, channels.length - 1);
                channels[targetIndex].focus();
                nav.lastChannelIndex = targetIndex;
            }
        } else if (activeElement && activeElement.classList.contains('channel-card')) {
            var target = VeyronApp.core.SpatialNav && VeyronApp.core.SpatialNav.findNearestElement(activeElement, 'right', nav.gridColumns);
            if (target) {
                target.focus();
                nav.lastChannelIndex = Array.from(document.querySelectorAll('.channel-card')).indexOf(target);
            }
        }
    }

    function navigateMainUp(activeElement, nav) {
        var backToHomeBtn = document.getElementById('backToHomeBtn');
        if (activeElement && activeElement === backToHomeBtn) return;
        if (activeElement && activeElement.classList.contains('category-item')) {
            var categories = Array.from(document.querySelectorAll('.category-item'));
            var catIndex = categories.indexOf(activeElement);
            if (catIndex === 0 && backToHomeBtn) {
                backToHomeBtn.focus();
            } else if (VeyronApp.core.NavNavigate && VeyronApp.core.NavNavigate.navigateCategories) {
                VeyronApp.core.NavNavigate.navigateCategories(nav, -1);
            }
        } else if (activeElement && activeElement.classList.contains('channel-card')) {
            var channels = Array.from(document.querySelectorAll('.channel-card'));
            var currentIndex = channels.indexOf(activeElement);
            var inFirstRow = currentIndex >= 0 && currentIndex < nav.gridColumns;
            if (inFirstRow && backToHomeBtn) {
                backToHomeBtn.focus();
                return;
            }
            var target = VeyronApp.core.SpatialNav && VeyronApp.core.SpatialNav.findNearestElement(activeElement, 'up', nav.gridColumns);
            if (target) {
                if (VeyronApp.core.SpatialNav.isElementVisible(target)) {
                    target.focus();
                    nav.lastChannelIndex = Array.from(document.querySelectorAll('.channel-card')).indexOf(target);
                } else {
                    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    setTimeout(function() {
                        target.focus();
                        nav.lastChannelIndex = Array.from(document.querySelectorAll('.channel-card')).indexOf(target);
                    }, focusDelayMs);
                }
            } else if (currentIndex !== -1 && channels[currentIndex % nav.gridColumns]) {
                channels[currentIndex % nav.gridColumns].focus();
                nav.lastChannelIndex = currentIndex % nav.gridColumns;
            }
        }
    }

    function navigateMainDown(activeElement, nav) {
        var backToHomeBtn = document.getElementById('backToHomeBtn');
        if (activeElement && activeElement === backToHomeBtn) {
            var categories = Array.from(document.querySelectorAll('.category-item'));
            if (categories.length > 0) categories[0].focus();
            return;
        }
        if (activeElement && activeElement.classList.contains('category-item')) {
            if (VeyronApp.core.NavNavigate && VeyronApp.core.NavNavigate.navigateCategories) {
                VeyronApp.core.NavNavigate.navigateCategories(nav, 1);
            }
        } else if (activeElement && activeElement.classList.contains('channel-card')) {
            var target = VeyronApp.core.SpatialNav && VeyronApp.core.SpatialNav.findNearestElement(activeElement, 'down', nav.gridColumns);
            if (target) {
                if (VeyronApp.core.SpatialNav.isElementVisible(target)) {
                    target.focus();
                    nav.lastChannelIndex = Array.from(document.querySelectorAll('.channel-card')).indexOf(target);
                } else {
                    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    setTimeout(function() {
                        target.focus();
                        nav.lastChannelIndex = Array.from(document.querySelectorAll('.channel-card')).indexOf(target);
                    }, focusDelayMs);
                }
            } else {
                var channels = Array.from(document.querySelectorAll('.channel-card'));
                var currentIndex = channels.indexOf(activeElement);
                if (currentIndex !== -1) {
                    var lastRowStartIndex = Math.floor((channels.length - 1) / nav.gridColumns) * nav.gridColumns;
                    var targetIndex = Math.min(lastRowStartIndex + (currentIndex % nav.gridColumns), channels.length - 1);
                    if (channels[targetIndex]) {
                        channels[targetIndex].focus();
                        nav.lastChannelIndex = targetIndex;
                    }
                }
            }
        }
    }

    VeyronApp.core.NavMain.navigateMainLeft = navigateMainLeft;
    VeyronApp.core.NavMain.navigateMainRight = navigateMainRight;
    VeyronApp.core.NavMain.navigateMainUp = navigateMainUp;
    VeyronApp.core.NavMain.navigateMainDown = navigateMainDown;
})();
