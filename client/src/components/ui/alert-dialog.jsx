import * as React from 'react';
import {cn} from '@/lib/utils';

const AlertDialogContext = React.createContext({
    open: false,
    setOpen: () => {},
});

export function AlertDialog({open, onOpenChange, children}) {
    const [isOpen, setIsOpen] = React.useState(open ?? false);

    React.useEffect(() => {
        if (open !== undefined) {
            setIsOpen(open);
        }
    }, [open]);

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const setOpen = React.useCallback(
        (value) => {
            setIsOpen(value);
            onOpenChange?.(value);
        },
        [onOpenChange]
    );

    return (
        <AlertDialogContext.Provider value={{open: isOpen, setOpen}}>
            {children}
        </AlertDialogContext.Provider>
    );
}

export function AlertDialogTrigger({asChild, children, ...props}) {
    const {setOpen} = React.useContext(AlertDialogContext);

    if (asChild) {
        return React.cloneElement(children, {
            onClick: (e) => {
                children.props.onClick?.(e);
                setOpen(true);
            },
        });
    }

    return (
        <button type="button" onClick={() => setOpen(true)} {...props}>
            {children}
        </button>
    );
}

import {createPortal} from 'react-dom';

export function AlertDialogPortal({children}) {
    const {open} = React.useContext(AlertDialogContext);
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" />
            {children}
        </div>,
        document.body
    );
}

export function AlertDialogContent({className, children, ...props}) {
    const {setOpen} = React.useContext(AlertDialogContext);

    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [setOpen]);

    return (
        <AlertDialogPortal>
            <div
                className={cn(
                    'relative z-50 grid w-full max-w-lg gap-4 border border-border bg-background p-6 shadow-lg duration-200 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 sm:rounded-lg md:w-full',
                    className
                )}
                role="alertdialog"
                {...props}
            >
                {children}
            </div>
        </AlertDialogPortal>
    );
}

export function AlertDialogHeader({className, ...props}) {
    return (
        <div
            className={cn(
                'flex flex-col space-y-2 text-center sm:text-left',
                className
            )}
            {...props}
        />
    );
}

export function AlertDialogFooter({className, ...props}) {
    return (
        <div
            className={cn(
                'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0',
                className
            )}
            {...props}
        />
    );
}

export function AlertDialogTitle({className, ...props}) {
    return (
        <h2
            className={cn(
                'text-lg font-semibold text-foreground font-serif',
                className
            )}
            {...props}
        />
    );
}

export function AlertDialogDescription({className, ...props}) {
    return (
        <p
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    );
}

export function AlertDialogAction({className, onClick, ...props}) {
    const {setOpen} = React.useContext(AlertDialogContext);
    return (
        <button
            className={cn(
                'inline-flex h-9 items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground shadow transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
                className
            )}
            onClick={(e) => {
                onClick?.(e);
                setOpen(false);
            }}
            {...props}
        />
    );
}

export function AlertDialogCancel({className, onClick, ...props}) {
    const {setOpen} = React.useContext(AlertDialogContext);
    return (
        <button
            className={cn(
                'inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 sm:mt-0 cursor-pointer',
                className
            )}
            onClick={(e) => {
                onClick?.(e);
                setOpen(false);
            }}
            {...props}
        />
    );
}
