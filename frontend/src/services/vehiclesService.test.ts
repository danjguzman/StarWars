import { fetchVehiclesPage, loadVehicles } from '@services/vehiclesService';
import { apiUrl, getJson, isSwapiPagedResponse } from '@services/api';
import { getPreloadedCollection } from '@services/preloadService';
import { getCachedPage, getCachedValue, setCachedValue } from '@utils/clientCache';
import type { Vehicle } from '@types';

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

function createVehicle(id: number, name = `Vehicle ${id}`): Vehicle {
    return {
        name,
        model: 'Model Name',
        manufacturer: 'Corellia Inc',
        cost_in_credits: '1000',
        length: '10',
        max_atmosphering_speed: '650',
        crew: '1',
        passengers: '2',
        cargo_capacity: '500',
        consumables: '1 week',
        vehicle_class: 'speeder',
        pilots: [],
        films: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: `https://swapi.info/api/vehicles/${id}`,
    };
}

describe('vehiclesService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetPreloadedCollection.mockReturnValue(null);
    });

    test('fetchVehiclesPage slices the preloaded vehicles cache before falling back to the API', async () => {
        const allVehicles = [createVehicle(1), createVehicle(2), createVehicle(3), createVehicle(4)];
        mockedGetCachedValue.mockReturnValue(allVehicles);

        const result = await fetchVehiclesPage(2, 2);
        expect(result).toEqual({
            vehicles: [allVehicles[2], allVehicles[3]],
            hasMore: false,
        });
        expect(mockedGetJson).not.toHaveBeenCalled();
    });

    test('fetchVehiclesPage caches full-list API responses and returns the requested page slice', async () => {
        const allVehicles = [createVehicle(1), createVehicle(2), createVehicle(3)];
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue(allVehicles);

        const result = await fetchVehiclesPage(1, 2);
        expect(mockedApiUrl).toHaveBeenCalledWith('/vehicles?page=1');
        expect(mockedSetCachedValue).toHaveBeenCalledWith('vehicles:all', allVehicles, 300000);
        expect(result).toEqual({
            vehicles: [allVehicles[0], allVehicles[1]],
            hasMore: true,
        });
    });

    test('fetchVehiclesPage repopulates cache from preloaded data when the TTL cache expired', async () => {
        const preloadedVehicles = [createVehicle(1), createVehicle(2), createVehicle(3)];
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetPreloadedCollection.mockReturnValue(preloadedVehicles);

        const result = await fetchVehiclesPage(1, 2);

        expect(result).toEqual({
            vehicles: [preloadedVehicles[0], preloadedVehicles[1]],
            hasMore: true,
        });
        expect(mockedSetCachedValue).toHaveBeenCalledWith('vehicles:all', preloadedVehicles, 300000);
        expect(mockedGetJson).not.toHaveBeenCalled();
    });

    test('fetchVehiclesPage returns SWAPI paged results when the API responds with a page object', async () => {
        const pageResults = [createVehicle(5, 'Snowspeeder')];
        const pagedResponse = {
            count: 39,
            next: 'https://swapi.info/api/vehicles?page=2',
            previous: null,
            results: pageResults,
        };

        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue(pagedResponse);
        mockedIsSwapiPagedResponse.mockReturnValue(true);

        const result = await fetchVehiclesPage(1);
        expect(result).toEqual({
            vehicles: pageResults,
            hasMore: true,
        });
    });

    test('loadVehicles unwraps cached page data into the store-friendly shape', async () => {
        mockedGetCachedPage.mockResolvedValue({
            vehicles: [createVehicle(3, 'Sand Crawler')],
            hasMore: false,
        });

        const result = await loadVehicles(2);
        expect(result).toEqual({
            items: [createVehicle(3, 'Sand Crawler')],
            hasMore: false,
        });
        expect(mockedGetCachedPage).toHaveBeenCalledWith('vehicles', 2, expect.any(Function), 300000);
    });

    test('fetchVehiclesPage throws when the API response shape is not supported', async () => {
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetJson.mockResolvedValue({ results: 'not-an-array' });
        mockedIsSwapiPagedResponse.mockReturnValue(false);
        await expect(fetchVehiclesPage(1)).rejects.toThrow('Unexpected vehicles response shape');
    });
});
