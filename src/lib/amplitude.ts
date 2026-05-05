import * as amplitude from "@amplitude/unified";


let isInitialized = false;

export function initializeAmplitude() {
    if (isInitialized) {
        return;
    }

    try {
        amplitude.initAll("688cdec4f64f59fcfd6513a78e1af49c", {
            analytics: {
                autocapture: false
            }
        });
        isInitialized = true;
    } catch (error) {
    }
}


export function isAmplitudeInitialized() {
    return isInitialized;
}


export function getAmplitude() {
    return amplitude;
}
