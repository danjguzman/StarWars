import { MantineProvider } from '@mantine/core';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VehiclesPage from '@pages/Vehicles';
import AppModalHost from '@pages/_shared/AppModalHost';
import { useModalStackStore } from '@stores/modalStackStore';
import { useVehiclesStore } from '@stores/vehiclesStore';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { clearResourceCaches, createHookStore } from '../../test/resourceTestUtils';

jest.mock('@stores/vehiclesStore', () => ({
    useVehiclesStore: jest.fn(),
}));

jest.mock('@utils/layout', () => ({
    estimateInitialTargetCount: jest.fn(() => 12),
}));

jest.mock('@utils/useInfiniteScroll', () => ({
    useInfiniteScroll: jest.fn(() => ({ current: null })),
}));

const mockedUseVehiclesStore = jest.mocked(useVehiclesStore);

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

function LocationDisplay() {
    const location = useLocation();
    return <div data-testid="location-display">{location.pathname}</div>;
}

function renderVehiclesPage(initialEntry: string) {
    return render(
        <MantineProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/vehicles" element={<VehiclesPage />} />
                    <Route path="/vehicles/:vehicleId" element={<VehiclesPage />} />
                </Routes>
                <AppModalHost />
                <LocationDisplay />
            </MemoryRouter>
        </MantineProvider>
    );
}

describe('Vehicles page behavior', () => {
    const vehicles = [
        createVehicle(1, 'Snowspeeder'),
        createVehicle(2, 'Sand Crawler'),
        createVehicle(3, 'AT-ST'),
    ];

    afterEach(() => {
        act(() => {
            useModalStackStore.getState().resetStack();
        });
        clearResourceCaches();
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    test('opens the real vehicle modal from the grid and cycles through loaded vehicles', async () => {
        const vehiclesStore = createHookStore({
            vehicles,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: false,
            fetchVehicles: jest.fn(async () => undefined),
        } as ReturnType<typeof useVehiclesStore>);
        mockedUseVehiclesStore.mockImplementation(() => vehiclesStore.useStore());

        const user = userEvent.setup();
        renderVehiclesPage('/vehicles');

        await user.click(screen.getByRole('button', { name: 'Open Snowspeeder' }));

        const vehicleDialog = await screen.findByRole('dialog', { name: 'Snowspeeder details' });
        expect(within(vehicleDialog).getByText('Model')).toBeInTheDocument();
        expect(within(vehicleDialog).getByText('Snowspeeder')).toBeInTheDocument();
        expect(within(vehicleDialog).getByText('1 / 3')).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/vehicles/1');

        await user.click(screen.getByRole('button', { name: 'Previous item' }));

        expect(await screen.findByRole('dialog', { name: 'AT-ST details' })).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/vehicles/3');

        await user.click(screen.getByRole('button', { name: 'Next item' }));

        expect(await screen.findByRole('dialog', { name: 'Snowspeeder details' })).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/vehicles/1');
    });

    test('shows an error alert and recovers back to the real vehicles grid after retry', async () => {
        let skipInitialRequest = true;
        let vehiclesStore: any;
        const fetchVehicles = jest.fn(async () => {
            if (skipInitialRequest) {
                skipInitialRequest = false;
                return;
            }

            vehiclesStore.setState((currentState: ReturnType<typeof useVehiclesStore>) => ({
                ...currentState,
                vehicles,
                error: null,
                lastFailedRequestMode: null,
                hasMore: false,
            }));
        });

        vehiclesStore = createHookStore({
            vehicles: [],
            loading: false,
            loadingMore: false,
            error: "We couldn't load the Vehicles archive. Please try again.",
            lastFailedRequestMode: 'initial',
            hasMore: true,
            fetchVehicles,
        } as ReturnType<typeof useVehiclesStore>);
        mockedUseVehiclesStore.mockImplementation(() => vehiclesStore.useStore());

        const user = userEvent.setup();
        renderVehiclesPage('/vehicles');

        expect(await screen.findByRole('alert', { name: "Couldn't load the Vehicles archive" })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Retry loading vehicles' }));

        await waitFor(() => {
            expect(screen.queryByRole('alert', { name: "Couldn't load the Vehicles archive" })).not.toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: 'Open Snowspeeder' })).toBeInTheDocument();
    });

    test('debounces search results, shows the empty state, and opens the selected vehicle', async () => {
        jest.useFakeTimers();
        const vehiclesStore = createHookStore({
            vehicles: vehicles.slice(0, 2),
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: false,
            fetchVehicles: jest.fn(async () => undefined),
        } as ReturnType<typeof useVehiclesStore>);
        mockedUseVehiclesStore.mockImplementation(() => vehiclesStore.useStore());

        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        renderVehiclesPage('/vehicles');

        await user.type(screen.getByRole('textbox', { name: 'Search vehicles' }), 'walker');

        expect(screen.getByRole('listbox', { name: 'Search vehicles results' })).toBeInTheDocument();
        expect(screen.getByText('Updating results...')).toBeInTheDocument();

        await act(async () => {
            jest.advanceTimersByTime(250);
        });

        expect(await screen.findByRole('listbox', { name: 'Search vehicles results' })).toBeInTheDocument();
        expect(screen.getByText('No matching vehicles loaded on this page yet.')).toBeInTheDocument();

        await user.clear(screen.getByRole('textbox', { name: 'Search vehicles' }));
        await user.type(screen.getByRole('textbox', { name: 'Search vehicles' }), 'snow');

        expect(screen.getByText('Updating results...')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Snowspeeder' })).not.toBeInTheDocument();

        await act(async () => {
            jest.advanceTimersByTime(250);
        });

        await user.click(await screen.findByRole('button', { name: 'Snowspeeder' }));

        expect(screen.queryByRole('listbox', { name: 'Search vehicles results' })).not.toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/vehicles/1');
        expect(await screen.findByRole('dialog', { name: 'Snowspeeder details' })).toBeInTheDocument();
    });
});
