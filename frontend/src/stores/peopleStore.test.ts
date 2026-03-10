import { loadPeople } from '@services/peopleService';
import { usePeopleStore } from '@stores/peopleStore';
import { waitForMinimumLoading } from '@utils/loading';
import { collectPagedResourcesUntilTarget } from '@utils/pagedResource';
import type { Person } from '@types';

jest.mock('@services/peopleService', () => ({
    loadPeople: jest.fn(),
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

const mockedLoadPeople = jest.mocked(loadPeople);
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
        usePeopleStore.setState({
            people: [],
            loading: false,
            loadingMore: false,
            error: null,
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
        });
        await usePeopleStore.getState().fetchPeople({ nextPage: true });
        expect(mockedLoadPeople).not.toHaveBeenCalled();
        expect(mockedWaitForMinimumLoading).not.toHaveBeenCalled();
    });

    test('fetchPeople stores an error when the initial load fails', async () => {
        mockedCollectPagedResourcesUntilTarget.mockRejectedValue(new Error('boom'));
        await usePeopleStore.getState().fetchPeople({ targetCount: 12 });
        expect(usePeopleStore.getState()).toMatchObject({
            error: 'Failed to load people',
            loading: false,
            loadingMore: false,
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
        });
        mockedLoadPeople.mockRejectedValue(new Error('boom'));
        await usePeopleStore.getState().fetchPeople({ nextPage: true });
        expect(usePeopleStore.getState()).toMatchObject({
            error: 'Failed to load more people',
            loading: false,
            loadingMore: false,
            currentPage: 1,
        });
    });
});
