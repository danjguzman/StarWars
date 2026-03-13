import { renderHook } from '@testing-library/react';
import { getPreloadedCollection } from '@services/preloadService';
import { useResolvedResourceNames } from '@utils/useResolvedResourceNames';
import { allResourceCacheKey } from '@utils/resourceResolve';
import { invalidateCacheByPrefix, setCachedValue } from '@utils/clientCache';

jest.mock('@services/preloadService', () => ({
    getPreloadedCollection: jest.fn(),
}));

const mockedGetPreloadedCollection = jest.mocked(getPreloadedCollection);

describe('useResolvedResourceNames', () => {
    beforeEach(() => {
        invalidateCacheByPrefix('');
        jest.clearAllMocks();
        mockedGetPreloadedCollection.mockReturnValue(null);
    });

    test('returns cached names immediately without extra preload calls', () => {
        const urls = [
            'https://swapi.info/api/people/1',
            'https://swapi.info/api/people/2',
        ];

        setCachedValue(
            allResourceCacheKey('people'),
            [
                { url: urls[0], name: 'Luke Skywalker' },
                { url: urls[1], name: 'C-3PO' },
            ],
            60000
        );

        const { result } = renderHook(() => useResolvedResourceNames(urls));

        expect(result.current).toEqual({
            [urls[0]]: 'Luke Skywalker',
            [urls[1]]: 'C-3PO',
        });
        expect(mockedGetPreloadedCollection).not.toHaveBeenCalled();
    });

    test('falls back to the preloaded in-memory collections for unresolved names', () => {
        const uncachedUrl = 'https://swapi.info/api/planets/2';

        mockedGetPreloadedCollection.mockImplementation((resourceKey) => {
            if (resourceKey === 'planets') {
                return [{ url: uncachedUrl, name: 'Alderaan' }];
            }

            return null;
        });

        const { result } = renderHook(() => useResolvedResourceNames([uncachedUrl]));

        expect(result.current).toEqual({
            [uncachedUrl]: 'Alderaan',
        });
        expect(mockedGetPreloadedCollection).toHaveBeenCalledWith('planets');
    });
});
