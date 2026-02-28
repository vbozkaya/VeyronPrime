/**
 * Veyron Prime Player - API İçerik Yönetimi
 * Kategoriler ve kanallar yükleme işlemleri
 */

window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };
VeyronApp.api = VeyronApp.api || {};

/**
 * Kategorileri yükler
 */
VeyronApp.api.loadCategories = async function() {
    try {
        // Şifreyi localStorage'dan al (authToken yerine password kullan)
        const password = localStorage.getItem('iptv_password') || VeyronApp.State.authToken;
        if (!password) {
            throw new Error('Şifre bulunamadı. Lütfen giriş yapın.');
        }
        
        const url = `${VeyronApp.State.apiUrl}/player_api.php?username=${encodeURIComponent(VeyronApp.State.username)}&password=${encodeURIComponent(password)}&action=get_live_categories`;
        
        const response = await VeyronApp.api.fetchWithTimeout(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }, (window.VeyronApp.Constants && window.VeyronApp.Constants.API_TIMEOUT_MS) || 10000);
        
        if (!response.ok) {
            console.error('[API] Kategoriler HTTP hatası:', response.status);
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
            if (VeyronApp.StateManager) VeyronApp.StateManager.set('categories', data);
            else VeyronApp.State.categories = data;
            return { success: true, categories: data };
        } else {
            console.error('[API] Geçersiz kategori verisi');
            throw new Error('Invalid categories data');
        }
    } catch (error) {
        console.error('[API] Kategori yükleme hatası:', error.message);
        throw error;
    }
};

/**
 * Kanalları yükler
 */
VeyronApp.api.loadChannels = async function() {
    try {
        // Şifreyi localStorage'dan al (authToken yerine password kullan)
        const password = localStorage.getItem('iptv_password') || VeyronApp.State.authToken;
        if (!password) {
            throw new Error('Şifre bulunamadı. Lütfen giriş yapın.');
        }
        
        const url = `${VeyronApp.State.apiUrl}/player_api.php?username=${encodeURIComponent(VeyronApp.State.username)}&password=${encodeURIComponent(password)}&action=get_live_streams`;
        
        const response = await VeyronApp.api.fetchWithTimeout(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }, (window.VeyronApp.Constants && window.VeyronApp.Constants.API_TIMEOUT_MS) || 10000);
        
        if (!response.ok) {
            console.error('[API] Kanallar HTTP hatası:', response.status);
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
            if (VeyronApp.StateManager) VeyronApp.StateManager.set('channels', data);
            else VeyronApp.State.channels = data;
            return { success: true, channels: data };
        } else {
            console.error('[API] Geçersiz kanal verisi');
            throw new Error('Invalid channels data');
        }
    } catch (error) {
        console.error('[API] Kanal yükleme hatası:', error.message);
        throw error;
    }
};
