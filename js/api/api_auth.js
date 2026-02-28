/**
 * Veyron Prime Player - API Kimlik Doğrulama
 * Giriş, bağlantı testi ve token doğrulama işlemleri
 */

window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };
VeyronApp.api = VeyronApp.api || {};

/**
 * XC API ile giriş yapar
 */
VeyronApp.api.login = async function(serverUrl, username, password) {
    try {
        // Parametre validasyonu
        if (!serverUrl || !username || !password) {
            console.error('[API] Eksik parametreler');
            return {
                success: false,
                error: 'Tüm alanlar doldurulmalıdır'
            };
        }
        
        var normalizedUrl = VeyronApp.api.normalizeUrl(serverUrl);
        
        // Login URL oluştur
        let loginUrl = normalizedUrl;
        if (!loginUrl.endsWith('/player_api.php')) {
            loginUrl = loginUrl + '/player_api.php';
        }
        loginUrl = loginUrl + '?username=' + encodeURIComponent(username.trim()) + '&password=' + encodeURIComponent(password.trim());
        
        var timeoutMs = (window.VeyronApp.Constants && window.VeyronApp.Constants.API_TIMEOUT_MS) || 10000;
        const response = await VeyronApp.api.fetchWithTimeout(loginUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        }, timeoutMs).catch(fetchError => {
            if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
                throw new Error('İnternet bağlantısı yok veya sunucuya erişilemiyor. CORS hatası veya proxy gereksinimi olabilir.');
            } else if (fetchError.message.includes('zaman aşımı') || fetchError.name === 'AbortError') {
                throw new Error('Bağlantı zaman aşımına uğradı (10 saniye). Sunucu yanıt vermiyor.');
            }
            throw fetchError;
        });
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Yanıt okunamadı');
            return {
                success: false,
                error: `Sunucu hatası (${response.status} ${response.statusText})`
            };
        }
        
        // Response body'yi text olarak al
        const rawResponseText = await response.text().catch(() => {
            console.error('[API] Response body okunamadı');
            return '';
        });
        
        // JSON'u temizle ve parse et
        const cleanedJsonText = VeyronApp.api.cleanAndParseJson(rawResponseText);
        
        let data;
        try {
            data = JSON.parse(cleanedJsonText);
        } catch (parseError) {
            const extracted = VeyronApp.api.extractAuthFromBrokenJson(rawResponseText, username);
            if (extracted) return extracted;
            console.error('[API] JSON parse hatası:', parseError.message);
            return {
                success: false,
                error: 'Sunucudan geçersiz JSON yanıtı alındı. Ham yanıt: ' + rawResponseText.substring(0, 200)
            };
        }
        return VeyronApp.api.parseLoginResponse(data, rawResponseText, username);
    } catch (error) {
        console.error('[API] Giriş hatası:', error.message);
        
        let errorMessage = 'Bağlantı hatası oluştu.';
        if (error.message) {
            if (error.message.includes('İnternet bağlantısı') || error.message.includes('CORS') || error.message.includes('proxy')) {
                errorMessage = error.message;
            } else if (error.message.includes('zaman aşımı')) {
                errorMessage = error.message;
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = 'İnternet bağlantısı yok veya sunucuya erişilemiyor.';
            } else {
                errorMessage = error.message;
            }
        }
        
        return {
            success: false,
            error: errorMessage
        };
    }
};

/**
 * Bağlantı testi yapar
 */
VeyronApp.api.testConnection = async function(serverUrl) {
    try {
        var normalizedUrl = VeyronApp.api.normalizeUrl(serverUrl);
        var testUrl = normalizedUrl + '/player_api.php';
        
        var shortTimeout = (window.VeyronApp.Constants && window.VeyronApp.Constants.API_TIMEOUT_SHORT_MS) || 5000;
        const response = await VeyronApp.api.fetchWithTimeout(testUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        }, shortTimeout).catch(fetchError => {
            if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
                throw new Error('İnternet bağlantısı yok! Emülatörün internet ayarlarını kontrol edin.');
            } else if (fetchError.message.includes('zaman aşımı')) {
                throw new Error('Sunucuya erişilemiyor. Zaman aşımı oluştu.');
            }
            throw fetchError;
        });
        
        if (response.ok || response.status === 401 || response.status === 403) {
            return {
                success: true,
                message: 'Bağlantı başarılı! Sunucuya erişilebiliyor. Şimdi giriş yapabilirsiniz.'
            };
        } else {
            return {
                success: false,
                error: `Sunucu yanıt verdi ancak hata kodu: ${response.status} ${response.statusText}`
            };
        }
    } catch (error) {
        console.error('[API] Bağlantı testi hatası:', error.message);
        
        let errorMessage = 'Bağlantı testi başarısız. ';
        if (error.message.includes('İnternet bağlantısı yok')) {
            errorMessage = error.message;
        } else if (error.message.includes('zaman aşımı')) {
            errorMessage = 'Sunucuya erişilemiyor. Zaman aşımı oluştu. DNS adresini ve internet bağlantınızı kontrol edin.';
        } else {
            errorMessage += error.message || 'Bilinmeyen hata';
        }
        
        return {
            success: false,
            error: errorMessage
        };
    }
};

/**
 * Token geçerliliğini kontrol eder
 */
VeyronApp.api.verifyToken = async function() {
    try {
        const url = `${VeyronApp.State.apiUrl}/player_api.php?username=${encodeURIComponent(VeyronApp.State.username)}&password=${encodeURIComponent(VeyronApp.State.authToken)}&action=get_live_categories`;
        
        var timeoutMs = (window.VeyronApp.Constants && window.VeyronApp.Constants.API_TIMEOUT_MS) || 10000;
        const response = await VeyronApp.api.fetchWithTimeout(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }, timeoutMs);
        
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                return { valid: true };
            }
        }
        
        return { valid: false };
    } catch (error) {
        console.error('[API] Token doğrulama hatası:', error.message);
        return { valid: false };
    }
};
