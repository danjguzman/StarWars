import { renderHook, waitFor } from '@testing-library/react';
import { getJson } from '@services/api';
import { useResolvedResourceNames } from '@utils/useResolvedResourceNames';
import { allResourceCacheKey } from '@utils/resourceResolve';
import { invalidateCacheByPrefix, setCachedValue } from '@utils/clientCache';

jest.mock('@services/api', () => ({
    getJson: jest.fn(),
}));

const mockedGetJson = jest.mocked(getJson);

describe('useResolvedResourceNames', () => {
    beforeEach(() => {
        invalidateCacheByPrefix('');
        jest.clearAllMocks();
    });

    test('returns cached names immediately and only fetches unresolved resources', async () => {
        const cachedUrl = 'https://swapi.info/api/people/1';
        const uncachedUrl = 'https://swapi.info/api/planets/2';
        const urls = [cachedUrl, uncachedUrl];

        setCachedValue(allResourceCacheKey('people'), [{ url: cachedUrl, name: 'Luke Skywalker' }], 60000);
        mockedGetJson.mockResolvedValue({ url: uncachedUrl, name: 'Alderaan' });

        const { result } = renderHook(() => useResolvedResourceNames(urls));

        expect(result.current).toEqual({
            [cachedUrl]: 'Luke Skywalker',
        });

        await waitFor(() => {
            expect(result.current).toEqual({
                [cachedUrl]: 'Luke Skywalker',
                [uncachedUrl]: 'Alderaan',
            });
        });

        expect(mockedGetJson).toHaveBeenCalledTimes(1);
        expect(mockedGetJson).toHaveBeenCalledWith(uncachedUrl);
    });

    test('skips network work when every resource name is already cached', async () => {
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
        expect(mockedGetJson).not.toHaveBeenCalled();
    });
});
