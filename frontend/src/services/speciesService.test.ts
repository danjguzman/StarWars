import { fetchSpeciesPage, loadSpecies } from '@services/speciesService';
import { apiUrl, getJson, isSwapiPagedResponse } from '@services/api';
import { getCachedPage, getCachedValue, setCachedValue } from '@utils/clientCache';
import type { Species } from '@types';

jest.mock('@services/api', () => ({
    apiUrl: jest.fn((path: string) => `https://swapi.info/api${path}`),
    getJson: jest.fn(),
    isSwapiPagedResponse: jest.fn(),
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

function createSpecies(id: number, name = `Species ${id}`): Species {
    return {
        name,
        classification: 'mammal',
        designation: 'sentient',
        average_height: '180',
        skin_colors: 'fair',
        hair_colors: 'brown',
        eye_colors: 'blue',
        average_lifespan: '120',
        homeworld: 'https://swapi.info/api/planets/1',
        language: 'Galactic Basic',
        people: [],
        films: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: `https://swapi.info/api/species/${id}`,
    };
}

describe('speciesService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('fetchSpeciesPage slices the preloaded species cache before falling back to the API', async () => {
        const allSpecies = [createSpecies(1), createSpecies(2), createSpecies(3), createSpecies(4)];
        mockedGetCachedValue.mockReturnValue(allSpecies);

        const result = await fetchSpeciesPage(2, 2);
        expect(result).toEqual({
            species: [allSpecies[2], allSpecies[3]],
            hasMore: false,
        });
        expect(mockedGetJson).not.toHaveBeenCalled();
    });

    test('fetchSpeciesPage caches full-list API responses and returns the requested page slice', async () => {
        const allSpecies = [createSpecies(1), createSpecies(2), createSpecies(3)];
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue(allSpecies);

        const result = await fetchSpeciesPage(1, 2);
        expect(mockedApiUrl).toHaveBeenCalledWith('/species?page=1');
        expect(mockedSetCachedValue).toHaveBeenCalledWith('species:all', allSpecies, 300000);
        expect(result).toEqual({
            species: [allSpecies[0], allSpecies[1]],
            hasMore: true,
        });
    });

    test('fetchSpeciesPage returns SWAPI paged results when the API responds with a page object', async () => {
        const pageResults = [createSpecies(5, 'Wookiee')];
        const pagedResponse = {
            count: 37,
            next: 'https://swapi.info/api/species?page=2',
            previous: null,
            results: pageResults,
        };

        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue(pagedResponse);
        mockedIsSwapiPagedResponse.mockReturnValue(true);

        const result = await fetchSpeciesPage(1);
        expect(result).toEqual({
            species: pageResults,
            hasMore: true,
        });
    });

    test('loadSpecies unwraps cached page data into the store-friendly shape', async () => {
        mockedGetCachedPage.mockResolvedValue({
            species: [createSpecies(2, 'Droid')],
            hasMore: false,
        });

        const result = await loadSpecies(2);
        expect(result).toEqual({
            items: [createSpecies(2, 'Droid')],
            hasMore: false,
        });
        expect(mockedGetCachedPage).toHaveBeenCalledWith('species', 2, expect.any(Function), 300000);
    });

    test('fetchSpeciesPage throws when the API response shape is not supported', async () => {
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue({ results: 'not-an-array' });
        mockedIsSwapiPagedResponse.mockReturnValue(false);
        await expect(fetchSpeciesPage(1)).rejects.toThrow('Unexpected species response shape');
    });
});
