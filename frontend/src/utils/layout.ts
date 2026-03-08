import {
    CONTENT_MAX_WIDTH,
    EXTRA_ROWS,
    HEADER_HEIGHT,
    LAYOUT_HORIZONTAL_PADDING,
    MAIN_VERTICAL_PADDING,
    TILE_GAP,
    TILE_HEIGHT,
    TILE_MIN_WIDTH,
} from "@utils/consts";

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
