import { act } from '@testing-library/react';
import { useModalStackStore } from '@stores/modalStackStore';
import { modalRouteTargetFromPathname } from '@utils/swapi';

function requireTarget(pathname: string) {
    const target = modalRouteTargetFromPathname(pathname);

    if (!target) {
        throw new Error(`Expected modal target for ${pathname}`);
    }

    return target;
}

describe('modalStackStore', () => {
    beforeEach(() => {
        act(() => {
            useModalStackStore.getState().resetStack();
        });
    });

    test('adds the first modal entry for a detail route', () => {
        useModalStackStore.getState().syncToRoute(requireTarget('/people/1'));

        expect(useModalStackStore.getState().stack).toEqual([
            expect.objectContaining({
                resourceKey: 'people',
                resourceId: '1',
                state: 'open',
            }),
        ]);
    });

    test('reuses the same instance key for same-category prev and next navigation', () => {
        useModalStackStore.getState().syncToRoute(requireTarget('/people/1'));
        const initialEntry = useModalStackStore.getState().stack[0];

        useModalStackStore.getState().syncToRoute(requireTarget('/people/2'));

        expect(useModalStackStore.getState().stack).toEqual([
            expect.objectContaining({
                instanceId: initialEntry?.instanceId,
                resourceKey: 'people',
                resourceId: '2',
                state: 'open',
            }),
        ]);
    });

    test('pushes a new entry and closes the previous one for cross-category navigation', () => {
        useModalStackStore.getState().syncToRoute(requireTarget('/people/1'));
        const initialEntry = useModalStackStore.getState().stack[0];

        useModalStackStore.getState().syncToRoute(requireTarget('/films/1'));

        expect(useModalStackStore.getState().stack).toEqual([
            expect.objectContaining({
                instanceId: initialEntry?.instanceId,
                resourceKey: 'people',
                resourceId: '1',
                state: 'closing',
            }),
            expect.objectContaining({
                resourceKey: 'films',
                resourceId: '1',
                state: 'open',
            }),
        ]);
    });

    test('marks the current stack as closing when the route no longer points at a modal', () => {
        useModalStackStore.getState().syncToRoute(requireTarget('/films/1'));

        useModalStackStore.getState().syncToRoute(null);

        expect(useModalStackStore.getState().stack).toEqual([
            expect.objectContaining({
                resourceKey: 'films',
                resourceId: '1',
                state: 'closing',
            }),
        ]);
    });
});
