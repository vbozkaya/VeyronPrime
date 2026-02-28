/**
 * Veyron Prime Player - Spatial Navigasyon Yardımcıları
 * Kanal grid'inde "en yakın komşu" odak navigasyonu (300 satır limiti için nav_manager'dan ayrıldı)
 */

(function() {
    'use strict';

    window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };
    VeyronApp.core = VeyronApp.core || {};

    /**
     * Bir elementin görünür olup olmadığını kontrol eder
     * @param {HTMLElement} element - Kontrol edilecek element
     * @returns {boolean} - Element görünür mü?
     */
    function isElementVisible(element) {
        if (!element) return false;
        var rect = element.getBoundingClientRect();
        var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        var viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= viewportHeight &&
            rect.right <= viewportWidth
        );
    }

    /**
     * Spatial navigasyon: Koordinat bazlı en yakın elemanı bulur
     * @param {HTMLElement} currentElement - Mevcut odaklanmış element
     * @param {string} direction - Yön: 'left', 'right', 'up', 'down'
     * @param {number} gridColumns - Grid sütun sayısı (fallback için)
     * @returns {HTMLElement|null} - En yakın element veya null
     */
    function findNearestElement(currentElement, direction, gridColumns) {
        if (!currentElement) return null;
        var channels = Array.from(document.querySelectorAll('.channel-card'));
        if (channels.length === 0) return null;

        var currentRect = currentElement.getBoundingClientRect();
        var currentCenterX = currentRect.left + currentRect.width / 2;
        var currentCenterY = currentRect.top + currentRect.height / 2;
        var bestMatch = null;
        var bestDistance = Infinity;
        var tolerance = 50;
        var cols = gridColumns || 3;

        channels.forEach(function(channel) {
            if (channel === currentElement) return;
            var rect = channel.getBoundingClientRect();
            var centerX = rect.left + rect.width / 2;
            var centerY = rect.top + rect.height / 2;
            var isCandidate = false;
            var distance = 0;

            switch (direction) {
                case 'left':
                    if (centerX < currentCenterX && Math.abs(centerY - currentCenterY) < tolerance) {
                        isCandidate = true;
                        distance = Math.abs(centerX - currentCenterX) + Math.abs(centerY - currentCenterY) * 0.1;
                    }
                    break;
                case 'right':
                    if (centerX > currentCenterX && Math.abs(centerY - currentCenterY) < tolerance) {
                        isCandidate = true;
                        distance = Math.abs(centerX - currentCenterX) + Math.abs(centerY - currentCenterY) * 0.1;
                    }
                    break;
                case 'up':
                    if (centerY < currentCenterY && Math.abs(centerX - currentCenterX) < tolerance) {
                        isCandidate = true;
                        distance = Math.abs(centerY - currentCenterY) + Math.abs(centerX - currentCenterX) * 0.1;
                    }
                    break;
                case 'down':
                    if (centerY > currentCenterY && Math.abs(centerX - currentCenterX) < tolerance) {
                        isCandidate = true;
                        distance = Math.abs(centerY - currentCenterY) + Math.abs(centerX - currentCenterX) * 0.1;
                    }
                    break;
            }

            if (isCandidate && distance < bestDistance) {
                bestDistance = distance;
                bestMatch = channel;
            }
        });

        if (!bestMatch) {
            var currentIndex = channels.indexOf(currentElement);
            if (currentIndex === -1) return null;
            var newIndex = -1;
            switch (direction) {
                case 'left':
                    newIndex = currentIndex - 1;
                    if (newIndex >= 0 && (newIndex % cols) < (currentIndex % cols)) {
                        return channels[newIndex];
                    }
                    break;
                case 'right':
                    newIndex = currentIndex + 1;
                    if (newIndex < channels.length && (newIndex % cols) > (currentIndex % cols)) {
                        return channels[newIndex];
                    }
                    break;
                case 'up':
                    newIndex = currentIndex - cols;
                    if (newIndex >= 0) return channels[newIndex];
                    break;
                case 'down':
                    newIndex = currentIndex + cols;
                    if (newIndex < channels.length) return channels[newIndex];
                    break;
            }
        }
        return bestMatch;
    }

    VeyronApp.core.SpatialNav = {
        isElementVisible: isElementVisible,
        findNearestElement: findNearestElement
    };
})();
