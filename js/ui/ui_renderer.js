/**
 * Veyron Prime Player - UI Render (Kategori ve Kanal listesi)
 * 300 satır limiti için ui_manager'dan ayrıldı
 */

(function() {
    'use strict';

    window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };

    /**
     * Kategorileri render eder
     */
    VeyronApp.ui.renderCategories = function() {
        var categoryList = document.getElementById('categoryList');
        if (!categoryList) return;
        categoryList.innerHTML = '';
        var allItem = document.createElement('div');
        allItem.className = 'category-item active';
        allItem.textContent = 'Tümü';
        allItem.dataset.categoryId = 'all';
        allItem.tabIndex = 0;
        allItem.addEventListener('click', function() { VeyronApp.ui.filterChannelsByCategory('all'); });
        allItem.addEventListener('keydown', function(e) {
            if (e.keyCode === 13) VeyronApp.ui.filterChannelsByCategory('all');
        });
        categoryList.appendChild(allItem);
        VeyronApp.State.categories.forEach(function(category) {
            var item = document.createElement('div');
            item.className = 'category-item';
            item.textContent = category.category_name || category.name;
            item.dataset.categoryId = category.category_id || category.id;
            item.tabIndex = 0;
            item.addEventListener('click', function() {
                VeyronApp.ui.filterChannelsByCategory(category.category_id || category.id);
            });
            item.addEventListener('keydown', function(e) {
                if (e.keyCode === 13) VeyronApp.ui.filterChannelsByCategory(category.category_id || category.id);
            });
            categoryList.appendChild(item);
        });
        setTimeout(function() {
            var firstCategory = categoryList.querySelector('.category-item');
            if (firstCategory) firstCategory.focus();
        }, 100);
    };

    /**
     * Kanalları render eder
     */
    VeyronApp.ui.renderChannels = function(filteredChannels) {
        var channelGrid = document.getElementById('channelGrid');
        if (!channelGrid) return;
        channelGrid.innerHTML = '';
        var channelsToRender = filteredChannels || VeyronApp.State.channels;
        channelsToRender.forEach(function(channel) {
            var channelCard = document.createElement('div');
            channelCard.className = 'channel-card';
            channelCard.dataset.channelId = channel.stream_id || channel.id;
            channelCard.tabIndex = 0;
            var logoContainer = document.createElement('div');
            logoContainer.style.position = 'relative';
            logoContainer.style.width = '120px';
            logoContainer.style.height = '120px';
            var showPlaceholder = function() {
                if (!logoContainer.querySelector('.logo-placeholder')) {
                    var placeholder = document.createElement('div');
                    placeholder.className = 'logo-placeholder';
                    var displayText = channel.name
                        ? (channel.name.length > 1 ? channel.name.substring(0, 2).toUpperCase() : channel.name.charAt(0).toUpperCase())
                        : '?';
                    placeholder.textContent = displayText;
                    logoContainer.appendChild(placeholder);
                }
            };
            var logoUrl = channel.stream_icon || channel.logo;
            if (logoUrl) {
                var channelLogo = document.createElement('img');
                channelLogo.className = 'channel-logo';
                channelLogo.src = logoUrl;
                channelLogo.alt = channel.name;
                var errorCount = 0;
                channelLogo.onerror = function() {
                    errorCount++;
                    if (errorCount === 1) {
                        var testImg = new Image();
                        testImg.onload = function() { channelLogo.src = 'assets/images/icon.png'; };
                        testImg.onerror = function() {
                            channelLogo.style.display = 'none';
                            showPlaceholder();
                        };
                        testImg.src = 'assets/images/icon.png';
                    } else {
                        channelLogo.style.display = 'none';
                        showPlaceholder();
                    }
                };
                logoContainer.appendChild(channelLogo);
            } else {
                showPlaceholder();
            }
            channelCard.appendChild(logoContainer);
            var channelName = document.createElement('div');
            channelName.className = 'channel-name';
            channelName.textContent = channel.name;
            channelCard.appendChild(channelName);
            channelCard.addEventListener('click', function() { VeyronApp.ui.playChannel(channel); });
            channelGrid.appendChild(channelCard);
        });
    };

    /**
     * Kategorilere göre kanalları filtreler
     */
    VeyronApp.ui.filterChannelsByCategory = function(categoryId) {
        document.querySelectorAll('.category-item').forEach(function(item) {
            item.classList.remove('active');
            if (item.dataset.categoryId === categoryId.toString()) item.classList.add('active');
        });
        if (categoryId === 'all') {
            VeyronApp.ui.renderChannels();
        } else {
            var filtered = VeyronApp.State.channels.filter(function(channel) {
                return (channel.category_id || channel.cid) == categoryId;
            });
            VeyronApp.ui.renderChannels(filtered);
        }
        setTimeout(function() {
            var firstChannel = document.querySelector('.channel-card');
            if (firstChannel) firstChannel.focus();
        }, 100);
    };
})();
