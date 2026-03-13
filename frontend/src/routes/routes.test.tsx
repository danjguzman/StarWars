import { MantineProvider } from '@mantine/core';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { homeRoutes } from '@routes/routes';
import { useFilmsStore } from '@stores/filmsStore';
import { useModalStackStore } from '@stores/modalStackStore';
import { usePeopleStore } from '@stores/peopleStore';
import { usePlanetsStore } from '@stores/planetsStore';
import { useSpeciesStore } from '@stores/speciesStore';
import { useStarshipsStore } from '@stores/starshipsStore';
import { useVehiclesStore } from '@stores/vehiclesStore';
import { MemoryRouter, Routes } from 'react-router-dom';

jest.mock('@stores/filmsStore', () => ({
    useFilmsStore: jest.fn(),
}));

jest.mock('@stores/peopleStore', () => ({
    usePeopleStore: jest.fn(),
}));

jest.mock('@stores/planetsStore', () => ({
    usePlanetsStore: jest.fn(),
}));

jest.mock('@stores/speciesStore', () => ({
    useSpeciesStore: jest.fn(),
}));

jest.mock('@stores/vehiclesStore', () => ({
    useVehiclesStore: jest.fn(),
}));

jest.mock('@stores/starshipsStore', () => ({
    useStarshipsStore: jest.fn(),
}));

jest.mock('@utils/useInfiniteScroll', () => ({
    useInfiniteScroll: jest.fn(() => ({ current: null })),
}));

const mockedUseFilmsStore = jest.mocked(useFilmsStore);
const mockedUsePeopleStore = jest.mocked(usePeopleStore);
const mockedUsePlanetsStore = jest.mocked(usePlanetsStore);
const mockedUseSpeciesStore = jest.mocked(useSpeciesStore);
const mockedUseVehiclesStore = jest.mocked(useVehiclesStore);
const mockedUseStarshipsStore = jest.mocked(useStarshipsStore);

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
        homeworld: '',
        films: [],
        species: [],
        vehicles: [],
        starships: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: `https://swapi.info/api/people/${id}`,
    };
}

function createPlanet(id: number, name: string) {
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

function createSpecies(id: number, name: string) {
    return {
        name,
        classification: 'mammal',
        designation: 'sentient',
        average_height: '180',
        skin_colors: 'fair',
        hair_colors: 'brown',
        eye_colors: 'blue',
        average_lifespan: '120',
        homeworld: '',
        language: 'Galactic Basic',
        people: [],
        films: [],
        created: '2026-01-01T00:00:00.000Z',
        edited: '2026-01-01T00:00:00.000Z',
        url: `https://swapi.info/api/species/${id}`,
    };
}

function createVehicle(id: number, name: string) {
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

function createStarship(id: number, name: string) {
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

function renderHomeRoutes(initialEntry: string) {
    return render(
        <MantineProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>{homeRoutes}</Routes>
            </MemoryRouter>
        </MantineProvider>
    );
}

describe('homeRoutes', () => {
    const originalScrollTo = window.scrollTo;

    beforeEach(() => {
        window.scrollTo = jest.fn();
        mockedUseFilmsStore.mockReturnValue({
            films: [createFilm(1, 'A New Hope')],
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: false,
            fetchFilms: jest.fn(async () => undefined),
        } as ReturnType<typeof useFilmsStore>);
        mockedUsePeopleStore.mockReturnValue({
            people: [createPerson(1, 'Luke Skywalker')],
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: false,
            fetchPeople: jest.fn(async () => undefined),
        } as ReturnType<typeof usePeopleStore>);
        mockedUsePlanetsStore.mockReturnValue({
            planets: [createPlanet(1, 'Tatooine')],
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: false,
            fetchPlanets: jest.fn(async () => undefined),
        } as ReturnType<typeof usePlanetsStore>);
        mockedUseSpeciesStore.mockReturnValue({
            species: [createSpecies(1, 'Human')],
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: false,
            fetchSpecies: jest.fn(async () => undefined),
        } as ReturnType<typeof useSpeciesStore>);
        mockedUseVehiclesStore.mockReturnValue({
            vehicles: [createVehicle(1, 'Snowspeeder')],
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: false,
            fetchVehicles: jest.fn(async () => undefined),
        } as ReturnType<typeof useVehiclesStore>);
        mockedUseStarshipsStore.mockReturnValue({
            starships: [createStarship(1, 'CR90 corvette')],
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: false,
            fetchStarships: jest.fn(async () => undefined),
        } as ReturnType<typeof useStarshipsStore>);
    });

    afterEach(() => {
        act(() => {
            useModalStackStore.getState().resetStack();
        });
        window.scrollTo = originalScrollTo;
        jest.clearAllMocks();
    });

    test('redirects the root route to the real films browse page', async () => {
        renderHomeRoutes('/');

        expect(await screen.findByRole('heading', { name: 'Films' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Open A New Hope' })).toBeInTheDocument();
    });

    test('loads the matching section page after clicking a header route', async () => {
        const user = userEvent.setup();
        renderHomeRoutes('/films');

        await user.click(screen.getByRole('link', { name: 'People' }));

        expect(await screen.findByRole('heading', { name: 'People' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Open Luke Skywalker' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Open A New Hope' })).not.toBeInTheDocument();
    });

    test.each([
        ['/films/1', 'Films', 'A New Hope details', 'Episode'],
        ['/people/1', 'People', 'Luke Skywalker details', 'Height'],
        ['/planets/1', 'Planets', 'Tatooine details', 'Climate'],
        ['/species/1', 'Species', 'Human details', 'Classification'],
        ['/vehicles/1', 'Vehicles', 'Snowspeeder details', 'Model'],
        ['/starships/1', 'Starships', 'CR90 corvette details', 'Hyperdrive'],
    ])('renders the real browse page and modal for %s', async (initialEntry, heading, dialogName, detailLabel) => {
        renderHomeRoutes(initialEntry);

        expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();

        const dialog = await screen.findByRole('dialog', { name: dialogName });
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText(detailLabel)).toBeInTheDocument();
    });

    test('scrolls back to the top when moving between top-level pages', async () => {
        const user = userEvent.setup();

        renderHomeRoutes('/films');
        await user.click(screen.getByRole('link', { name: 'Planets' }));

        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
    });

    test('shows the NotFound component for an unknown route', () => {
        renderHomeRoutes('/this-route-does-not-exist');
        expect(screen.getByRole('heading', { name: 'Not Found' })).toBeInTheDocument();
        expect(screen.getByText('The page you entered does not exist.')).toBeInTheDocument();
    });
});
