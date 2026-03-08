/* Shared layout constants for tile-based pages. */
export const TILE_MIN_WIDTH = 260;
export const TILE_HEIGHT = 300;
export const TILE_AVATAR_SIZE = 200;
export const TILE_GAP = 16;
export const CONTENT_MAX_WIDTH = 960;
export const LAYOUT_HORIZONTAL_PADDING = 32;
export const HEADER_HEIGHT = 64;
export const HEADER_HEIGHT_CSS = "calc(4em + env(safe-area-inset-top, 0px))";
export const MAIN_VERTICAL_PADDING = 32;
export const EXTRA_ROWS = 2;

/* Estimate initial tile count to prefill viewport before scrolling. */
export function estimateInitialTargetCount() {
    const usableWidth = Math.min(
        Math.max(window.innerWidth - LAYOUT_HORIZONTAL_PADDING, TILE_MIN_WIDTH),
        CONTENT_MAX_WIDTH
    );
    const columns = Math.max(1, Math.floor((usableWidth + TILE_GAP) / (TILE_MIN_WIDTH + TILE_GAP)));
    const usableHeight = Math.max(
        window.innerHeight - HEADER_HEIGHT - MAIN_VERTICAL_PADDING,
        TILE_HEIGHT
    );
    const visibleRows = Math.max(1, Math.ceil(usableHeight / (TILE_HEIGHT + TILE_GAP)));
    return columns * (visibleRows + EXTRA_ROWS);
}
