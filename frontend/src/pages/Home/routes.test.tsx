import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { homeRoutes } from '@pages/Home/routes';
import { MemoryRouter, Routes } from 'react-router-dom';

jest.mock('@pages/People', () => ({
    __esModule: true,
    default: () => <div>People page</div>,
}));

jest.mock('@mantine/hooks', () => ({
    ...jest.requireActual('@mantine/hooks'),
    useMediaQuery: jest.fn(() => false),
}));

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
    test('loads the matching section page after clicking a header route', async () => {
        const user = userEvent.setup();
        renderHomeRoutes('/');
        await user.click(screen.getByRole('link', { name: 'Films' }));
        expect(await screen.findByRole('heading', { name: 'Films' })).toBeInTheDocument();
        expect(screen.getByText('Ready...')).toBeInTheDocument();
    });

    test('renders the section page for a detail route', () => {
        renderHomeRoutes('/films/1');
        expect(screen.getByRole('heading', { name: 'Films' })).toBeInTheDocument();
    });

    test('shows the NotFound component for an unknown route', () => {
        renderHomeRoutes('/this-route-does-not-exist');
        expect(screen.getByRole('heading', { name: 'Not Found' })).toBeInTheDocument();
        expect(screen.getByText('The page you entered does not exist.')).toBeInTheDocument();
    });
});
