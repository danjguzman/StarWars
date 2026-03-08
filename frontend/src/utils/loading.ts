/* We want to show "Loading" for a min duration so the user doesn't see a "Loading" flicking if the API responds quickly. */
export async function waitForMinimumLoading(startTime: number, minDurationMs = 1000) {
    const elapsed = Date.now() - startTime;
    if (elapsed < minDurationMs) await new Promise((resolve) => setTimeout(resolve, minDurationMs - elapsed));
}
