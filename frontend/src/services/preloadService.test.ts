import { allResourceCacheKey, RESOURCE_COLLECTIONS } from '@utils/resourceResolve';

type ApiModuleMocks = {
    apiUrl: jest.Mock<string, [string]>;
    getJson: jest.Mock<Promise<unknown>, [string]>;
    isSwapiPagedResponse: jest.Mock<boolean, [unknown]>;
    setCachedValue: jest.Mock<void, [string, unknown, number]>;
};

async function loadPreloadService(getJsonImplementation: (url: string) => Promise<unknown>) {
    jest.resetModules();

    const apiUrl = jest.fn((path: string) => `https://swapi.info/api${path}`);
    const getJson = jest.fn(getJsonImplementation);
    const isSwapiPagedResponse = jest.fn(
        (data: unknown) =>
            Boolean(
                data
                && typeof data === 'object'
                && Array.isArray((data as { results?: unknown[] }).results)
                && 'next' in (data as object)
            )
    );
    
    const setCachedValue = jest.fn<void, [string, unknown, number]>();

    jest.doMock('@services/api', () => ({
        apiUrl,
        getJson,
        isSwapiPagedResponse,
    }));

    jest.doMock('@utils/clientCache', () => ({
        setCachedValue,
    }));

    const module = await import('@services/preloadService');

    return {
        ...module,
        apiUrl,
        getJson,
        isSwapiPagedResponse,
        setCachedValue,
    } as typeof module & ApiModuleMocks;
}

describe('preloadService', () => {
    afterEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    test('preloads and caches every resource collection', async () => {
        const { preloadSwapiData, setCachedValue } = await loadPreloadService(async (url) => [{ url }]);
        await preloadSwapiData();
        expect(setCachedValue).toHaveBeenCalledTimes(RESOURCE_COLLECTIONS.length);
        for (const endpoint of RESOURCE_COLLECTIONS) {
            expect(setCachedValue).toHaveBeenCalledWith(
                allResourceCacheKey(endpoint),
                [{ url: `https://swapi.info/api/${endpoint}` }],
                300000
            );
        }
    });

    test('collects all pages before caching a paged resource collection', async () => {
        const { preloadSwapiData, setCachedValue } = await loadPreloadService(async (url) => {
            if (url === 'https://swapi.info/api/people') {
                return {
                    results: [{ url: 'https://swapi.info/api/people/1' }],
                    next: 'https://swapi.info/api/people?page=2',
                    previous: null,
                };
            }

            if (url === 'https://swapi.info/api/people?page=2') {
                return {
                    results: [{ url: 'https://swapi.info/api/people/2' }],
                    next: null,
                    previous: 'https://swapi.info/api/people?page=1',
                };
            }

            return [{ url }];
        });

        await preloadSwapiData();

        expect(setCachedValue).toHaveBeenCalledWith(
            'people:all',
            [
                { url: 'https://swapi.info/api/people/1' },
                { url: 'https://swapi.info/api/people/2' },
            ],
            300000
        );
    });

    test('reuses the same in-flight preload promise for repeated callers', async () => {
        let resolvePeople!: (value: unknown) => void;
        const { preloadSwapiData, getJson } = await loadPreloadService((url) => {
            if (url === 'https://swapi.info/api/people') {
                return new Promise((resolve) => {
                    resolvePeople = resolve;
                });
            }

            return Promise.resolve([{ url }]);
        });

        const firstPromise = preloadSwapiData();
        const secondPromise = preloadSwapiData();
        expect(secondPromise).toBe(firstPromise);
        expect(getJson).toHaveBeenCalledTimes(RESOURCE_COLLECTIONS.length);
        resolvePeople([{ url: 'https://swapi.info/api/people/1' }]);
        await firstPromise;
    });

    test('resets the shared preload promise after a failure so a later retry can succeed', async () => {
        let shouldFail = true;
        const { preloadSwapiData, getJson } = await loadPreloadService((url) => {
            if (url === 'https://swapi.info/api/people' && shouldFail) {
                return Promise.reject(new Error('people preload failed'));
            }

            return Promise.resolve([{ url }]);
        });

        await expect(preloadSwapiData()).rejects.toThrow("We couldn't prepare the People archive. people preload failed.");
        shouldFail = false;
        await expect(preloadSwapiData()).resolves.toBeUndefined();
        expect(
            getJson.mock.calls.filter(([url]) => url === 'https://swapi.info/api/people')
        ).toHaveLength(2);
    });
});
