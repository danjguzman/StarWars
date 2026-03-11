import {
    collectRelatedResourceUrls,
    findCachedResourceNameByUrl,
    getCachedResolvedResourceNames,
    normalizeResourcePath,
    resolveResourceItems,
} from '@utils/resourceResolve';
import { getCachedValue } from '@utils/clientCache';

jest.mock('@utils/clientCache', () => ({
    getCachedValue: jest.fn(),
}));

const mockedGetCachedValue = jest.mocked(getCachedValue);

describe('resourceResolve helpers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('normalizeResourcePath strips the host and trailing slash', () => {
        expect(normalizeResourcePath('https://swapi.info/api/people/1/')).toBe('/api/people/1');
    });

    test('findCachedResourceNameByUrl resolves by resource id and type even when the host differs', () => {
        mockedGetCachedValue.mockImplementation((key: string) => {
            if (key === 'people:all') {
                return [
                    { url: 'https://swapi.info/api/people/5', name: 'Leia Organa' },
                ];
            }

            return null;
        });

        expect(findCachedResourceNameByUrl('https://example.com/api/people/5/')).toBe('Leia Organa');
    });

    test('getCachedResolvedResourceNames returns only urls that could be resolved from cache', () => {
        mockedGetCachedValue.mockImplementation((key: string) => {
            if (key === 'films:all') {
                return [{ url: 'https://swapi.info/api/films/1', title: 'A New Hope' }];
            }

            return null;
        });

        expect(getCachedResolvedResourceNames([
            'https://swapi.info/api/films/1',
            'https://swapi.info/api/films/2',
        ])).toEqual({
            'https://swapi.info/api/films/1': 'A New Hope',
        });
    });

    test('collectRelatedResourceUrls deduplicates mixed groups and resolveResourceItems uses the best available label', () => {
        mockedGetCachedValue.mockImplementation((key: string) => {
            if (key === 'planets:all') {
                return [{ url: 'https://swapi.info/api/planets/1', name: 'Tatooine' }];
            }

            return null;
        });

        const urls = collectRelatedResourceUrls([
            ['https://swapi.info/api/planets/1', 'https://swapi.info/api/planets/1'],
            ['https://swapi.info/api/planets/2'],
            null,
        ]);

        expect(urls).toEqual([
            'https://swapi.info/api/planets/1',
            'https://swapi.info/api/planets/2',
        ]);

        expect(resolveResourceItems(urls, { 'https://swapi.info/api/planets/2': 'Alderaan' })).toEqual([
            { url: 'https://swapi.info/api/planets/1', name: 'Tatooine' },
            { url: 'https://swapi.info/api/planets/2', name: 'Alderaan' },
        ]);
    });
});
