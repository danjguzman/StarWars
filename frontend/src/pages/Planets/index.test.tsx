import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Planets from '@pages/Planets';
import { usePlanetsStore } from '@stores/planetsStore';
import { getCachedValue } from '@utils/clientCache';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

jest.mock('@stores/planetsStore', () => ({
    usePlanetsStore: jest.fn(),
}));

jest.mock('@utils/clientCache', () => ({
    getCachedValue: jest.fn(),
}));

jest.mock('@utils/layout', () => ({
    estimateInitialTargetCount: jest.fn(() => 12),
}));

jest.mock('@components/PageTemplate/ListTemplate', () => ({
    __esModule: true,
    default: ({ items, onItemClick }: { items: Array<{ url: string; name: string }>; onItemClick?: (selection: { item: { url: string; name: string }; label: string }) => void }) => (
        <div>
            {items.map((item) => (
                <button
                    key={item.url}
                    type="button"
                    onClick={() => onItemClick?.({ item, label: item.name })}
                >
                    Open {item.name}
                </button>
            ))}
        </div>
    ),
}));

jest.mock('@pages/Planets/PlanetModalContent', () => ({
    __esModule: true,
    default: ({ planet, onPrev, onNext }: { planet: { name: string }; onPrev: () => void; onNext: () => void }) => (
        <div>
            <div>{planet.name} content</div>
            <button type="button" onClick={onPrev}>Prev planet</button>
            <button type="button" onClick={onNext}>Next planet</button>
        </div>
    ),
}));

const mockedUsePlanetsStore = jest.mocked(usePlanetsStore);
const mockedGetCachedValue = jest.mocked(getCachedValue);

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

function LocationDisplay() {
    const location = useLocation();
    return <div data-testid="location-display">{location.pathname}</div>;
}

function renderPlanetsPage(initialEntry: string) {
    return render(
        <MantineProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/planets" element={<Planets />} />
                    <Route path="/planets/:planetId" element={<Planets />} />
                </Routes>
                <LocationDisplay />
            </MemoryRouter>
        </MantineProvider>
    );
}

describe('Planets page modal behavior', () => {
    const planets = [
        createPlanet(1, 'Tatooine'),
        createPlanet(2, 'Alderaan'),
        createPlanet(3, 'Yavin IV'),
    ];

    beforeEach(() => {
        const fetchPlanets = jest.fn();
        mockedUsePlanetsStore.mockReturnValue({
            planets,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: true,
            fetchPlanets,
        } as ReturnType<typeof usePlanetsStore>);
        mockedGetCachedValue.mockImplementation((key) => (key === 'planets:all' ? planets : null));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('opens the modal from the list and closes back to the list route', async () => {
        const user = userEvent.setup();
        renderPlanetsPage('/planets');

        await user.click(screen.getByRole('button', { name: 'Open Tatooine' }));

        expect(screen.getByTestId('location-display')).toHaveTextContent('/planets/1');
        expect(screen.getByRole('dialog', { name: 'Tatooine details' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Close modal' }));

        expect(screen.getByTestId('location-display')).toHaveTextContent('/planets');
    });

    test('uses only the loaded planets store list for previous and next modal navigation', async () => {
        const user = userEvent.setup();
        const fetchPlanets = jest.fn();

        mockedUsePlanetsStore.mockReturnValue({
            planets: planets.slice(0, 2),
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: true,
            fetchPlanets,
        } as ReturnType<typeof usePlanetsStore>);
        mockedGetCachedValue.mockImplementation((key) => (key === 'planets:all' ? planets : null));

        renderPlanetsPage('/planets/1');

        await user.click(screen.getByRole('button', { name: 'Prev planet' }));
        expect(screen.getByTestId('location-display')).toHaveTextContent('/planets/2');

        await user.click(screen.getByRole('button', { name: 'Next planet' }));
        expect(screen.getByTestId('location-display')).toHaveTextContent('/planets/1');
        expect(fetchPlanets).not.toHaveBeenCalledWith({ nextPage: true });
    });

    test('shows a retry action when the initial planets load fails', async () => {
        const fetchPlanets = jest.fn();
        mockedUsePlanetsStore.mockReturnValue({
            planets: [],
            loading: false,
            loadingMore: false,
            error: "We couldn't load the Planets archive. Please try again.",
            lastFailedRequestMode: 'initial',
            hasMore: true,
            fetchPlanets,
        } as ReturnType<typeof usePlanetsStore>);
        mockedGetCachedValue.mockReturnValue(null);

        const user = userEvent.setup();
        renderPlanetsPage('/planets');

        expect(screen.getByRole('alert', { name: "Couldn't load the Planets archive" })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Retry loading planets' }));

        expect(fetchPlanets).toHaveBeenCalledWith({ targetCount: 12 });
    });
});
