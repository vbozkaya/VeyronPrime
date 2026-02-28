/**
 * Veyron Prime Player - Navigasyon Yardımcıları (Home, Manuel Kurulum, Kategoriler)
 * nav_handlers.js 200 satır limiti için ayrıldı.
 */

(function() {
    'use strict';

    window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };
    VeyronApp.core = VeyronApp.core || {};
    VeyronApp.core.NavNavigate = VeyronApp.core.NavNavigate || {};

    var C = window.VeyronApp.Constants;
    var focusDelayMs = (C && C.FOCUS_DELAY_MS) || 100;

    function getHomeMenuFocusables() {
        var header = document.querySelector('.home-menu-buttons');
        var btns = header ? Array.from(header.querySelectorAll('button')) : [];
        var menuItems = Array.from(document.querySelectorAll('.menu-item'));
        return btns.concat(menuItems);
    }

    function navigateHomeMenu(nav, direction) {
        var list = getHomeMenuFocusables();
        if (list.length === 0) return;
        var currentIndex = -1;
        var active = document.activeElement;
        list.forEach(function(el, i) { if (el === active) currentIndex = i; });
        if (currentIndex === -1) {
            list[0].focus();
            return;
        }
        var nextIndex;
        if (direction === 'left') {
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) nextIndex = list.length - 1;
        } else if (direction === 'right') {
            nextIndex = currentIndex + 1;
            if (nextIndex >= list.length) nextIndex = 0;
        } else if (direction === 'up') {
            var headerCount = (document.querySelector('.home-menu-buttons') && document.querySelectorAll('.home-menu-buttons button').length) || 3;
            if (currentIndex >= headerCount) nextIndex = headerCount - 1;
            else nextIndex = list.length - 1;
        } else {
            var headerCount = (document.querySelector('.home-menu-buttons') && document.querySelectorAll('.home-menu-buttons button').length) || 3;
            if (currentIndex < headerCount) nextIndex = headerCount;
            else nextIndex = 0;
        }
        if (list[nextIndex]) list[nextIndex].focus();
    }

    function navigateCategories(nav, direction) {
        var categories = Array.from(document.querySelectorAll('.category-item'));
        if (categories.length === 0) return;
        var currentIndex = -1;
        categories.forEach(function(item, index) {
            if (item === document.activeElement) currentIndex = index;
        });
        if (currentIndex === -1) {
            categories[0].focus();
            return;
        }
        var newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = 0;
        else if (newIndex >= categories.length) newIndex = categories.length - 1;
        if (categories[newIndex]) {
            if (VeyronApp.core.SpatialNav && VeyronApp.core.SpatialNav.isElementVisible(categories[newIndex])) {
                categories[newIndex].focus();
            } else {
                categories[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                setTimeout(function() { categories[newIndex].focus(); }, focusDelayMs);
            }
        }
    }

    function getManualSetupFocusables() {
        var screen = document.getElementById('manualSetupScreen');
        if (!screen || !screen.classList.contains('active')) return [];
        var form = document.getElementById('loginForm');
        if (!form) return [];
        return Array.from(form.querySelectorAll('input:not([type="hidden"]), button'));
    }

    function navigateManualSetup(nav, direction) {
        var list = getManualSetupFocusables();
        if (list.length === 0) return;
        var currentIndex = -1;
        var active = document.activeElement;
        list.forEach(function(el, i) { if (el === active) currentIndex = i; });
        if (currentIndex === -1) {
            list[0].focus();
            return;
        }
        var nextIndex;
        if (direction === 'up' || direction === 'left') {
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) nextIndex = list.length - 1;
        } else {
            nextIndex = currentIndex + 1;
            if (nextIndex >= list.length) nextIndex = 0;
        }
        if (list[nextIndex]) list[nextIndex].focus();
    }

    VeyronApp.core.NavNavigate.getHomeMenuFocusables = getHomeMenuFocusables;
    VeyronApp.core.NavNavigate.navigateHomeMenu = navigateHomeMenu;
    VeyronApp.core.NavNavigate.navigateCategories = navigateCategories;
    VeyronApp.core.NavNavigate.getManualSetupFocusables = getManualSetupFocusables;
    VeyronApp.core.NavNavigate.navigateManualSetup = navigateManualSetup;
})();
