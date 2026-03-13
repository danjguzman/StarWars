import { MantineProvider } from '@mantine/core';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Films from '@pages/Films';
import AppModalHost from '@pages/_shared/AppModalHost';
import { useFilmsStore } from '@stores/filmsStore';
import { useModalStackStore } from '@stores/modalStackStore';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { clearResourceCaches, createHookStore, type HookStore } from '../../test/resourceTestUtils';

jest.mock('@stores/filmsStore', () => ({
    useFilmsStore: jest.fn(),
}));

jest.mock('@utils/layout', () => ({
    estimateInitialTargetCount: jest.fn(() => 12),
}));

jest.mock('@utils/useInfiniteScroll', () => ({
    useInfiniteScroll: jest.fn(() => ({ current: null })),
}));

const mockedUseFilmsStore = jest.mocked(useFilmsStore);

type FilmsStoreState = {
    films: ReturnType<typeof createFilm>[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    lastFailedRequestMode: 'initial' | 'nextPage' | null;
    hasMore: boolean;
    fetchFilms: jest.Mock<Promise<void>, [options?: { nextPage?: boolean; targetCount?: number }]>;
};

function createFilm(id: number, title: string) {
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

function LocationDisplay() {
    const location = useLocation();
    return <div data-testid="location-display">{location.pathname}</div>;
}

function renderFilmsPage(initialEntry: string) {
    return render(
        <MantineProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/films" element={<Films />} />
                    <Route path="/films/:filmId" element={<Films />} />
                </Routes>
                <AppModalHost />
                <LocationDisplay />
            </MemoryRouter>
        </MantineProvider>
    );
}

describe('Films page behavior', () => {
    const films = [
        createFilm(1, 'A New Hope'),
        createFilm(2, 'The Empire Strikes Back'),
        createFilm(3, 'Return of the Jedi'),
    ];

    afterEach(() => {
        act(() => {
            useModalStackStore.getState().resetStack();
        });
        clearResourceCaches();
        jest.clearAllMocks();
    });

    test('opens the real film modal from the grid and cycles through loaded films', async () => {
        const filmsStore = createHookStore<FilmsStoreState>({
            films,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: false,
            fetchFilms: jest.fn(async () => undefined),
        });
        mockedUseFilmsStore.mockImplementation(() => filmsStore.useStore());

        const user = userEvent.setup();
        renderFilmsPage('/films');

        await user.click(screen.getByRole('button', { name: 'Open A New Hope' }));

        const filmDialog = await screen.findByRole('dialog', { name: 'A New Hope details' });
        expect(within(filmDialog).getByText('Episode')).toBeInTheDocument();
        expect(within(filmDialog).getByText('Episode 1')).toBeInTheDocument();
        expect(within(filmDialog).getByText('1 / 3')).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/films/1');

        await user.click(screen.getByRole('button', { name: 'Previous item' }));

        const previousFilmDialog = await screen.findByRole('dialog', { name: 'Return of the Jedi details' });
        expect(within(previousFilmDialog).getByText('Episode 3')).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/films/3');

        await user.click(screen.getByRole('button', { name: 'Next item' }));

        expect(await screen.findByRole('dialog', { name: 'A New Hope details' })).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/films/1');

        await user.click(screen.getByRole('button', { name: 'Close modal' }));
        expect(screen.getByTestId('location-display')).toHaveTextContent('/films');
    });

    test('shows loading feedback for missing detail routes and then the unavailable empty state', async () => {
        const filmsStore = createHookStore<FilmsStoreState>({
            films: [],
            loading: true,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: true,
            fetchFilms: jest.fn(async () => undefined),
        });
        mockedUseFilmsStore.mockImplementation(() => filmsStore.useStore());

        renderFilmsPage('/films/99');

        expect(await screen.findByRole('dialog', { name: 'Loading Films details' })).toBeInTheDocument();
        expect(screen.getByText('Loading films details...')).toBeInTheDocument();

        act(() => {
            filmsStore.setState((currentState) => ({
                ...currentState,
                loading: false,
                hasMore: false,
            }));
        });

        expect(await screen.findByText('Films details are unavailable right now.')).toBeInTheDocument();
    });

    test('shows an error alert and recovers back to real browse results after retry', async () => {
        let skipInitialRequest = true;
        let filmsStore: HookStore<FilmsStoreState>;
        const fetchFilms = jest.fn(async () => {
            if (skipInitialRequest) {
                skipInitialRequest = false;
                return;
            }

            filmsStore.setState((currentState) => ({
                ...currentState,
                films,
                error: null,
                lastFailedRequestMode: null,
                hasMore: false,
            }));
        });

        filmsStore = createHookStore<FilmsStoreState>({
            films: [],
            loading: false,
            loadingMore: false,
            error: "We couldn't load the Films archive. Please try again.",
            lastFailedRequestMode: 'initial',
            hasMore: true,
            fetchFilms,
        });
        mockedUseFilmsStore.mockImplementation(() => filmsStore.useStore());

        const user = userEvent.setup();
        renderFilmsPage('/films');

        expect(await screen.findByRole('alert', { name: "Couldn't load the Films archive" })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Retry loading films' }));

        await waitFor(() => {
            expect(screen.queryByRole('alert', { name: "Couldn't load the Films archive" })).not.toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: 'Open A New Hope' })).toBeInTheDocument();
    });
});
