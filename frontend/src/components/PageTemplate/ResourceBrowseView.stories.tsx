import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import ResourceBrowseView from '@components/PageTemplate/ResourceBrowseView';

type StoryItem = {
    url: string;
    name: string;
};

const meta = {
    title: 'Collections/ResourceBrowseView',
    component: ResourceBrowseView<StoryItem>,
    tags: ['autodocs'],
    args: {
        title: 'People',
        entityKey: 'people',
        items: [],
        loading: false,
        loadingMore: false,
        hasMore: false,
        error: null,
        errorTitle: "Couldn't load the People archive",
        retryLabel: 'Retry loading people',
        onRetry: action('retry'),
        onLoadMore: action('load-more'),
        onOpenItem: action('open-item'),
    },
} satisfies Meta<typeof ResourceBrowseView<StoryItem>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EmptyState: Story = {};
