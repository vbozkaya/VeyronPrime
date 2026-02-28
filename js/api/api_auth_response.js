/**
 * Veyron Prime Player - Giriş API yanıt ayrıştırma
 * api_auth.js 200 satır limiti için ayrıldı.
 */

window.VeyronApp = window.VeyronApp || { api: {} };
VeyronApp.api = VeyronApp.api || {};

/**
 * XC API login yanıtını ayrıştırır; success/token/userInfo veya success: false, error döner.
 */
VeyronApp.api.parseLoginResponse = function(data, rawResponseText, username) {
    if (data.user_info && (data.user_info.auth === 1 || data.user_info.auth === '1')) {
        var token = data.user_info.auth_code || data.user_info.username || username;
        return { success: true, token: token, userInfo: data.user_info };
    }
    if (data.auth === 1 || data.auth === '1') {
        var token = data.user_info && data.user_info.auth_code ? data.user_info.auth_code : (data.auth_code || username);
        return { success: true, token: token, userInfo: data.user_info || data };
    }
    if (data.user_info && data.user_info.auth_code) {
        return { success: true, token: data.user_info.auth_code, userInfo: data.user_info };
    }
    if (data.status === 'error' || (!data.user_info && data.auth !== 1 && data.auth !== '1')) {
        return { success: false, error: data.message || 'Kullanıcı adı veya şifre hatalı' };
    }
    return {
        success: false,
        error: 'Bilinmeyen hata oluştu. API yanıt formatı beklenen formatta değil.'
    };
};
