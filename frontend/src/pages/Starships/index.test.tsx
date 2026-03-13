import { MantineProvider } from '@mantine/core';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StarshipsPage from '@pages/Starships';
import AppModalHost from '@pages/_shared/AppModalHost';
import { useModalStackStore } from '@stores/modalStackStore';
import { useStarshipsStore } from '@stores/starshipsStore';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { clearResourceCaches, createHookStore } from '../../test/resourceTestUtils';

jest.mock('@stores/starshipsStore', () => ({
    useStarshipsStore: jest.fn(),
}));

jest.mock('@utils/layout', () => ({
    estimateInitialTargetCount: jest.fn(() => 12),
}));

jest.mock('@utils/useInfiniteScroll', () => ({
    useInfiniteScroll: jest.fn(() => ({ current: null })),
}));

const mockedUseStarshipsStore = jest.mocked(useStarshipsStore);

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

function LocationDisplay() {
    const location = useLocation();
    return <div data-testid="location-display">{location.pathname}</div>;
}

function renderStarshipsPage(initialEntry: string) {
    return render(
        <MantineProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/starships" element={<StarshipsPage />} />
                    <Route path="/starships/:starshipId" element={<StarshipsPage />} />
                </Routes>
                <AppModalHost />
                <LocationDisplay />
            </MemoryRouter>
        </MantineProvider>
    );
}

describe('Starships page behavior', () => {
    const starships = [
        createStarship(1, 'CR90 corvette'),
        createStarship(2, 'Star Destroyer'),
        createStarship(3, 'Millennium Falcon'),
    ];

    afterEach(() => {
        act(() => {
            useModalStackStore.getState().resetStack();
        });
        clearResourceCaches();
        jest.clearAllMocks();
    });

    test('opens the real starship modal from the grid and cycles through loaded starships', async () => {
        const starshipsStore = createHookStore({
            starships,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: false,
            fetchStarships: jest.fn(async () => undefined),
        } as ReturnType<typeof useStarshipsStore>);
        mockedUseStarshipsStore.mockImplementation(() => starshipsStore.useStore());

        const user = userEvent.setup();
        renderStarshipsPage('/starships');

        await user.click(screen.getByRole('button', { name: 'Open CR90 corvette' }));

        const starshipDialog = await screen.findByRole('dialog', { name: 'CR90 corvette details' });
        expect(within(starshipDialog).getByText('Hyperdrive')).toBeInTheDocument();
        expect(within(starshipDialog).getByText('2.0')).toBeInTheDocument();
        expect(within(starshipDialog).getByText('1 / 3')).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/starships/1');

        await user.click(screen.getByRole('button', { name: 'Previous item' }));

        expect(await screen.findByRole('dialog', { name: 'Millennium Falcon details' })).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/starships/3');

        await user.click(screen.getByRole('button', { name: 'Next item' }));

        expect(await screen.findByRole('dialog', { name: 'CR90 corvette details' })).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/starships/1');
    });

    test('shows an error alert and recovers back to the real starships grid after retry', async () => {
        let skipInitialRequest = true;
        let starshipsStore: any;
        const fetchStarships = jest.fn(async () => {
            if (skipInitialRequest) {
                skipInitialRequest = false;
                return;
            }

            starshipsStore.setState((currentState: ReturnType<typeof useStarshipsStore>) => ({
                ...currentState,
                starships,
                error: null,
                lastFailedRequestMode: null,
                hasMore: false,
            }));
        });

        starshipsStore = createHookStore({
            starships: [],
            loading: false,
            loadingMore: false,
            error: "We couldn't load the Starships archive. Please try again.",
            lastFailedRequestMode: 'initial',
            hasMore: true,
            fetchStarships,
        } as ReturnType<typeof useStarshipsStore>);
        mockedUseStarshipsStore.mockImplementation(() => starshipsStore.useStore());

        const user = userEvent.setup();
        renderStarshipsPage('/starships');

        expect(await screen.findByRole('alert', { name: "Couldn't load the Starships archive" })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Retry loading starships' }));

        await waitFor(() => {
            expect(screen.queryByRole('alert', { name: "Couldn't load the Starships archive" })).not.toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: 'Open CR90 corvette' })).toBeInTheDocument();
    });
});
