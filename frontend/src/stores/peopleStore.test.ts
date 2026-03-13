import { loadPeople } from '@services/peopleService';
import { getPreloadedCollection } from '@services/preloadService';
import { usePeopleStore } from '@stores/peopleStore';
import { getCachedValue, invalidatePageCache } from '@utils/clientCache';
import { PEOPLE_ALL_CACHE_TTL_MS } from '@utils/consts';
import { waitForMinimumLoading } from '@utils/loading';
import { collectPagedResourcesUntilTarget } from '@utils/pagedResource';
import type { Person } from '@types';

jest.mock('@services/peopleService', () => ({
    loadPeople: jest.fn(),
}));

jest.mock('@utils/loading', () => ({
    waitForMinimumLoading: jest.fn(() => Promise.resolve()),
}));

jest.mock('@services/preloadService', () => ({
    getPreloadedCollection: jest.fn(() => null),
}));

jest.mock('@utils/clientCache', () => ({
    getCachedValue: jest.fn(() => null),
    invalidatePageCache: jest.fn(),
}));

jest.mock('@utils/pagedResource', () => {
    const actual = jest.requireActual('@utils/pagedResource');
    return {
        ...actual,
        collectPagedResourcesUntilTarget: jest.fn(),
    };
});

const mockedLoadPeople = jest.mocked(loadPeople);
const mockedGetCachedValue = jest.mocked(getCachedValue);
const mockedGetPreloadedCollection = jest.mocked(getPreloadedCollection);
const mockedInvalidatePageCache = jest.mocked(invalidatePageCache);
const mockedWaitForMinimumLoading = jest.mocked(waitForMinimumLoading);
const mockedCollectPagedResourcesUntilTarget = jest.mocked(collectPagedResourcesUntilTarget);

function createPerson(id: number, name = `Person ${id}`): Person {
    return {
        name,
        height: '172',
        mass: '77',
        hair_color: 'blond',
        skin_color: 'fair',
        eye_color: 'blue',
        birth_year: '19BBY',
        gender: 'male',
        homeworld: 'https://swapi.info/api/planets/1',
        films: [],
        species: [],
        vehicles: [],
        starships: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: `https://swapi.info/api/people/${id}`,
    };
}

describe('peopleStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetCachedValue.mockReturnValue(null);
        mockedGetPreloadedCollection.mockReturnValue(null);
        usePeopleStore.setState({
            people: [],
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            lastSyncedAt: null,
            currentPage: 0,
            hasMore: true,
        });
    });

    test('fetchPeople loads the initial collection and updates pagination state', async () => {
        const initialPeople = [createPerson(1), createPerson(2)];
        mockedCollectPagedResourcesUntilTarget.mockResolvedValue({
            items: initialPeople,
            currentPage: 2,
            hasMore: true,
        });
        await usePeopleStore.getState().fetchPeople({ targetCount: 18 });
        expect(mockedCollectPagedResourcesUntilTarget).toHaveBeenCalledWith({
            targetCount: 18,
            loadPage: loadPeople,
        });
        expect(mockedWaitForMinimumLoading).toHaveBeenCalledTimes(1);
        expect(usePeopleStore.getState()).toMatchObject({
            people: initialPeople,
            currentPage: 2,
            hasMore: true,
            loading: false,
            error: null,
            lastFailedRequestMode: null,
        });
    });

    test('fetchPeople appends only unique people when loading the next page', async () => {
        const existingPerson = createPerson(1, 'Luke Skywalker');
        const newPerson = createPerson(2, 'Leia Organa');
        usePeopleStore.setState({
            people: [existingPerson],
            currentPage: 1,
            hasMore: true,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            lastSyncedAt: null,
        });
        mockedLoadPeople.mockResolvedValue({
            items: [existingPerson, newPerson],
            hasMore: true,
        });
        await usePeopleStore.getState().fetchPeople({ nextPage: true });
        expect(mockedLoadPeople).toHaveBeenCalledWith(2);
        expect(usePeopleStore.getState()).toMatchObject({
            people: [existingPerson, newPerson],
            currentPage: 2,
            hasMore: true,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
        });
    });

    test('fetchPeople skips next-page requests when there is no more data to load', async () => {
        usePeopleStore.setState({
            people: [createPerson(1)],
            currentPage: 1,
            hasMore: false,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            lastSyncedAt: null,
        });
        await usePeopleStore.getState().fetchPeople({ nextPage: true });
        expect(mockedLoadPeople).not.toHaveBeenCalled();
        expect(mockedWaitForMinimumLoading).not.toHaveBeenCalled();
    });

    test('fetchPeople stores an error when the initial load fails', async () => {
        mockedCollectPagedResourcesUntilTarget.mockRejectedValue(new Error('boom'));
        await usePeopleStore.getState().fetchPeople({ targetCount: 12 });
        expect(usePeopleStore.getState()).toMatchObject({
            error: "We couldn't load the People archive. boom.",
            loading: false,
            loadingMore: false,
            lastFailedRequestMode: 'initial',
        });
    });

    test('fetchPeople stores a pagination-specific error when loading more fails', async () => {
        usePeopleStore.setState({
            people: [createPerson(1)],
            currentPage: 1,
            hasMore: true,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            lastSyncedAt: null,
        });
        mockedLoadPeople.mockRejectedValue(new Error('boom'));
        await usePeopleStore.getState().fetchPeople({ nextPage: true });
        expect(usePeopleStore.getState()).toMatchObject({
            error: "We couldn't load more people. boom.",
            loading: false,
            loadingMore: false,
            lastFailedRequestMode: 'nextPage',
            currentPage: 1,
        });
    });

    test('fetchPeople resets expired data back to the first page without reloading', async () => {
        const preloadedPeople = Array.from({ length: 20 }, (_, index) => createPerson(index + 1));

        mockedGetPreloadedCollection.mockReturnValue(preloadedPeople);
        usePeopleStore.setState({
            people: preloadedPeople.slice(0, 18),
            currentPage: 2,
            hasMore: true,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            lastSyncedAt: Date.now() - PEOPLE_ALL_CACHE_TTL_MS - 1,
        });

        await usePeopleStore.getState().fetchPeople({ targetCount: 12 });

        expect(mockedInvalidatePageCache).toHaveBeenCalledWith('people');
        expect(mockedCollectPagedResourcesUntilTarget).not.toHaveBeenCalled();
        expect(usePeopleStore.getState()).toMatchObject({
            people: preloadedPeople.slice(0, 12),
            currentPage: 1,
            hasMore: true,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
        });
    });
});
