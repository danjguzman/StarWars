import { loadStarships } from '@services/starshipsService';
import { useStarshipsStore } from '@stores/starshipsStore';
import { waitForMinimumLoading } from '@utils/loading';
import { collectPagedResourcesUntilTarget } from '@utils/pagedResource';
import type { Starship } from '@types';

jest.mock('@services/starshipsService', () => ({
    loadStarships: jest.fn(),
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

const mockedLoadStarships = jest.mocked(loadStarships);
const mockedWaitForMinimumLoading = jest.mocked(waitForMinimumLoading);
const mockedCollectPagedResourcesUntilTarget = jest.mocked(collectPagedResourcesUntilTarget);

function createStarship(id: number, name = `Starship ${id}`): Starship {
    return {
        name,
        model: 'Model Name',
        manufacturer: 'Corellia Inc',
        cost_in_credits: '100000',
        length: '150',
        max_atmosphering_speed: '1050',
        crew: '4',
        passengers: '6',
        cargo_capacity: '50000',
        consumables: '2 months',
        hyperdrive_rating: '2.0',
        MGLT: '70',
        starship_class: 'corvette',
        pilots: [],
        films: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: `https://swapi.info/api/starships/${id}`,
    };
}

describe('starshipsStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useStarshipsStore.setState({
            starships: [],
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            currentPage: 0,
            hasMore: true,
        });
    });

    test('fetchStarships loads the initial collection and updates pagination state', async () => {
        const initialStarships = [createStarship(1), createStarship(2)];
        mockedCollectPagedResourcesUntilTarget.mockResolvedValue({
            items: initialStarships,
            currentPage: 1,
            hasMore: true,
        });

        await useStarshipsStore.getState().fetchStarships({ targetCount: 12 });

        expect(mockedCollectPagedResourcesUntilTarget).toHaveBeenCalledWith({
            targetCount: 12,
            loadPage: loadStarships,
        });
        expect(mockedWaitForMinimumLoading).toHaveBeenCalledTimes(1);
        expect(useStarshipsStore.getState()).toMatchObject({
            starships: initialStarships,
            currentPage: 1,
            hasMore: true,
            loading: false,
            error: null,
            lastFailedRequestMode: null,
        });
    });

    test('fetchStarships appends only unique starships when loading the next page', async () => {
        const existingStarship = createStarship(1, 'CR90 corvette');
        const newStarship = createStarship(2, 'Star Destroyer');
        useStarshipsStore.setState({
            starships: [existingStarship],
            currentPage: 1,
            hasMore: true,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
        });
        mockedLoadStarships.mockResolvedValue({
            items: [existingStarship, newStarship],
            hasMore: true,
        });

        await useStarshipsStore.getState().fetchStarships({ nextPage: true });

        expect(mockedLoadStarships).toHaveBeenCalledWith(2);
        expect(useStarshipsStore.getState()).toMatchObject({
            starships: [existingStarship, newStarship],
            currentPage: 2,
            hasMore: true,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
        });
    });

    test('fetchStarships stores an error when the initial load fails', async () => {
        mockedCollectPagedResourcesUntilTarget.mockRejectedValue(new Error('boom'));

        await useStarshipsStore.getState().fetchStarships({ targetCount: 12 });

        expect(useStarshipsStore.getState()).toMatchObject({
            error: "We couldn't load the Starships archive. boom.",
            loading: false,
            loadingMore: false,
            lastFailedRequestMode: 'initial',
        });
    });

    test('fetchStarships stores a pagination-specific error when loading more fails', async () => {
        useStarshipsStore.setState({
            starships: [createStarship(1)],
            currentPage: 1,
            hasMore: true,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
        });
        mockedLoadStarships.mockRejectedValue(new Error('boom'));

        await useStarshipsStore.getState().fetchStarships({ nextPage: true });

        expect(useStarshipsStore.getState()).toMatchObject({
            error: "We couldn't load more starships. boom.",
            loading: false,
            loadingMore: false,
            lastFailedRequestMode: 'nextPage',
            currentPage: 1,
        });
    });
});
