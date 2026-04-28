import * as amplitude from "@amplitude/unified";

// Track initialization state to ensure Amplitude is only initialized once
let isInitialized = false;

/**
 * Initialize Amplitude Analytics on the client side.
 * This should be called once during app initialization.
 */
export function initializeAmplitude() {
    if (isInitialized) {
        console.warn("[Amplitude] Already initialized, skipping re-initialization");
        return;
    }

    try {
        amplitude.initAll("688cdec4f64f59fcfd6513a78e1af49c", {
            analytics: {
                autocapture: false
            }
        });
        isInitialized = true;
        console.log("[Amplitude] Successfully initialized");
    } catch (error) {
        console.error("[Amplitude] Failed to initialize:", error);
    }
}

/**
 * Check if Amplitude is initialized
 */
export function isAmplitudeInitialized() {
    return isInitialized;
}

/**
 * Get the Amplitude instance (for direct access if needed)
 */
export function getAmplitude() {
    return amplitude;
}
