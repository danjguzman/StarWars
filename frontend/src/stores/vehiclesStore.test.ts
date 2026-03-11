import { loadVehicles } from '@services/vehiclesService';
import { useVehiclesStore } from '@stores/vehiclesStore';
import { waitForMinimumLoading } from '@utils/loading';
import { collectPagedResourcesUntilTarget } from '@utils/pagedResource';
import type { Vehicle } from '@types';

jest.mock('@services/vehiclesService', () => ({
    loadVehicles: jest.fn(),
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

const mockedLoadVehicles = jest.mocked(loadVehicles);
const mockedWaitForMinimumLoading = jest.mocked(waitForMinimumLoading);
const mockedCollectPagedResourcesUntilTarget = jest.mocked(collectPagedResourcesUntilTarget);

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

describe('vehiclesStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useVehiclesStore.setState({
            vehicles: [],
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            currentPage: 0,
            hasMore: true,
        });
    });

    test('fetchVehicles loads the initial collection and updates pagination state', async () => {
        const initialVehicles = [createVehicle(1), createVehicle(2)];
        mockedCollectPagedResourcesUntilTarget.mockResolvedValue({
            items: initialVehicles,
            currentPage: 1,
            hasMore: true,
        });

        await useVehiclesStore.getState().fetchVehicles({ targetCount: 12 });

        expect(mockedCollectPagedResourcesUntilTarget).toHaveBeenCalledWith({
            targetCount: 12,
            loadPage: loadVehicles,
        });
        expect(mockedWaitForMinimumLoading).toHaveBeenCalledTimes(1);
        expect(useVehiclesStore.getState()).toMatchObject({
            vehicles: initialVehicles,
            currentPage: 1,
            hasMore: true,
            loading: false,
            error: null,
            lastFailedRequestMode: null,
        });
    });

    test('fetchVehicles appends only unique vehicles when loading the next page', async () => {
        const existingVehicle = createVehicle(1, 'Snowspeeder');
        const newVehicle = createVehicle(2, 'T-16 Skyhopper');
        useVehiclesStore.setState({
            vehicles: [existingVehicle],
            currentPage: 1,
            hasMore: true,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
        });
        mockedLoadVehicles.mockResolvedValue({
            items: [existingVehicle, newVehicle],
            hasMore: true,
        });

        await useVehiclesStore.getState().fetchVehicles({ nextPage: true });

        expect(mockedLoadVehicles).toHaveBeenCalledWith(2);
        expect(useVehiclesStore.getState()).toMatchObject({
            vehicles: [existingVehicle, newVehicle],
            currentPage: 2,
            hasMore: true,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
        });
    });

    test('fetchVehicles stores an error when the initial load fails', async () => {
        mockedCollectPagedResourcesUntilTarget.mockRejectedValue(new Error('boom'));

        await useVehiclesStore.getState().fetchVehicles({ targetCount: 12 });

        expect(useVehiclesStore.getState()).toMatchObject({
            error: "We couldn't load the Vehicles archive. boom.",
            loading: false,
            loadingMore: false,
            lastFailedRequestMode: 'initial',
        });
    });

    test('fetchVehicles stores a pagination-specific error when loading more fails', async () => {
        useVehiclesStore.setState({
            vehicles: [createVehicle(1)],
            currentPage: 1,
            hasMore: true,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
        });
        mockedLoadVehicles.mockRejectedValue(new Error('boom'));

        await useVehiclesStore.getState().fetchVehicles({ nextPage: true });

        expect(useVehiclesStore.getState()).toMatchObject({
            error: "We couldn't load more vehicles. boom.",
            loading: false,
            loadingMore: false,
            lastFailedRequestMode: 'nextPage',
            currentPage: 1,
        });
    });
});
