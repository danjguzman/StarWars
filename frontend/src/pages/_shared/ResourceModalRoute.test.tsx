import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import ResourceModalRoute from '@pages/_shared/ResourceModalRoute';

interface TestResourceItem {
    url: string;
    name: string;
}

jest.mock('@components/Modal', () => ({
    __esModule: true,
    default: ({ opened, children }: { opened: boolean; children: ReactNode }) => (
        opened ? <div role="dialog">{children}</div> : null
    ),
}));

function createItem(id: string, name: string): TestResourceItem {
    return {
        url: `https://swapi.info/api/people/${id}`,
        name,
    };
}

describe('ResourceModalRoute', () => {
    test('renders the selected preloaded item immediately', () => {
        const item = createItem('1', 'Luke Skywalker');

        render(
            <MantineProvider>
                <ResourceModalRoute<TestResourceItem>
                    title="People"
                    routeItemId="1"
                    resources={[item]}
                    loading={false}
                    loadingMore={false}
                    hasMore
                    error={null}
                    lastFailedRequestMode={null}
                    initialItemCount={12}
                    fetchResources={jest.fn().mockResolvedValue(undefined)}
                    getItemId={(item) => item.url.split('/').pop() ?? null}
                    onOpenItem={jest.fn()}
                    onCloseModal={jest.fn()}
                    getModalAriaLabel={(item) => `${item.name} details`}
                    renderModalContent={({ item }) => <div>{item.name}</div>}
                />
            </MantineProvider>
        );

        expect(screen.getByText('Luke Skywalker')).toBeInTheDocument();
    });

    test('shows an unavailable message when the requested item cannot be resolved', () => {
        render(
            <MantineProvider>
                <ResourceModalRoute<TestResourceItem>
                    title="People"
                    routeItemId="1"
                    resources={[]}
                    loading={false}
                    loadingMore={false}
                    hasMore
                    error={null}
                    lastFailedRequestMode={null}
                    initialItemCount={12}
                    fetchResources={jest.fn().mockResolvedValue(undefined)}
                    getItemId={(entry) => entry.url.split('/').pop() ?? null}
                    onOpenItem={jest.fn()}
                    onCloseModal={jest.fn()}
                    getModalAriaLabel={(entry) => `${entry.name} details`}
                    renderModalContent={({ item: entry }) => <div>{entry.name}</div>}
                />
            </MantineProvider>
        );

        expect(screen.getByText('People details are unavailable right now.')).toBeInTheDocument();
    });
});
