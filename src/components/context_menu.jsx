
import { useCallback, useEffect, useMemo, useRef, useState } from "react";



export function useContextMenu() {


    const menuRef = useRef(null);
    const [state, setState] = useState({
        open: false,
        x: 0,
        y: 0,
        data: null,
    });

    const closeMenu = useCallback(() => {
        setState((prev) => ({ ...prev, open: false }));
    }, []);


    const openMenu = useCallback((event, data = null) => {
        event.preventDefault();
        setState({
            open: true,
            x: event.clientX,
            y: event.clientY,
            data,
        });
    }, []);



    useEffect(() => {
        if (!state.open) {
            return;
        }

        const closeOnClick = () => closeMenu();
        const closeOnEscape = (event) => {
            if (event.key === "Escape") {
                closeMenu();
            }
        };

        window.addEventListener("click", closeOnClick);
        window.addEventListener("resize", closeOnClick);
        window.addEventListener("keydown", closeOnEscape);

        return () => {
            window.removeEventListener("click", closeOnClick);
            window.removeEventListener("resize", closeOnClick);
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [state.open, closeMenu]);

    useEffect(() => {
        if (!state.open || !menuRef.current) {
            return;
        }

        const { innerWidth, innerHeight } = window;
        const rect = menuRef.current.getBoundingClientRect();

        let nextX = state.x;
        let nextY = state.y;

        if (nextX + rect.width > innerWidth) {
            nextX = Math.max(8, innerWidth - rect.width - 8);
        }

        if (nextY + rect.height > innerHeight) {
            nextY = Math.max(8, innerHeight - rect.height - 8);
        }

        if (nextX !== state.x || nextY !== state.y) {
            setState((prev) => ({ ...prev, x: nextX, y: nextY }));
        }
    }, [state.open, state.x, state.y]);

    const getTargetProps = useCallback(
        (data = null) => ({
            onContextMenu: (event) => openMenu(event, data),
        }),
        [openMenu]
    );



    const getMenuProps = useCallback(
        (customProps = {}) => ({
            ...customProps,
            ref: menuRef,
            role: "menu",
            style: {
                position: "fixed",
                top: state.y,
                left: state.x,
                zIndex: 999,
                ...(customProps.style || {}),
            },
            onContextMenu: (event) => {
                event.preventDefault();
                customProps.onContextMenu?.(event);
            },
        }),
        [state.x, state.y]
    );

    return useMemo(
        () => ({
            isOpen: state.open,
            position: { x: state.x, y: state.y },
            data: state.data,
            openMenu,
            closeMenu,
            getTargetProps,
            getMenuProps,
        }),
        [state, openMenu, closeMenu, getTargetProps, getMenuProps]
    );
}



export default function ContextMenu({ children, items = [], className = "" }) {


    const { isOpen, data, closeMenu, getTargetProps, getMenuProps } = useContextMenu();

    const onItemClick = (item) => {
        item?.onClick?.(data);
        closeMenu();
    };
    

    return (
        <>
            <div {...getTargetProps()}>{children}</div>

            {isOpen && (
                <div
                    {...getMenuProps({
                        className,
                    })}
                >
                    {items.map((item) => (
                        <button
                            key={item.id || item.label}
                            type="button"
                            onClick={() => onItemClick(item)}
                            disabled={item.disabled}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}