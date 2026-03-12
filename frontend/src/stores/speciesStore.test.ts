import { loadSpecies } from '@services/speciesService';
import { useSpeciesStore } from '@stores/speciesStore';
import { waitForMinimumLoading } from '@utils/loading';
import { collectPagedResourcesUntilTarget } from '@utils/pagedResource';
import type { Species } from '@types';

jest.mock('@services/speciesService', () => ({
    loadSpecies: jest.fn(),
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

const mockedLoadSpecies = jest.mocked(loadSpecies);
const mockedWaitForMinimumLoading = jest.mocked(waitForMinimumLoading);
const mockedCollectPagedResourcesUntilTarget = jest.mocked(collectPagedResourcesUntilTarget);

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

describe('speciesStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useSpeciesStore.setState({
            species: [],
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            lastSyncedAt: null,
            currentPage: 0,
            hasMore: true,
        });
    });

    test('fetchSpecies loads the initial collection and updates pagination state', async () => {
        const initialSpecies = [createSpecies(1), createSpecies(2)];
        mockedCollectPagedResourcesUntilTarget.mockResolvedValue({
            items: initialSpecies,
            currentPage: 1,
            hasMore: true,
        });

        await useSpeciesStore.getState().fetchSpecies({ targetCount: 12 });

        expect(mockedCollectPagedResourcesUntilTarget).toHaveBeenCalledWith({
            targetCount: 12,
            loadPage: loadSpecies,
        });
        expect(mockedWaitForMinimumLoading).toHaveBeenCalledTimes(1);
        expect(useSpeciesStore.getState()).toMatchObject({
            species: initialSpecies,
            currentPage: 1,
            hasMore: true,
            loading: false,
            error: null,
            lastFailedRequestMode: null,
        });
    });

    test('fetchSpecies appends only unique species when loading the next page', async () => {
        const existingSpecies = createSpecies(1, 'Human');
        const newSpecies = createSpecies(2, 'Wookiee');
        useSpeciesStore.setState({
            species: [existingSpecies],
            currentPage: 1,
            hasMore: true,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            lastSyncedAt: null,
        });
        mockedLoadSpecies.mockResolvedValue({
            items: [existingSpecies, newSpecies],
            hasMore: true,
        });

        await useSpeciesStore.getState().fetchSpecies({ nextPage: true });

        expect(mockedLoadSpecies).toHaveBeenCalledWith(2);
        expect(useSpeciesStore.getState()).toMatchObject({
            species: [existingSpecies, newSpecies],
            currentPage: 2,
            hasMore: true,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
        });
    });

    test('fetchSpecies stores an error when the initial load fails', async () => {
        mockedCollectPagedResourcesUntilTarget.mockRejectedValue(new Error('boom'));

        await useSpeciesStore.getState().fetchSpecies({ targetCount: 12 });

        expect(useSpeciesStore.getState()).toMatchObject({
            error: "We couldn't load the Species archive. boom.",
            loading: false,
            loadingMore: false,
            lastFailedRequestMode: 'initial',
        });
    });

    test('fetchSpecies stores a pagination-specific error when loading more fails', async () => {
        useSpeciesStore.setState({
            species: [createSpecies(1)],
            currentPage: 1,
            hasMore: true,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            lastSyncedAt: null,
        });
        mockedLoadSpecies.mockRejectedValue(new Error('boom'));

        await useSpeciesStore.getState().fetchSpecies({ nextPage: true });

        expect(useSpeciesStore.getState()).toMatchObject({
            error: "We couldn't load more species. boom.",
            loading: false,
            loadingMore: false,
            lastFailedRequestMode: 'nextPage',
            currentPage: 1,
        });
    });
});
