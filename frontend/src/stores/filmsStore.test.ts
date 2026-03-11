import { loadFilms } from '@services/filmsService';
import { useFilmsStore } from '@stores/filmsStore';
import { waitForMinimumLoading } from '@utils/loading';
import { collectPagedResourcesUntilTarget } from '@utils/pagedResource';
import type { Film } from '@types';

jest.mock('@services/filmsService', () => ({
    loadFilms: jest.fn(),
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

const mockedLoadFilms = jest.mocked(loadFilms);
const mockedWaitForMinimumLoading = jest.mocked(waitForMinimumLoading);
const mockedCollectPagedResourcesUntilTarget = jest.mocked(collectPagedResourcesUntilTarget);

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

describe('filmsStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useFilmsStore.setState({
            films: [],
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            currentPage: 0,
            hasMore: true,
        });
    });

    test('fetchFilms loads the initial collection and updates pagination state', async () => {
        const initialFilms = [createFilm(1), createFilm(2)];
        mockedCollectPagedResourcesUntilTarget.mockResolvedValue({
            items: initialFilms,
            currentPage: 1,
            hasMore: true,
        });

        await useFilmsStore.getState().fetchFilms({ targetCount: 12 });

        expect(mockedCollectPagedResourcesUntilTarget).toHaveBeenCalledWith({
            targetCount: 12,
            loadPage: loadFilms,
        });
        expect(mockedWaitForMinimumLoading).toHaveBeenCalledTimes(1);
        expect(useFilmsStore.getState()).toMatchObject({
            films: initialFilms,
            currentPage: 1,
            hasMore: true,
            loading: false,
            error: null,
            lastFailedRequestMode: null,
        });
    });

    test('fetchFilms appends only unique films when loading the next page', async () => {
        const existingFilm = createFilm(1, 'A New Hope');
        const newFilm = createFilm(2, 'The Empire Strikes Back');
        useFilmsStore.setState({
            films: [existingFilm],
            currentPage: 1,
            hasMore: true,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
        });
        mockedLoadFilms.mockResolvedValue({
            items: [existingFilm, newFilm],
            hasMore: true,
        });

        await useFilmsStore.getState().fetchFilms({ nextPage: true });

        expect(mockedLoadFilms).toHaveBeenCalledWith(2);
        expect(useFilmsStore.getState()).toMatchObject({
            films: [existingFilm, newFilm],
            currentPage: 2,
            hasMore: true,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
        });
    });

    test('fetchFilms stores an error when the initial load fails', async () => {
        mockedCollectPagedResourcesUntilTarget.mockRejectedValue(new Error('boom'));

        await useFilmsStore.getState().fetchFilms({ targetCount: 12 });

        expect(useFilmsStore.getState()).toMatchObject({
            error: "We couldn't load the Films archive. boom.",
            loading: false,
            loadingMore: false,
            lastFailedRequestMode: 'initial',
        });
    });

    test('fetchFilms stores a pagination-specific error when loading more fails', async () => {
        useFilmsStore.setState({
            films: [createFilm(1)],
            currentPage: 1,
            hasMore: true,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
        });
        mockedLoadFilms.mockRejectedValue(new Error('boom'));

        await useFilmsStore.getState().fetchFilms({ nextPage: true });

        expect(useFilmsStore.getState()).toMatchObject({
            error: "We couldn't load more films. boom.",
            loading: false,
            loadingMore: false,
            lastFailedRequestMode: 'nextPage',
            currentPage: 1,
        });
    });
});
