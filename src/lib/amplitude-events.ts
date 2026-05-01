import * as amplitude from "@amplitude/unified";

// Event tracking utilities for Time Capsule

// Wallet events
export function trackWalletConnectionStarted({
    walletProvider,
    connectionSource,
    chainId
}: {
    walletProvider: string;
    connectionSource: string;
    chainId?: number | string;
}) {
    amplitude.track("Wallet Connection Started", {
        wallet_provider: walletProvider,
        connection_source: connectionSource,
        chain_id: chainId
    });
}

export function trackAccountCreated({
    signupMethod,
    walletAddress,
    walletProvider,
    chainId
}: {
    signupMethod: string;
    walletAddress: string;
    walletProvider: string;
    chainId?: number | string;
}) {
    amplitude.track("Account Created", {
        signup_method: signupMethod,
        wallet_address: walletAddress?.toLowerCase(),
        wallet_provider: walletProvider,
        chain_id: chainId
    });
    amplitude.setUserId(walletAddress?.toLowerCase());
    amplitude.identify(new amplitude.Identify().set("is_authenticated", true)); // added
}

export function trackSignInCompleted({
    loginMethod,
    walletProvider,
    walletAddress, // added
    chainId
}: {
    loginMethod: string;
    walletProvider: string;
    walletAddress: string; // added
    chainId?: number | string;
}) {
    amplitude.setUserId(walletAddress?.toLowerCase()); // added
    amplitude.identify(new amplitude.Identify().set("is_authenticated", true)); // added
    amplitude.track("Sign In Completed", {
        login_method: loginMethod,
        wallet_provider: walletProvider,
        chain_id: chainId
    });
}

export function trackSignOutCompleted({
    signOutReason,
    walletProvider
}: {
    signOutReason: string;
    walletProvider: string;
}) {
    amplitude.track("Sign Out Completed", {
        sign_out_reason: signOutReason,
        wallet_provider: walletProvider
    });
    amplitude.identify(new amplitude.Identify().set("is_authenticated", false)); // added
    amplitude.reset(); // added
}

// CAPSULE CREATION EVENTS

export function trackCapsuleCreated({
    capsuleId,
    capsuleUnlockDate,
    capsuleVisibility,
    walletAddress
}: {
    capsuleId: string;
    capsuleUnlockDate?: string | Date;
    capsuleVisibility: string;
    walletAddress: string;
}) {
    amplitude.track("Capsule Created", {
        capsule_id: capsuleId,
        capsule_unlock_date: capsuleUnlockDate,
        capsule_visibility: capsuleVisibility,
        wallet_address: walletAddress?.toLowerCase()
    });
}

// CAPSULE VIEWING EVENTS

export function trackCapsuleOpened({
    capsuleId,
    isOwner,
    timeSinceUnlockSeconds
}: {
    capsuleId: string;
    isOwner: boolean;
    timeSinceUnlockSeconds?: number;
}) {
    amplitude.track("Capsule Opened", {
        capsule_id: capsuleId,
        is_owner: isOwner,
        time_since_unlock_seconds: timeSinceUnlockSeconds
    });
}

export function trackCapsuleDeleted({
    capsuleId,
    capsuleStatus
}: {
    capsuleId: string;
    capsuleStatus: string;
}) {
    amplitude.track("Capsule Deleted", {
        capsule_id: capsuleId,
        capsule_status: capsuleStatus
    });
}

// BLOCKCHAIN TRANSACTION EVENTS

export function trackTransactionSubmitted({
    capsuleId,
    transactionHash,
    chainId,
    walletAddress,
    gasFeesNative
}: {
    capsuleId: string;
    transactionHash: string;
    chainId?: number | string;
    walletAddress: string;
    gasFeesNative?: number | string;
}) {
    amplitude.track("Transaction Submitted", {
        capsule_id: capsuleId,
        transaction_hash: transactionHash,
        chain_id: chainId,
        wallet_address: walletAddress?.toLowerCase(),
        gas_fee_native: gasFeesNative
    });
}

export function trackTransactionConfirmed({
    capsuleId,
    transactionHash,
    chainId,
    confirmationTimeSeconds
}: {
    capsuleId: string;
    transactionHash: string;
    chainId?: number | string;
    confirmationTimeSeconds?: number;
}) {
    amplitude.track("Transaction Confirmed", {
        capsule_id: capsuleId,
        transaction_hash: transactionHash,
        chain_id: chainId,
        confirmation_time_seconds: confirmationTimeSeconds
    });
}

// ERROR TRACKING

export function trackErrorEncountered({
    errorCategory,
    errorMessage,
    errorContext,
    chainId,
    transactionHash
}: {
    errorCategory: string;
    errorMessage: string;
    errorContext?: string;
    chainId?: number | string;
    transactionHash?: string;
}) {
    amplitude.track("Error Encountered", {
        error_category: errorCategory,
        error_message: errorMessage,
        error_context: errorContext,
        chain_id: chainId,
        transaction_hash: transactionHash
    });
}

// USER PROPERTIES

export function setUserProperties({
    walletAddress,
    walletProvider,
    primaryChainId,
    signupMethod,
    hasCreatedCapsule,
    hasCompletedPayment,
    firstCapsuleCreatedAt,
    onboardingStatus,
    pricingModel,
    isAuthenticated // added
}: {
    walletAddress?: string;
    walletProvider?: string;
    primaryChainId?: number | string;
    signupMethod?: string;
    hasCreatedCapsule?: boolean;
    hasCompletedPayment?: boolean;
    firstCapsuleCreatedAt?: string | Date;
    onboardingStatus?: string;
    pricingModel?: string;
    isAuthenticated?: boolean; // added
}) {
    const identify = new amplitude.Identify();

    if (walletAddress) {
        identify.set("Wallet Address", walletAddress.toLowerCase());
    }
    if (walletProvider) {
        identify.set("Wallet Provider", walletProvider);
    }
    if (primaryChainId) {
        identify.set("Primary Chain Id", primaryChainId);
    }
    if (signupMethod) {
        identify.set("Signup Method", signupMethod);
    }
    if (hasCreatedCapsule !== undefined) {
        identify.set("Has Created Capsule", hasCreatedCapsule);
    }
    if (hasCompletedPayment !== undefined) {
        identify.set("Has Completed Payment", hasCompletedPayment);
    }
    if (firstCapsuleCreatedAt) {
        const timestamp =
            typeof firstCapsuleCreatedAt === "string"
                ? firstCapsuleCreatedAt
                : firstCapsuleCreatedAt.toISOString();
        identify.set("First Capsule Created At", timestamp);
    }
    if (onboardingStatus) {
        identify.set("Onboarding Status", onboardingStatus);
    }
    if (pricingModel) {
        identify.set("Pricing Model", pricingModel);
    }
    if (isAuthenticated !== undefined) {
        identify.set("is_authenticated", isAuthenticated); // added
    }

    amplitude.identify(identify);
}