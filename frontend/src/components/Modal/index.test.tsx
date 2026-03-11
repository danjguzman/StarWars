import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps } from 'react';
import Modal from './index';

function renderModal(props?: Partial<ComponentProps<typeof Modal>>) {
    const onClose = jest.fn();
    const onNavigatePrev = jest.fn();
    const onNavigateNext = jest.fn();

    const view = render(
        <MantineProvider>
            <Modal
                opened
                ariaLabel="Character details"
                onClose={onClose}
                onNavigatePrev={onNavigatePrev}
                onNavigateNext={onNavigateNext}
                {...props}
            >
                <div>Modal body</div>
            </Modal>
        </MantineProvider>
    );

    return {
        ...view,
        onClose,
        onNavigatePrev,
        onNavigateNext,
    };
}

describe('Modal', () => {
    afterEach(() => {
        document.body.style.paddingRight = '';
        document.documentElement.style.overscrollBehavior = '';
    });

    test('renders in a portal and closes from the overlay but not inner content', async () => {
        const user = userEvent.setup();
        const { onClose } = renderModal();

        const dialog = screen.getByRole('dialog', { name: 'Character details' });
        expect(dialog).toBeInTheDocument();
        expect(screen.getByText('Modal body')).toBeInTheDocument();

        await user.click(screen.getByText('Modal body'));
        expect(onClose).not.toHaveBeenCalled();

        await user.click(dialog);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('handles keyboard navigation and escape close while open', () => {
        const { onClose, onNavigatePrev, onNavigateNext } = renderModal();

        fireEvent.keyDown(window, { key: 'ArrowLeft' });
        fireEvent.keyDown(window, { key: 'ArrowRight' });
        fireEvent.keyDown(window, { key: 'Escape' });

        expect(onNavigatePrev).toHaveBeenCalledTimes(1);
        expect(onNavigateNext).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('handles swipe gestures for previous, next, and close actions', () => {
        const { onClose, onNavigatePrev, onNavigateNext } = renderModal();
        const body = screen.getByText('Modal body');

        fireEvent.touchStart(body, {
            touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchEnd(body, {
            changedTouches: [{ clientX: 180, clientY: 102 }],
        });

        fireEvent.touchStart(body, {
            touches: [{ clientX: 180, clientY: 100 }],
        });
        fireEvent.touchEnd(body, {
            changedTouches: [{ clientX: 100, clientY: 102 }],
        });

        fireEvent.touchStart(body, {
            touches: [{ clientX: 120, clientY: 160 }],
        });
        fireEvent.touchEnd(body, {
            changedTouches: [{ clientX: 118, clientY: 60 }],
        });

        expect(onNavigatePrev).toHaveBeenCalledTimes(1);
        expect(onNavigateNext).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('locks page overscroll while open and restores it on close', () => {
        const { rerender } = render(
            <MantineProvider>
                <Modal opened ariaLabel="Character details" onClose={jest.fn()}>
                    <div>Modal body</div>
                </Modal>
            </MantineProvider>
        );

        expect(document.documentElement.style.overscrollBehavior).toBe('none');

        rerender(
            <MantineProvider>
                <Modal opened={false} ariaLabel="Character details" onClose={jest.fn()}>
                    <div>Modal body</div>
                </Modal>
            </MantineProvider>
        );

        expect(document.documentElement.style.overscrollBehavior).toBe('');
    });
});
