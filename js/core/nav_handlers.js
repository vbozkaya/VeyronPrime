/**
 * Veyron Prime Player - Navigasyon Tuş İşleyicileri
 * Ok/Enter/Return; detay nav_handlers_navigate.js ve nav_handlers_main.js'de (200 satır limiti).
 */

(function() {
    'use strict';

    window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };
    VeyronApp.core = VeyronApp.core || {};

    var NavNavigate = VeyronApp.core.NavNavigate;
    var NavMain = VeyronApp.core.NavMain;
    var C = window.VeyronApp.Constants;
    var focusDelayMs = (C && C.FOCUS_DELAY_MS) || 100;

    function handleKeyLeft(nav, e) {
        if (VeyronApp.State.currentScreen === 'manualSetup') {
            if (NavNavigate && NavNavigate.navigateManualSetup) NavNavigate.navigateManualSetup(nav, 'left');
            return;
        }
        if (VeyronApp.State.currentScreen === 'homeMenu') {
            if (NavNavigate && NavNavigate.navigateHomeMenu) NavNavigate.navigateHomeMenu(nav, 'left');
        } else if (VeyronApp.State.currentScreen === 'main') {
            if (NavMain && NavMain.navigateMainLeft) NavMain.navigateMainLeft(document.activeElement, nav);
        }
    }

    function handleKeyRight(nav, e) {
        if (VeyronApp.State.currentScreen === 'manualSetup') {
            if (NavNavigate && NavNavigate.navigateManualSetup) NavNavigate.navigateManualSetup(nav, 'right');
            return;
        }
        if (VeyronApp.State.currentScreen === 'homeMenu') {
            if (NavNavigate && NavNavigate.navigateHomeMenu) NavNavigate.navigateHomeMenu(nav, 'right');
        } else if (VeyronApp.State.currentScreen === 'main') {
            if (NavMain && NavMain.navigateMainRight) NavMain.navigateMainRight(document.activeElement, nav);
        }
    }

    function handleKeyUp(nav, e) {
        if (VeyronApp.State.currentScreen === 'manualSetup') {
            if (NavNavigate && NavNavigate.navigateManualSetup) NavNavigate.navigateManualSetup(nav, 'up');
            return;
        }
        if (VeyronApp.State.currentScreen === 'homeMenu') {
            if (NavNavigate && NavNavigate.navigateHomeMenu) NavNavigate.navigateHomeMenu(nav, 'up');
        } else if (VeyronApp.State.currentScreen === 'main') {
            if (NavMain && NavMain.navigateMainUp) NavMain.navigateMainUp(document.activeElement, nav);
        }
    }

    function handleKeyDown(nav, e) {
        if (VeyronApp.State.currentScreen === 'manualSetup') {
            if (NavNavigate && NavNavigate.navigateManualSetup) NavNavigate.navigateManualSetup(nav, 'down');
            return;
        }
        if (VeyronApp.State.currentScreen === 'homeMenu') {
            if (NavNavigate && NavNavigate.navigateHomeMenu) NavNavigate.navigateHomeMenu(nav, 'down');
        } else if (VeyronApp.State.currentScreen === 'main') {
            if (NavMain && NavMain.navigateMainDown) NavMain.navigateMainDown(document.activeElement, nav);
        }
    }

    function handleKeyEnter(nav) {
        if (VeyronApp.State.currentScreen === 'landing') {
            var landingUpdateBtn = document.getElementById('landingUpdateBtn');
            if (landingUpdateBtn) landingUpdateBtn.click();
        } else if (VeyronApp.State.currentScreen === 'manualSetup') {
            var loginForm = document.getElementById('loginForm');
            if (loginForm) loginForm.dispatchEvent(new Event('submit'));
        } else if (VeyronApp.State.currentScreen === 'homeMenu') {
            var active = document.activeElement;
            if (active && (active.classList.contains('menu-item') || active.closest('.home-menu-buttons'))) {
                active.click();
            }
        } else if (VeyronApp.State.currentScreen === 'main') {
            var activeElement = document.activeElement;
            var backToHomeBtn = document.getElementById('backToHomeBtn');
            if (activeElement && activeElement === backToHomeBtn) {
                activeElement.click();
                return;
            }
            if (activeElement && activeElement.classList.contains('channel-card')) {
                var channelId = activeElement.dataset.channelId;
                var channel = VeyronApp.State.channels.find(function(c) {
                    return (c.stream_id || c.id) == channelId;
                });
                if (channel) {
                    nav.lastChannelIndex = Array.from(document.querySelectorAll('.channel-card')).indexOf(activeElement);
                    VeyronApp.ui.playChannel(channel);
                }
            } else if (activeElement && activeElement.classList.contains('category-item')) {
                var categoryId = activeElement.dataset.categoryId;
                VeyronApp.ui.filterChannelsByCategory(categoryId);
                setTimeout(function() {
                    var firstChannel = document.querySelector('.channel-card');
                    if (firstChannel) {
                        firstChannel.focus();
                        nav.lastChannelIndex = 0;
                    }
                }, focusDelayMs);
            }
        }
    }

    function handleKeyReturn(nav) {
        if (VeyronApp.State.currentScreen === 'player') {
            if (VeyronApp.player && typeof VeyronApp.player.stop === 'function') {
                VeyronApp.player.stop();
            }
            var previousScreen = nav.popScreen();
            if (previousScreen) {
                VeyronApp.ui.switchScreen(previousScreen, { isBack: true });
            } else {
                VeyronApp.ui.handleBackToChannels();
            }
            return;
        }
        if (VeyronApp.State.currentScreen === 'main') {
            var prev = nav.popScreen();
            if (prev) {
                VeyronApp.ui.switchScreen(prev, { isBack: true });
            } else {
                VeyronApp.ui.switchScreen('homeMenu', { isBack: true });
            }
            return;
        }
        var previousScreen = nav.popScreen();
        if (previousScreen) {
            VeyronApp.ui.switchScreen(previousScreen, { isBack: true });
        } else {
            if (typeof tizen !== 'undefined' && tizen.application) {
                tizen.application.getCurrentApplication().exit();
            }
        }
    }

    VeyronApp.core.NavHandlers = {
        handleKeyLeft: handleKeyLeft,
        handleKeyRight: handleKeyRight,
        handleKeyUp: handleKeyUp,
        handleKeyDown: handleKeyDown,
        handleKeyEnter: handleKeyEnter,
        handleKeyReturn: handleKeyReturn
    };
})();
