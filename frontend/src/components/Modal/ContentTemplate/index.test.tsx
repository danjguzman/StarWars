import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import ContentTemplate from '@components/Modal/ContentTemplate';

jest.mock('@mantine/hooks', () => ({
    ...jest.requireActual('@mantine/hooks'),
    useMediaQuery: jest.fn(() => false),
}));

describe('ContentTemplate', () => {
    test('tries png artwork before falling back to the placeholder', () => {
        render(
            <MantineProvider>
                <ContentTemplate
                    title="A New Hope"
                    imageSources={['/assets/img/films/1.jpg', '/assets/img/films/1.png']}
                    imageAlt="A New Hope artwork"
                    traits={[]}
                    relatedGroups={[]}
                    onPrev={jest.fn()}
                    onNext={jest.fn()}
                    imageFallback={<span>Fallback artwork</span>}
                />
            </MantineProvider>
        );

        const artwork = screen.getByAltText('A New Hope artwork');
        expect(artwork).toHaveAttribute('src', '/assets/img/films/1.jpg');

        fireEvent.error(artwork);
        expect(screen.getByAltText('A New Hope artwork')).toHaveAttribute('src', '/assets/img/films/1.png');

        fireEvent.error(screen.getByAltText('A New Hope artwork'));
        expect(screen.queryByAltText('A New Hope artwork')).not.toBeInTheDocument();
        expect(screen.getByText('Fallback artwork')).toBeInTheDocument();
    });
});
