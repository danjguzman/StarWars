import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
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
    afterEach(() => {
        jest.useRealTimers();
    });

    test('shows a loader above the loading details message', () => {
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
                    getItemId={(item) => item.url.split('/').pop() ?? null}
                    onOpenItem={jest.fn()}
                    onCloseModal={jest.fn()}
                    getModalAriaLabel={(item) => `${item.name} details`}
                    renderModalContent={({ item }) => <div>{item.name}</div>}
                />
            </MantineProvider>
        );

        expect(screen.getByRole('status')).toHaveTextContent('Loading people details...');
        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
    });

    test('keeps the loading state visible for at least one second once shown', () => {
        jest.useFakeTimers();
        const fetchResources = jest.fn().mockResolvedValue(undefined);
        const item = createItem('1', 'Luke Skywalker');

        const { rerender } = render(
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
                    fetchResources={fetchResources}
                    getItemId={(entry) => entry.url.split('/').pop() ?? null}
                    onOpenItem={jest.fn()}
                    onCloseModal={jest.fn()}
                    getModalAriaLabel={(entry) => `${entry.name} details`}
                    renderModalContent={({ item: entry }) => <div>{entry.name}</div>}
                />
            </MantineProvider>
        );

        rerender(
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
                    fetchResources={fetchResources}
                    getItemId={(entry) => entry.url.split('/').pop() ?? null}
                    onOpenItem={jest.fn()}
                    onCloseModal={jest.fn()}
                    getModalAriaLabel={(entry) => `${entry.name} details`}
                    renderModalContent={({ item: entry }) => <div>{entry.name}</div>}
                />
            </MantineProvider>
        );

        expect(screen.getByRole('status')).toHaveTextContent('Loading people details...');
        expect(screen.queryByText('Luke Skywalker')).not.toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(999);
        });

        expect(screen.getByRole('status')).toHaveTextContent('Loading people details...');

        act(() => {
            jest.advanceTimersByTime(1);
        });

        expect(screen.getByText('Luke Skywalker')).toBeInTheDocument();
    });
});
