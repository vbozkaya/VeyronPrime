/**
 * Veyron Prime Player - API Yardımcı Fonksiyonlar
 * Ortak API işlemleri ve yardımcı fonksiyonlar
 */

window.VeyronApp = window.VeyronApp || { core: {}, api: {}, ui: {} };
VeyronApp.api = VeyronApp.api || {};

/**
 * AbortController ile timeout'lu fetch isteği yapar
 */
VeyronApp.api.fetchWithTimeout = async function(url, options = {}, timeoutMs) {
    var defaultTimeout = (window.VeyronApp.Constants && window.VeyronApp.Constants.API_TIMEOUT_MS) || 10000;
    timeoutMs = timeoutMs != null ? timeoutMs : defaultTimeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // User-Agent header'ını ekle
    const defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
    
    // Mevcut headers ile birleştir (options.headers varsa)
    const mergedHeaders = {
        ...defaultHeaders,
        ...(options.headers || {})
    };
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: mergedHeaders,
            mode: 'cors',
            credentials: 'omit',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('İstek zaman aşımına uğradı (' + (timeoutMs / 1000) + ' saniye)');
        }
        throw error;
    }
};

/**
 * URL formatını normalleştirir: http:// yoksa ekler, sondaki slash'ı temizler.
 * Tüm URL oluşturma mantığı VeyronApp.State.apiUrl ile uyumludur (login sonrası bu değer atanır).
 */
VeyronApp.api.normalizeUrl = function(serverUrl) {
    if (!serverUrl || typeof serverUrl !== 'string') return '';
    var url = serverUrl.trim();
    if (!url) return '';
    if (!url.match(/^https?:\/\//i)) {
        url = 'http://' + url;
    }
    url = url.replace(/\/+$/, '');
    return url;
};

/**
 * JSON yanıtını temizler ve parse eder
 * SPECTRE gibi ekstra metinleri temizler
 */
VeyronApp.api.cleanAndParseJson = function(rawResponseText) {
    // HTML etiketlerini temizle
    let cleanedText = rawResponseText.trim().replace(/<[^>]*>/g, '');
    
    // İlk { karakterinden önceki metinleri temizle
    const firstBraceIndex = cleanedText.indexOf('{');
    if (firstBraceIndex > 0) {
        cleanedText = cleanedText.substring(firstBraceIndex);
    }
    
    // JSON objesini bul (regex ile)
    let cleanedJsonText = '';
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch && jsonMatch[0]) {
        cleanedJsonText = jsonMatch[0];
    } else {
        // Regex başarısız olursa substring yöntemini kullan
        cleanedJsonText = cleanedText;
        const lastBraceIndex = cleanedJsonText.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
            cleanedJsonText = cleanedJsonText.substring(0, lastBraceIndex + 1);
        } else {
            // Eksik } karakterlerini ekle
            const openBraces = (cleanedJsonText.match(/\{/g) || []).length;
            const closeBraces = (cleanedJsonText.match(/\}/g) || []).length;
            const missingBraces = openBraces - closeBraces;
            if (missingBraces > 0) {
                cleanedJsonText += '}'.repeat(missingBraces);
            }
        }
    }
    
    return cleanedJsonText;
};

/**
 * Bozuk JSON'dan manuel olarak auth değerini çıkarır
 */
VeyronApp.api.extractAuthFromBrokenJson = function(rawResponseText, username) {
    // auth değerini bul (hem user_info içinde hem de üst seviyede)
    const userInfoAuthMatch = rawResponseText.match(/"user_info"\s*:\s*\{[^}]*"auth"\s*:\s*(\d+)/);
    const topLevelAuthMatch = rawResponseText.match(/"auth"\s*:\s*(\d+)/);
    const statusMatch = rawResponseText.match(/"status"\s*:\s*"([^"]+)"/);
    const usernameMatch = rawResponseText.match(/"username"\s*:\s*"([^"]+)"/);
    const expDateMatch = rawResponseText.match(/"exp_date"\s*:\s*"([^"]+)"/);
    
    const authMatch = userInfoAuthMatch || topLevelAuthMatch;
    
    if (authMatch && (authMatch[1] === '1' || parseInt(authMatch[1]) === 1)) {
        const extractedData = {
            user_info: {
                username: usernameMatch ? usernameMatch[1] : username,
                auth: 1
            },
            status: statusMatch ? statusMatch[1] : 'Active'
        };
        if (expDateMatch) {
            extractedData.exp_date = expDateMatch[1];
        }
        
        const token = usernameMatch ? usernameMatch[1] : username;
        
        return {
            success: true,
            token: token,
            userInfo: extractedData.user_info
        };
    }
    
    return null;
};
