import { render, waitFor } from '@testing-library/react';
import { useInfiniteScroll } from '@utils/useInfiniteScroll';

class IntersectionObserverMock implements IntersectionObserver {
    static instances: IntersectionObserverMock[] = [];

    readonly root = null;
    readonly rootMargin: string;
    readonly thresholds = [0];

    private readonly callback: IntersectionObserverCallback;
    observe = jest.fn<void, [Element]>();
    unobserve = jest.fn<void, [Element]>();
    disconnect = jest.fn<void, []>();
    takeRecords = jest.fn<IntersectionObserverEntry[], []>(() => []);

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        this.callback = callback;
        this.rootMargin = options?.rootMargin ?? '';
        IntersectionObserverMock.instances.push(this);
    }

    trigger(isIntersecting: boolean, target: Element) {
        this.callback([
            {
                isIntersecting,
                target,
                boundingClientRect: target.getBoundingClientRect(),
                intersectionRatio: isIntersecting ? 1 : 0,
                intersectionRect: target.getBoundingClientRect(),
                rootBounds: null,
                time: Date.now(),
            },
        ], this);
    }
}

function InfiniteScrollHarness({
    hasMore = true,
    disabled = false,
    top = 1200,
    onLoadMore,
}: {
    hasMore?: boolean;
    disabled?: boolean;
    top?: number;
    onLoadMore: () => void;
}) {
    const sentinelRef = useInfiniteScroll({
        hasMore,
        disabled,
        onLoadMore,
        contentLength: 4,
    });

    return (
        <div
            data-testid="sentinel"
            ref={(node) => {
                if (!node) return;
                Object.defineProperty(node, 'getBoundingClientRect', {
                    configurable: true,
                    value: () => ({
                        top,
                        bottom: top + 10,
                        left: 0,
                        right: 10,
                        width: 10,
                        height: 10,
                        x: 0,
                        y: top,
                        toJSON: () => '',
                    }),
                });
                sentinelRef.current = node;
            }}
        />
    );
}

describe('useInfiniteScroll', () => {
    const originalIntersectionObserver = globalThis.IntersectionObserver;

    beforeEach(() => {
        IntersectionObserverMock.instances = [];
        Object.defineProperty(globalThis, 'IntersectionObserver', {
            configurable: true,
            writable: true,
            value: IntersectionObserverMock,
        });
        Object.defineProperty(window, 'innerHeight', {
            configurable: true,
            writable: true,
            value: 900,
        });
    });

    afterEach(() => {
        Object.defineProperty(globalThis, 'IntersectionObserver', {
            configurable: true,
            writable: true,
            value: originalIntersectionObserver,
        });
        jest.clearAllMocks();
    });

    test('loads immediately when the sentinel already sits near the viewport', async () => {
        const onLoadMore = jest.fn();

        render(<InfiniteScrollHarness onLoadMore={onLoadMore} top={1000} />);

        await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1));
        expect(IntersectionObserverMock.instances).toHaveLength(1);
        expect(IntersectionObserverMock.instances[0]?.observe).toHaveBeenCalledTimes(1);
    });

    test('loads when the intersection observer reports the sentinel as visible', () => {
        const onLoadMore = jest.fn();
        const { getByTestId } = render(<InfiniteScrollHarness onLoadMore={onLoadMore} top={2000} />);

        const sentinel = getByTestId('sentinel');
        expect(onLoadMore).not.toHaveBeenCalled();

        IntersectionObserverMock.instances[0]?.trigger(true, sentinel);

        expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    test('does not observe or load when infinite scroll is disabled or exhausted', () => {
        const onLoadMore = jest.fn();

        render(<InfiniteScrollHarness onLoadMore={onLoadMore} disabled hasMore={false} top={1000} />);

        expect(onLoadMore).not.toHaveBeenCalled();
        expect(IntersectionObserverMock.instances).toHaveLength(0);
    });
});
