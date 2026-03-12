import { MantineProvider } from '@mantine/core';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppModalHost from '@pages/_shared/AppModalHost';
import { useFilmsStore } from '@stores/filmsStore';
import { useModalStackStore } from '@stores/modalStackStore';
import { usePeopleStore } from '@stores/peopleStore';
import { getPreloadedCollection } from '@services/preloadService';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';

jest.mock('@stores/peopleStore', () => ({
    usePeopleStore: jest.fn(),
}));

jest.mock('@stores/filmsStore', () => ({
    useFilmsStore: jest.fn(),
}));

jest.mock('@services/preloadService', () => ({
    getPreloadedCollection: jest.fn(() => null),
}));

jest.mock('@pages/People/PersonModalContent', () => ({
    __esModule: true,
    default: ({ person }: { person: { name: string } }) => <div>{person.name} content</div>,
}));

jest.mock('@pages/Films/FilmModalContent', () => ({
    __esModule: true,
    default: ({ film }: { film: { title: string } }) => <div>{film.title} content</div>,
}));

const mockedUsePeopleStore = jest.mocked(usePeopleStore);
const mockedUseFilmsStore = jest.mocked(useFilmsStore);
const mockedGetPreloadedCollection = jest.mocked(getPreloadedCollection);

function createPerson(id: number, name: string) {
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

function createFilm(id: number, title: string) {
    return {
        title,
        episode_id: id,
        opening_crawl: 'Opening crawl',
        director: 'George Lucas',
        producer: 'Gary Kurtz',
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

function RouteControls() {
    const navigate = useNavigate();

    return (
        <button type="button" onClick={() => navigate('/films/1')}>
            Open related film
        </button>
    );
}

describe('AppModalHost', () => {
    beforeEach(() => {
        mockedUsePeopleStore.mockReturnValue({
            people: [createPerson(1, 'Luke Skywalker')],
            loading: false,
            loadingMore: false,
            error: null,
        } as ReturnType<typeof usePeopleStore>);
        mockedUseFilmsStore.mockReturnValue({
            films: [createFilm(1, 'A New Hope')],
            loading: false,
            loadingMore: false,
            error: null,
        } as ReturnType<typeof useFilmsStore>);
        mockedGetPreloadedCollection.mockReturnValue(null);
    });

    afterEach(() => {
        act(() => {
            useModalStackStore.getState().resetStack();
        });
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    test('briefly keeps the previous modal mounted while a related category opens on top', async () => {
        jest.useFakeTimers();
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        render(
            <MantineProvider>
                <MemoryRouter initialEntries={['/people/1']}>
                    <Routes>
                        <Route path="*" element={<RouteControls />} />
                    </Routes>
                    <AppModalHost />
                </MemoryRouter>
            </MantineProvider>
        );

        expect(await screen.findByRole('dialog', { name: 'Luke Skywalker details' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Open related film' }));

        expect(await screen.findByRole('dialog', { name: 'A New Hope details' })).toBeInTheDocument();
        expect(screen.getAllByRole('dialog')).toHaveLength(2);

        await act(async () => {
            jest.advanceTimersByTime(1000);
        });

        expect(screen.queryByRole('dialog', { name: 'Luke Skywalker details' })).not.toBeInTheDocument();
        expect(screen.getByRole('dialog', { name: 'A New Hope details' })).toBeInTheDocument();
    });
});
