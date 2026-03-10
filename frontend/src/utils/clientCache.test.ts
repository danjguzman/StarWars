import {
    getCachedPage,
    getCachedValue,
    invalidateCacheByPrefix,
    invalidatePageCache,
    setCachedValue,
} from '@utils/clientCache';

describe('clientCache', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
        invalidateCacheByPrefix('');
    });

    afterEach(() => {
        invalidateCacheByPrefix('');
        jest.useRealTimers();
    });

    test('returns a cached value before its TTL expires', () => {
        setCachedValue('people:all', ['Luke'], 1000);
        expect(getCachedValue('people:all')).toEqual(['Luke']);
    });

    test('expires cached values once their TTL has passed', () => {
        setCachedValue('people:all', ['Luke'], 1000);
        jest.advanceTimersByTime(1001);
        expect(getCachedValue('people:all')).toBeNull();
    });

    test('getCachedPage fetches once and then reuses the cached page', async () => {
        const fetchPage = jest.fn().mockResolvedValue({ items: ['Luke'], hasMore: true });
        const firstResult = await getCachedPage('people', 1, fetchPage, 5000);
        const secondResult = await getCachedPage('people', 1, fetchPage, 5000);
        expect(firstResult).toEqual({ items: ['Luke'], hasMore: true });
        expect(secondResult).toEqual({ items: ['Luke'], hasMore: true });
        expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    test('invalidatePageCache clears only paged entries for the requested cache', () => {
        setCachedValue('people:page:1', ['Luke'], 5000);
        setCachedValue('people:page:2', ['Leia'], 5000);
        setCachedValue('people:all', ['Luke', 'Leia'], 5000);
        invalidatePageCache('people');
        expect(getCachedValue('people:page:1')).toBeNull();
        expect(getCachedValue('people:page:2')).toBeNull();
        expect(getCachedValue('people:all')).toEqual(['Luke', 'Leia']);
    });
});
