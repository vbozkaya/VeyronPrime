/**
 * Veyron Prime Player - Navigasyon Yönetimi
 * Stack, setup ve tuş delegasyonu (detay nav_handlers.js ve nav_spatial.js'de)
 */

(function() {
    'use strict';

    window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };
    VeyronApp.core = VeyronApp.core || {};

    var nav = {
        navigationStack: [],
        lastChannelIndex: 0,
        gridColumns: 3,

        pushScreen: function(screenName) {
            if (VeyronApp.State.currentScreen && VeyronApp.State.currentScreen !== screenName) {
                this.navigationStack.push(VeyronApp.State.currentScreen);
            }
        },

        popScreen: function() {
            if (this.navigationStack.length > 0) {
                return this.navigationStack.pop();
            }
            return null;
        },

        clearStack: function() {
            this.navigationStack = [];
        },

        calculateGridColumns: function() {
            this.gridColumns = 3;
        },

        /** Ekran açıldığında ilk odaklanacak öğeyi ayarlar (focus logic nav_manager'da) */
        setInitialFocus: function(screenName) {
            setTimeout(function() {
                var targetScreen = document.getElementById(screenName + 'Screen');
                if (!targetScreen) return;
                var el = null;
                if (screenName === 'homeMenu') {
                    el = targetScreen.querySelector('.menu-item');
                } else if (screenName === 'main') {
                    el = targetScreen.querySelector('.category-item');
                } else if (screenName === 'userManagement') {
                    el = targetScreen.querySelector('#userManagementBackBtn');
                } else {
                    el = targetScreen.querySelector('input, button');
                }
                if (el) el.focus();
            }, 100);
        },

        setup: function() {
            var self = this;
            document.addEventListener('keydown', function(e) {
                var infoModal = document.getElementById('infoModal');
                var confirmModal = document.getElementById('confirmModal');
                if ((infoModal && infoModal.getAttribute('aria-hidden') === 'false') || (confirmModal && confirmModal.getAttribute('aria-hidden') === 'false')) {
                    return;
                }
                switch (e.keyCode) {
                    case 37:
                        e.preventDefault();
                        if (VeyronApp.core.NavHandlers) VeyronApp.core.NavHandlers.handleKeyLeft(self, e);
                        break;
                    case 38:
                        e.preventDefault();
                        if (VeyronApp.core.NavHandlers) VeyronApp.core.NavHandlers.handleKeyUp(self, e);
                        break;
                    case 39:
                        e.preventDefault();
                        if (VeyronApp.core.NavHandlers) VeyronApp.core.NavHandlers.handleKeyRight(self, e);
                        break;
                    case 40:
                        e.preventDefault();
                        if (VeyronApp.core.NavHandlers) VeyronApp.core.NavHandlers.handleKeyDown(self, e);
                        break;
                    case 13:
                        e.preventDefault();
                        if (VeyronApp.core.NavHandlers) VeyronApp.core.NavHandlers.handleKeyEnter(self);
                        break;
                    case 10009:
                        e.preventDefault();
                        if (VeyronApp.core.NavHandlers) VeyronApp.core.NavHandlers.handleKeyReturn(self);
                        break;
                }
            });
            this.calculateGridColumns();
            window.addEventListener('resize', function() {
                self.calculateGridColumns();
            });
        }
    };

    VeyronApp.core.Navigation = nav;
})();
