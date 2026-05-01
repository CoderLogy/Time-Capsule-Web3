import * as amplitude from "@amplitude/unified";


let isInitialized = false;

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


export function isAmplitudeInitialized() {
    return isInitialized;
}


export function getAmplitude() {
    return amplitude;
}
