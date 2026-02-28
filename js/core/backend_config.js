/**
 * Supabase backend configuration for edge functions.
 * Used by backend integration; do not modify player or navigation.
 *
 * Geliştirme: USE_FIXED_DEVICE = true iken sabit id/key kullanılır.
 * Production'da USE_FIXED_DEVICE = false yapın veya kaldırın.
 */
(function() {
    'use strict';

    window.VeyronApp = window.VeyronApp || {};

    VeyronApp.backend = {
        BASE_URL: "https://rpufwgrkmiqcjltspzqc.supabase.co/functions/v1",
        ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdWZ3Z3JrbWlxY2psdHNwenFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjg5OTcsImV4cCI6MjA4NzgwNDk5N30.Gn_jnghXOXY7BOFGj3-CSsIn5QNmmfY1U3govDH4tew",
        /** Geliştirme: true = sabit device id/key kullan (panel ile aynı değerleri girin) */
        USE_FIXED_DEVICE: true,
        /** Sabit Device ID (geliştirme; panelde bu id ile giriş yapın) */
        FIXED_DEVICE_ID: "dev-veyron-00000000-0000-4000-a000-000000000001",
        /** Sabit Device Key (geliştirme; panelde bu key ile giriş yapın) */
        FIXED_DEVICE_KEY: "VeyronDevKey123"
    };
})();
