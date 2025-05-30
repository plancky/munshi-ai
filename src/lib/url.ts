export const MODAL_URL =
    process.env.NODE_ENV !== "production"
        ? process.env.NEXT_PUBLIC_MODAL_APP_DEV
        : process.env.NEXT_PUBLIC_MODAL_APP;
