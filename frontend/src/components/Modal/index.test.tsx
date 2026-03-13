import { MantineProvider } from '@mantine/core';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps } from 'react';
import { createPortal } from 'react-dom';
import Modal, { MODAL_EXIT_DURATION_MS } from './index';

function renderModal(props?: Partial<ComponentProps<typeof Modal>>) {
    const onClose = jest.fn();
    const onNavigatePrev = jest.fn();
    const onNavigateNext = jest.fn();
    const children = props?.children ?? <div>Modal body</div>;

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
                {children}
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

function PortalledScrollableChild() {
    return createPortal(
        <div data-testid="portal-scroll-area" style={{ overflowY: 'auto' }}>
            Portal scroll area
        </div>,
        document.body
    );
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

    test('moves to the previous item with ArrowLeft without closing the modal', () => {
        const { onClose, onNavigatePrev, onNavigateNext } = renderModal();

        fireEvent.keyDown(window, { key: 'ArrowLeft' });

        expect(onNavigatePrev).toHaveBeenCalledTimes(1);
        expect(onNavigateNext).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    test('moves to the next item with ArrowRight without closing the modal', () => {
        const { onClose, onNavigatePrev, onNavigateNext } = renderModal();

        fireEvent.keyDown(window, { key: 'ArrowRight' });

        expect(onNavigateNext).toHaveBeenCalledTimes(1);
        expect(onNavigatePrev).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    test('closes with Escape without navigating between items', () => {
        const { onClose, onNavigatePrev, onNavigateNext } = renderModal();

        fireEvent.keyDown(window, { key: 'Escape' });

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onNavigatePrev).not.toHaveBeenCalled();
        expect(onNavigateNext).not.toHaveBeenCalled();
    });

    test('swiping right goes to the previous item only', () => {
        const { onClose, onNavigatePrev, onNavigateNext } = renderModal();
        const body = screen.getByText('Modal body');

        fireEvent.touchStart(body, {
            touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchEnd(body, {
            changedTouches: [{ clientX: 180, clientY: 102 }],
        });

        expect(onNavigatePrev).toHaveBeenCalledTimes(1);
        expect(onNavigateNext).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    test('swiping left goes to the next item only', () => {
        const { onClose, onNavigatePrev, onNavigateNext } = renderModal();
        const body = screen.getByText('Modal body');

        fireEvent.touchStart(body, {
            touches: [{ clientX: 180, clientY: 100 }],
        });
        fireEvent.touchEnd(body, {
            changedTouches: [{ clientX: 100, clientY: 102 }],
        });

        expect(onNavigateNext).toHaveBeenCalledTimes(1);
        expect(onNavigatePrev).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    test('swiping up closes the modal without triggering next or previous navigation', () => {
        const { onClose, onNavigatePrev, onNavigateNext } = renderModal();
        const body = screen.getByText('Modal body');

        fireEvent.touchStart(body, {
            touches: [{ clientX: 120, clientY: 160 }],
        });
        fireEvent.touchEnd(body, {
            changedTouches: [{ clientX: 118, clientY: 60 }],
        });

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onNavigatePrev).not.toHaveBeenCalled();
        expect(onNavigateNext).not.toHaveBeenCalled();
    });

    test('ignores short swipes that do not meet the action threshold', () => {
        const { onClose, onNavigatePrev, onNavigateNext } = renderModal();
        const body = screen.getByText('Modal body');

        fireEvent.touchStart(body, {
            touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchEnd(body, {
            changedTouches: [{ clientX: 130, clientY: 110 }],
        });

        expect(onClose).not.toHaveBeenCalled();
        expect(onNavigatePrev).not.toHaveBeenCalled();
        expect(onNavigateNext).not.toHaveBeenCalled();
    });

    test('does not close after dragging inside a scrollable portal descendant', () => {
        const { onClose } = renderModal({
            children: <PortalledScrollableChild />,
        });

        const portalScrollArea = screen.getByTestId('portal-scroll-area');

        Object.defineProperty(portalScrollArea, 'clientHeight', {
            value: 100,
            configurable: true,
        });
        Object.defineProperty(portalScrollArea, 'scrollHeight', {
            value: 400,
            configurable: true,
        });
        Object.defineProperty(portalScrollArea, 'scrollTop', {
            value: 120,
            configurable: true,
            writable: true,
        });

        fireEvent.touchStart(portalScrollArea, {
            touches: [{ clientX: 120, clientY: 180 }],
        });
        fireEvent.touchMove(portalScrollArea, {
            touches: [{ clientX: 118, clientY: 80 }],
        });
        fireEvent.touchEnd(portalScrollArea, {
            changedTouches: [{ clientX: 118, clientY: 80 }],
        });

        expect(onClose).not.toHaveBeenCalled();
    });

    test('does not close from an overlay click when the press started inside portal content', () => {
        const { onClose } = renderModal({
            children: <PortalledScrollableChild />,
        });

        const dialog = screen.getByRole('dialog', { name: 'Character details' });
        const portalScrollArea = screen.getByTestId('portal-scroll-area');

        fireEvent.pointerDown(portalScrollArea);
        fireEvent.click(dialog);

        expect(onClose).not.toHaveBeenCalled();
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

    test('waits for the exit animation before notifying the host', () => {
        jest.useFakeTimers();
        const onExitComplete = jest.fn();

        render(
            <MantineProvider>
                <Modal opened={false} closing ariaLabel="Character details" onClose={jest.fn()} onExitComplete={onExitComplete}>
                    <div>Modal body</div>
                </Modal>
            </MantineProvider>
        );

        expect(onExitComplete).not.toHaveBeenCalled();

        act(() => {
            jest.advanceTimersByTime(MODAL_EXIT_DURATION_MS);
        });

        expect(onExitComplete).toHaveBeenCalledTimes(1);
        jest.useRealTimers();
    });

    test('releases pointer events as soon as the modal starts closing', () => {
        render(
            <MantineProvider>
                <>
                    <button type="button">Underlying action</button>
                    <Modal opened={false} closing ariaLabel="Character details" onClose={jest.fn()}>
                        <div>Modal body</div>
                    </Modal>
                </>
            </MantineProvider>
        );

        expect(screen.getByRole('dialog', { name: 'Character details' })).toHaveStyle({ pointerEvents: 'none' });
    });
});
