import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import ListTemplate from '@components/PageTemplate/ListTemplate';

type StoryItem = {
    url: string;
    name: string;
};

const baseItems: StoryItem[] = [
    { url: 'https://swapi.info/api/people/1', name: 'Luke Skywalker' },
    { url: 'https://swapi.info/api/people/2', name: 'C-3PO' },
    { url: 'https://swapi.info/api/people/3', name: 'R2-D2' },
    { url: 'https://swapi.info/api/people/4', name: 'Darth Vader' },
];

const meta = {
    title: 'Collections/ListTemplate',
    component: ListTemplate<StoryItem>,
    tags: ['autodocs'],
    globals: {
        viewport: {
            value: 'responsive',
            isRotated: false,
        },
    },
    parameters: {
        docs: {
            description: {
                component: 'Grid list used for browse pages. The documented states cover the most meaningful collection behaviors: active infinite loading, completed browse results, and fallback handling for missing labels and images.',
            },
        },
    },
    args: {
        items: baseItems,
        entityKey: 'people',
        hasMore: false,
        loadingMore: false,
        showCompletionIndicator: false,
        onLoadMore: action('load-more'),
        onItemClick: action('item-click'),
    },
} satisfies Meta<typeof ListTemplate<StoryItem>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LoadingMore: Story = {
    args: {
        hasMore: true,
        loadingMore: true,
    },
};

export const Complete: Story = {
    args: {
        hasMore: false,
        loadingMore: false,
    },
};

export const WithMissingNameAndImage: Story = {
    args: {
        entityKey: 'vehicles',
        items: [
            { url: 'https://swapi.info/api/vehicles/4', name: 'Sand Crawler' },
            { url: 'https://swapi.info/api/vehicles/20', name: '' },
            { url: 'https://swapi.info/api/vehicles/24', name: 'Sail barge' },
        ],
    },
};
