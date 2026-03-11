import {
    collectPagedResourcesUntilTarget,
    filterUniqueResourcesByUrl,
    shouldSkipFetch,
} from '@utils/pagedResource';

type TestResource = {
    url: string;
    name: string;
};

describe('pagedResource helpers', () => {
    test('filterUniqueResourcesByUrl keeps only incoming items with new urls', () => {
        const existingItems: TestResource[] = [
            { url: 'https://swapi.info/api/people/1', name: 'Luke' },
        ];
        const incomingItems: TestResource[] = [
            { url: 'https://swapi.info/api/people/1', name: 'Luke duplicate' },
            { url: 'https://swapi.info/api/people/2', name: 'Leia' },
        ];

        expect(filterUniqueResourcesByUrl(existingItems, incomingItems)).toEqual([
            { url: 'https://swapi.info/api/people/2', name: 'Leia' },
        ]);
    });

    test('shouldSkipFetch blocks duplicate initial and pagination requests when state cannot fetch', () => {
        expect(shouldSkipFetch({
            nextPage: false,
            loading: false,
            loadingMore: false,
            hasMore: true,
            currentPage: 2,
            itemCount: 10,
        })).toBe(true);

        expect(shouldSkipFetch({
            nextPage: true,
            loading: false,
            loadingMore: false,
            hasMore: false,
            currentPage: 2,
            itemCount: 10,
        })).toBe(true);

        expect(shouldSkipFetch({
            nextPage: true,
            loading: false,
            loadingMore: false,
            hasMore: true,
            currentPage: 2,
            itemCount: 10,
        })).toBe(false);
    });

    test('collectPagedResourcesUntilTarget keeps loading until the target is met and removes duplicates', async () => {
        const loadPage = jest.fn(async (page: number) => {
            if (page === 1) {
                return {
                    items: [
                        { url: 'https://swapi.info/api/people/1', name: 'Luke' },
                        { url: 'https://swapi.info/api/people/2', name: 'Leia' },
                    ],
                    hasMore: true,
                };
            }

            return {
                items: [
                    { url: 'https://swapi.info/api/people/2', name: 'Leia duplicate' },
                    { url: 'https://swapi.info/api/people/3', name: 'Han' },
                ],
                hasMore: false,
            };
        });

        await expect(
            collectPagedResourcesUntilTarget({
                targetCount: 3,
                loadPage,
            })
        ).resolves.toEqual({
            items: [
                { url: 'https://swapi.info/api/people/1', name: 'Luke' },
                { url: 'https://swapi.info/api/people/2', name: 'Leia' },
                { url: 'https://swapi.info/api/people/3', name: 'Han' },
            ],
            currentPage: 2,
            hasMore: false,
        });

        expect(loadPage).toHaveBeenCalledTimes(2);
    });
});
