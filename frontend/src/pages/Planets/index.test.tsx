import { MantineProvider } from '@mantine/core';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Planets from '@pages/Planets';
import AppModalHost from '@pages/_shared/AppModalHost';
import { useModalStackStore } from '@stores/modalStackStore';
import { usePlanetsStore } from '@stores/planetsStore';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { clearResourceCaches, createHookStore } from '../../test/resourceTestUtils';

jest.mock('@stores/planetsStore', () => ({
    usePlanetsStore: jest.fn(),
}));

jest.mock('@utils/layout', () => ({
    estimateInitialTargetCount: jest.fn(() => 12),
}));

jest.mock('@utils/useInfiniteScroll', () => ({
    useInfiniteScroll: jest.fn(() => ({ current: null })),
}));

const mockedUsePlanetsStore = jest.mocked(usePlanetsStore);

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
                <AppModalHost />
                <LocationDisplay />
            </MemoryRouter>
        </MantineProvider>
    );
}

describe('Planets page behavior', () => {
    const planets = [
        createPlanet(1, 'Tatooine'),
        createPlanet(2, 'Alderaan'),
        createPlanet(3, 'Yavin IV'),
    ];

    afterEach(() => {
        act(() => {
            useModalStackStore.getState().resetStack();
        });
        clearResourceCaches();
        jest.clearAllMocks();
    });

    test('opens the real planet modal from the grid and cycles through loaded planets', async () => {
        const planetsStore = createHookStore({
            planets,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: false,
            fetchPlanets: jest.fn(async () => undefined),
        } as ReturnType<typeof usePlanetsStore>);
        mockedUsePlanetsStore.mockImplementation(() => planetsStore.useStore());

        const user = userEvent.setup();
        renderPlanetsPage('/planets');

        await user.click(screen.getByRole('button', { name: 'Open Tatooine' }));

        const planetDialog = await screen.findByRole('dialog', { name: 'Tatooine details' });
        expect(within(planetDialog).getByText('Climate')).toBeInTheDocument();
        expect(within(planetDialog).getByText('temperate')).toBeInTheDocument();
        expect(within(planetDialog).getByText('1 / 3')).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/planets/1');

        await user.click(screen.getByRole('button', { name: 'Previous item' }));

        expect(await screen.findByRole('dialog', { name: 'Yavin IV details' })).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/planets/3');

        await user.click(screen.getByRole('button', { name: 'Next item' }));

        expect(await screen.findByRole('dialog', { name: 'Tatooine details' })).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/planets/1');
    });

    test('shows an error alert and recovers back to the real planets grid after retry', async () => {
        let skipInitialRequest = true;
        let planetsStore: any;
        const fetchPlanets = jest.fn(async () => {
            if (skipInitialRequest) {
                skipInitialRequest = false;
                return;
            }

            planetsStore.setState((currentState: ReturnType<typeof usePlanetsStore>) => ({
                ...currentState,
                planets,
                error: null,
                lastFailedRequestMode: null,
                hasMore: false,
            }));
        });

        planetsStore = createHookStore({
            planets: [],
            loading: false,
            loadingMore: false,
            error: "We couldn't load the Planets archive. Please try again.",
            lastFailedRequestMode: 'initial',
            hasMore: true,
            fetchPlanets,
        } as ReturnType<typeof usePlanetsStore>);
        mockedUsePlanetsStore.mockImplementation(() => planetsStore.useStore());

        const user = userEvent.setup();
        renderPlanetsPage('/planets');

        expect(await screen.findByRole('alert', { name: "Couldn't load the Planets archive" })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Retry loading planets' }));

        await waitFor(() => {
            expect(screen.queryByRole('alert', { name: "Couldn't load the Planets archive" })).not.toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: 'Open Tatooine' })).toBeInTheDocument();
    });
});
