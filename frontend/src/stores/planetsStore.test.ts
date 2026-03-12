import { loadPlanets } from '@services/planetsService';
import { usePlanetsStore } from '@stores/planetsStore';
import { waitForMinimumLoading } from '@utils/loading';
import { collectPagedResourcesUntilTarget } from '@utils/pagedResource';
import type { Planet } from '@types';

jest.mock('@services/planetsService', () => ({
    loadPlanets: jest.fn(),
}));

jest.mock('@utils/loading', () => ({
    waitForMinimumLoading: jest.fn(() => Promise.resolve()),
}));

jest.mock('@utils/pagedResource', () => {
    const actual = jest.requireActual('@utils/pagedResource');
    return {
        ...actual,
        collectPagedResourcesUntilTarget: jest.fn(),
    };
});

const mockedLoadPlanets = jest.mocked(loadPlanets);
const mockedWaitForMinimumLoading = jest.mocked(waitForMinimumLoading);
const mockedCollectPagedResourcesUntilTarget = jest.mocked(collectPagedResourcesUntilTarget);

function createPlanet(id: number, name = `Planet ${id}`): Planet {
    return {
        name,
        rotation_period: '24',
        orbital_period: '364',
        diameter: '10465',
        climate: 'temperate',
        gravity: '1 standard',
        terrain: 'grasslands, mountains',
        surface_water: '40',
        population: '200000',
        residents: [],
        films: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: `https://swapi.info/api/planets/${id}`,
    };
}

describe('planetsStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        usePlanetsStore.setState({
            planets: [],
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            lastSyncedAt: null,
            currentPage: 0,
            hasMore: true,
        });
    });

    test('fetchPlanets loads the initial collection and updates pagination state', async () => {
        const initialPlanets = [createPlanet(1), createPlanet(2)];
        mockedCollectPagedResourcesUntilTarget.mockResolvedValue({
            items: initialPlanets,
            currentPage: 1,
            hasMore: true,
        });

        await usePlanetsStore.getState().fetchPlanets({ targetCount: 12 });

        expect(mockedCollectPagedResourcesUntilTarget).toHaveBeenCalledWith({
            targetCount: 12,
            loadPage: loadPlanets,
        });
        expect(mockedWaitForMinimumLoading).toHaveBeenCalledTimes(1);
        expect(usePlanetsStore.getState()).toMatchObject({
            planets: initialPlanets,
            currentPage: 1,
            hasMore: true,
            loading: false,
            error: null,
            lastFailedRequestMode: null,
        });
    });

    test('fetchPlanets appends only unique planets when loading the next page', async () => {
        const existingPlanet = createPlanet(1, 'Tatooine');
        const newPlanet = createPlanet(2, 'Naboo');
        usePlanetsStore.setState({
            planets: [existingPlanet],
            currentPage: 1,
            hasMore: true,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            lastSyncedAt: null,
        });
        mockedLoadPlanets.mockResolvedValue({
            items: [existingPlanet, newPlanet],
            hasMore: true,
        });

        await usePlanetsStore.getState().fetchPlanets({ nextPage: true });

        expect(mockedLoadPlanets).toHaveBeenCalledWith(2);
        expect(usePlanetsStore.getState()).toMatchObject({
            planets: [existingPlanet, newPlanet],
            currentPage: 2,
            hasMore: true,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
        });
    });

    test('fetchPlanets stores an error when the initial load fails', async () => {
        mockedCollectPagedResourcesUntilTarget.mockRejectedValue(new Error('boom'));

        await usePlanetsStore.getState().fetchPlanets({ targetCount: 12 });

        expect(usePlanetsStore.getState()).toMatchObject({
            error: "We couldn't load the Planets archive. boom.",
            loading: false,
            loadingMore: false,
            lastFailedRequestMode: 'initial',
        });
    });

    test('fetchPlanets stores a pagination-specific error when loading more fails', async () => {
        usePlanetsStore.setState({
            planets: [createPlanet(1)],
            currentPage: 1,
            hasMore: true,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            lastSyncedAt: null,
        });
        mockedLoadPlanets.mockRejectedValue(new Error('boom'));

        await usePlanetsStore.getState().fetchPlanets({ nextPage: true });

        expect(usePlanetsStore.getState()).toMatchObject({
            error: "We couldn't load more planets. boom.",
            loading: false,
            loadingMore: false,
            lastFailedRequestMode: 'nextPage',
            currentPage: 1,
        });
    });
});
