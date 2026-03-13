import { fetchFilmsPage, loadFilms } from '@services/filmsService';
import { apiUrl, getJson, isSwapiPagedResponse } from '@services/api';
import { getPreloadedCollection } from '@services/preloadService';
import { getCachedPage, getCachedValue, setCachedValue } from '@utils/clientCache';
import type { Film } from '@types';

jest.mock('@services/api', () => ({
    apiUrl: jest.fn((path: string) => `https://swapi.info/api${path}`),
    getJson: jest.fn(),
    isSwapiPagedResponse: jest.fn(),
}));

jest.mock('@services/preloadService', () => ({
    getPreloadedCollection: jest.fn(),
}));

jest.mock('@utils/clientCache', () => ({
    getCachedPage: jest.fn(),
    getCachedValue: jest.fn(),
    setCachedValue: jest.fn(),
}));

const mockedApiUrl = jest.mocked(apiUrl);
const mockedGetJson = jest.mocked(getJson);
const mockedIsSwapiPagedResponse = jest.mocked(isSwapiPagedResponse);
const mockedGetCachedPage = jest.mocked(getCachedPage);
const mockedGetCachedValue = jest.mocked(getCachedValue);
const mockedSetCachedValue = jest.mocked(setCachedValue);
const mockedGetPreloadedCollection = jest.mocked(getPreloadedCollection);

function createFilm(id: number, title = `Film ${id}`): Film {
    return {
        title,
        episode_id: id,
        opening_crawl: 'Opening crawl',
        director: 'George Lucas',
        producer: 'Producer Name',
        release_date: '1977-05-25',
        characters: [],
        planets: [],
        starships: [],
        vehicles: [],
        species: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: `https://swapi.info/api/films/${id}`,
    };
}

describe('filmsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetPreloadedCollection.mockReturnValue(null);
    });

    test('fetchFilmsPage slices the preloaded films cache before falling back to the API', async () => {
        const allFilms = [createFilm(1), createFilm(2), createFilm(3), createFilm(4)];
        mockedGetCachedValue.mockReturnValue(allFilms);

        const result = await fetchFilmsPage(2, 2);
        expect(result).toEqual({
            films: [allFilms[2], allFilms[3]],
            hasMore: false,
        });
        expect(mockedGetJson).not.toHaveBeenCalled();
    });

    test('fetchFilmsPage caches full-list API responses and returns the requested page slice', async () => {
        const allFilms = [createFilm(1), createFilm(2), createFilm(3)];
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue(allFilms);

        const result = await fetchFilmsPage(1, 2);
        expect(mockedApiUrl).toHaveBeenCalledWith('/films?page=1');
        expect(mockedSetCachedValue).toHaveBeenCalledWith('films:all', allFilms, 300000);
        expect(result).toEqual({
            films: [allFilms[0], allFilms[1]],
            hasMore: true,
        });
    });

    test('fetchFilmsPage repopulates cache from preloaded data when the TTL cache expired', async () => {
        const preloadedFilms = [createFilm(1), createFilm(2), createFilm(3)];
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetPreloadedCollection.mockReturnValue(preloadedFilms);

        const result = await fetchFilmsPage(1, 2);

        expect(result).toEqual({
            films: [preloadedFilms[0], preloadedFilms[1]],
            hasMore: true,
        });
        expect(mockedSetCachedValue).toHaveBeenCalledWith('films:all', preloadedFilms, 300000);
        expect(mockedGetJson).not.toHaveBeenCalled();
    });

    test('fetchFilmsPage returns SWAPI paged results when the API responds with a page object', async () => {
        const pageResults = [createFilm(5, 'The Empire Strikes Back')];
        const pagedResponse = {
            count: 6,
            next: 'https://swapi.info/api/films?page=2',
            previous: null,
            results: pageResults,
        };

        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue(pagedResponse);
        mockedIsSwapiPagedResponse.mockReturnValue(true);

        const result = await fetchFilmsPage(1);
        expect(result).toEqual({
            films: pageResults,
            hasMore: true,
        });
    });

    test('loadFilms unwraps cached page data into the store-friendly shape', async () => {
        mockedGetCachedPage.mockResolvedValue({
            films: [createFilm(3, 'Return of the Jedi')],
            hasMore: false,
        });

        const result = await loadFilms(2);
        expect(result).toEqual({
            items: [createFilm(3, 'Return of the Jedi')],
            hasMore: false,
        });
        expect(mockedGetCachedPage).toHaveBeenCalledWith('films', 2, fetchFilmsPage, 300000);
    });

    test('fetchFilmsPage throws when the API response shape is not supported', async () => {
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue({ results: 'not-an-array' });
        mockedIsSwapiPagedResponse.mockReturnValue(false);
        await expect(fetchFilmsPage(1)).rejects.toThrow('Unexpected films response shape');
    });
});
