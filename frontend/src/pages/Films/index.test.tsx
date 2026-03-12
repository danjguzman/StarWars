import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Films from '@pages/Films';
import { useFilmsStore } from '@stores/filmsStore';
import { getCachedValue } from '@utils/clientCache';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

jest.mock('@stores/filmsStore', () => ({
    useFilmsStore: jest.fn(),
}));

jest.mock('@utils/clientCache', () => ({
    getCachedValue: jest.fn(),
}));

jest.mock('@utils/layout', () => ({
    estimateInitialTargetCount: jest.fn(() => 12),
}));

jest.mock('@components/PageTemplate/ListTemplate', () => ({
    __esModule: true,
    default: ({ items, onItemClick }: { items: Array<{ url: string; title: string }>; onItemClick?: (selection: { item: { url: string; title: string }; label: string }) => void }) => (
        <div>
            {items.map((item) => (
                <button
                    key={item.url}
                    type="button"
                    onClick={() => onItemClick?.({ item, label: item.title })}
                >
                    Open {item.title}
                </button>
            ))}
        </div>
    ),
}));

jest.mock('@pages/Films/FilmModalContent', () => ({
    __esModule: true,
    default: ({ film, onPrev, onNext }: { film: { title: string }; onPrev: () => void; onNext: () => void }) => (
        <div>
            <div>{film.title} content</div>
            <button type="button" onClick={onPrev}>Prev film</button>
            <button type="button" onClick={onNext}>Next film</button>
        </div>
    ),
}));

const mockedUseFilmsStore = jest.mocked(useFilmsStore);
const mockedGetCachedValue = jest.mocked(getCachedValue);

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
                <LocationDisplay />
            </MemoryRouter>
        </MantineProvider>
    );
}

describe('Films page modal behavior', () => {
    const films = [
        createFilm(1, 'A New Hope'),
        createFilm(2, 'The Empire Strikes Back'),
        createFilm(3, 'Return of the Jedi'),
    ];

    beforeEach(() => {
        const fetchFilms = jest.fn();
        mockedUseFilmsStore.mockReturnValue({
            films,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: true,
            fetchFilms,
        } as ReturnType<typeof useFilmsStore>);
        mockedGetCachedValue.mockImplementation((key) => (key === 'films:all' ? films : null));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('opens the modal from the list and closes back to the list route', async () => {
        const user = userEvent.setup();
        renderFilmsPage('/films');

        await user.click(screen.getByRole('button', { name: 'Open A New Hope' }));

        expect(screen.getByTestId('location-display')).toHaveTextContent('/films/1');
        expect(screen.getByRole('dialog', { name: 'A New Hope details' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Close modal' }));

        expect(screen.getByTestId('location-display')).toHaveTextContent('/films');
    });

    test('uses only the loaded films store list for previous and next modal navigation', async () => {
        const user = userEvent.setup();
        const fetchFilms = jest.fn();

        mockedUseFilmsStore.mockReturnValue({
            films: films.slice(0, 2),
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: true,
            fetchFilms,
        } as ReturnType<typeof useFilmsStore>);
        mockedGetCachedValue.mockImplementation((key) => (key === 'films:all' ? films : null));

        renderFilmsPage('/films/1');

        await user.click(screen.getByRole('button', { name: 'Prev film' }));
        expect(screen.getByTestId('location-display')).toHaveTextContent('/films/2');

        await user.click(screen.getByRole('button', { name: 'Next film' }));
        expect(screen.getByTestId('location-display')).toHaveTextContent('/films/1');
        expect(fetchFilms).not.toHaveBeenCalledWith({ nextPage: true });
    });

    test('shows a retry action when the initial films load fails', async () => {
        const fetchFilms = jest.fn();
        mockedUseFilmsStore.mockReturnValue({
            films: [],
            loading: false,
            loadingMore: false,
            error: "We couldn't load the Films archive. Please try again.",
            lastFailedRequestMode: 'initial',
            hasMore: true,
            fetchFilms,
        } as ReturnType<typeof useFilmsStore>);
        mockedGetCachedValue.mockReturnValue(null);

        const user = userEvent.setup();
        renderFilmsPage('/films');

        expect(screen.getByRole('alert', { name: "Couldn't load the Films archive" })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Retry loading films' }));

        expect(fetchFilms).toHaveBeenCalledWith({ targetCount: 12 });
    });
});
