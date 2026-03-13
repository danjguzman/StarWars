import { MantineProvider } from '@mantine/core';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SpeciesPage from '@pages/Species';
import AppModalHost from '@pages/_shared/AppModalHost';
import { useModalStackStore } from '@stores/modalStackStore';
import { useSpeciesStore } from '@stores/speciesStore';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { clearResourceCaches, createHookStore } from '../../test/resourceTestUtils';

jest.mock('@stores/speciesStore', () => ({
    useSpeciesStore: jest.fn(),
}));

jest.mock('@utils/layout', () => ({
    estimateInitialTargetCount: jest.fn(() => 12),
}));

jest.mock('@utils/useInfiniteScroll', () => ({
    useInfiniteScroll: jest.fn(() => ({ current: null })),
}));

const mockedUseSpeciesStore = jest.mocked(useSpeciesStore);

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

function LocationDisplay() {
    const location = useLocation();
    return <div data-testid="location-display">{location.pathname}</div>;
}

function renderSpeciesPage(initialEntry: string) {
    return render(
        <MantineProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/species" element={<SpeciesPage />} />
                    <Route path="/species/:speciesId" element={<SpeciesPage />} />
                </Routes>
                <AppModalHost />
                <LocationDisplay />
            </MemoryRouter>
        </MantineProvider>
    );
}

describe('Species page behavior', () => {
    const species = [
        createSpecies(1, 'Human'),
        createSpecies(2, 'Wookiee'),
        createSpecies(3, 'Droid'),
    ];

    afterEach(() => {
        act(() => {
            useModalStackStore.getState().resetStack();
        });
        clearResourceCaches();
        jest.clearAllMocks();
    });

    test('opens the real species modal from the grid and cycles through loaded species', async () => {
        const speciesStore = createHookStore({
            species,
            loading: false,
            loadingMore: false,
            error: null,
            lastFailedRequestMode: null,
            hasMore: false,
            fetchSpecies: jest.fn(async () => undefined),
        } as ReturnType<typeof useSpeciesStore>);
        mockedUseSpeciesStore.mockImplementation(() => speciesStore.useStore());

        const user = userEvent.setup();
        renderSpeciesPage('/species');

        await user.click(screen.getByRole('button', { name: 'Open Human' }));

        const speciesDialog = await screen.findByRole('dialog', { name: 'Human details' });
        expect(within(speciesDialog).getByText('Classification')).toBeInTheDocument();
        expect(within(speciesDialog).getByText('mammal')).toBeInTheDocument();
        expect(within(speciesDialog).getByText('1 / 3')).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/species/1');

        await user.click(screen.getByRole('button', { name: 'Previous item' }));

        expect(await screen.findByRole('dialog', { name: 'Droid details' })).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/species/3');

        await user.click(screen.getByRole('button', { name: 'Next item' }));

        expect(await screen.findByRole('dialog', { name: 'Human details' })).toBeInTheDocument();
        expect(screen.getByTestId('location-display')).toHaveTextContent('/species/1');
    });

    test('shows an error alert and recovers back to the real species grid after retry', async () => {
        let skipInitialRequest = true;
        let speciesStore: any;
        const fetchSpecies = jest.fn(async () => {
            if (skipInitialRequest) {
                skipInitialRequest = false;
                return;
            }

            speciesStore.setState((currentState: ReturnType<typeof useSpeciesStore>) => ({
                ...currentState,
                species,
                error: null,
                lastFailedRequestMode: null,
                hasMore: false,
            }));
        });

        speciesStore = createHookStore({
            species: [],
            loading: false,
            loadingMore: false,
            error: "We couldn't load the Species archive. Please try again.",
            lastFailedRequestMode: 'initial',
            hasMore: true,
            fetchSpecies,
        } as ReturnType<typeof useSpeciesStore>);
        mockedUseSpeciesStore.mockImplementation(() => speciesStore.useStore());

        const user = userEvent.setup();
        renderSpeciesPage('/species');

        expect(await screen.findByRole('alert', { name: "Couldn't load the Species archive" })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Retry loading species' }));

        await waitFor(() => {
            expect(screen.queryByRole('alert', { name: "Couldn't load the Species archive" })).not.toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: 'Open Human' })).toBeInTheDocument();
    });
});
