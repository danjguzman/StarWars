import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VehiclesPage from '@pages/Vehicles';
import { useVehiclesStore } from '@stores/vehiclesStore';
import { getCachedValue } from '@utils/clientCache';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

jest.mock('@stores/vehiclesStore', () => ({
    useVehiclesStore: jest.fn(),
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

jest.mock('@pages/Vehicles/VehicleModalContent', () => ({
    __esModule: true,
    default: ({ vehicle, onPrev, onNext }: { vehicle: { name: string }; onPrev: () => void; onNext: () => void }) => (
        <div>
            <div>{vehicle.name} content</div>
            <button type="button" onClick={onPrev}>Prev vehicle</button>
            <button type="button" onClick={onNext}>Next vehicle</button>
        </div>
    ),
}));

const mockedUseVehiclesStore = jest.mocked(useVehiclesStore);
const mockedGetCachedValue = jest.mocked(getCachedValue);

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
                <LocationDisplay />
            </MemoryRouter>
        </MantineProvider>
    );
}

describe('Vehicles page modal behavior', () => {
    const vehicles = [
        createVehicle(1, 'Snowspeeder'),
        createVehicle(2, 'Sand Crawler'),
        createVehicle(3, 'AT-ST'),
    ];

    beforeEach(() => {
        const fetchVehicles = jest.fn();
        mockedUseVehiclesStore.mockReturnValue({
            vehicles,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: true,
            fetchVehicles,
        } as ReturnType<typeof useVehiclesStore>);
        mockedGetCachedValue.mockImplementation((key) => (key === 'vehicles:all' ? vehicles : null));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('opens the modal from the list and closes back to the list route', async () => {
        const user = userEvent.setup();
        renderVehiclesPage('/vehicles');

        await user.click(screen.getByRole('button', { name: 'Open Snowspeeder' }));

        expect(screen.getByTestId('location-display')).toHaveTextContent('/vehicles/1');
        expect(screen.getByRole('dialog', { name: 'Snowspeeder details' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Close modal' }));

        expect(screen.getByTestId('location-display')).toHaveTextContent('/vehicles');
    });

    test('uses the cached vehicles list for previous and next modal navigation', async () => {
        const user = userEvent.setup();
        renderVehiclesPage('/vehicles/1');

        await user.click(screen.getByRole('button', { name: 'Prev vehicle' }));
        expect(screen.getByTestId('location-display')).toHaveTextContent('/vehicles/3');

        await user.click(screen.getByRole('button', { name: 'Next vehicle' }));
        expect(screen.getByTestId('location-display')).toHaveTextContent('/vehicles/1');
    });

    test('shows a retry action when the initial vehicles load fails', async () => {
        const fetchVehicles = jest.fn();
        mockedUseVehiclesStore.mockReturnValue({
            vehicles: [],
            loading: false,
            loadingMore: false,
            error: "We couldn't load the Vehicles archive. Please try again.",
            lastFailedRequestMode: 'initial',
            hasMore: true,
            fetchVehicles,
        } as ReturnType<typeof useVehiclesStore>);
        mockedGetCachedValue.mockReturnValue(null);

        const user = userEvent.setup();
        renderVehiclesPage('/vehicles');

        expect(screen.getByRole('alert', { name: "Couldn't load the Vehicles archive" })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Retry loading vehicles' }));

        expect(fetchVehicles).toHaveBeenCalledWith({ targetCount: 12 });
    });
});
