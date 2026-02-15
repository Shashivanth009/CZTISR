import { useState, useEffect, cloneElement, Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, X } from 'lucide-react';

interface GlassExpandProps {
    children: ReactNode;
    title?: string;
    className?: string;
}

export const GlassExpand = ({ children, title, className = '' }: GlassExpandProps) => {
    const [expanded, setExpanded] = useState(false);

    // Close on Escape key
    useEffect(() => {
        if (!expanded) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setExpanded(false);
        };
        window.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [expanded]);

    // Ensure we have a single valid element child to clone
    // We cast to ReactElement with known props interface to satisfy TS
    const child = Children.only(children) as ReactElement<{
        onClick?: (e: any) => void;
        className?: string;
        children?: ReactNode
    }>;

    if (!isValidElement(child)) {
        return <>{children}</>;
    }

    // The expand badge to inject into the child
    const expandBadge = (
        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/60 border border-cyber-neon/30 text-cyber-neon text-[9px] tracking-wider backdrop-blur-sm">
                <Maximize2 size={10} />
                EXPAND
            </div>
        </div>
    );

    // Clone the child to inject props directly
    const clonedChild = cloneElement(child, {
        onClick: (e: any) => {
            child.props.onClick?.(e);
            setExpanded(true);
        },
        className: `${child.props.className || ''} ${className} cursor-pointer group relative transition-all duration-300 hover:ring-1 hover:ring-cyber-neon/30 hover:shadow-[0_0_15px_rgba(0,255,157,0.1)]`,
        children: [
            ...Children.toArray(child.props.children),
            expandBadge
        ]
    });

    return (
        <>
            {clonedChild}

            {/* Fullscreen Overlay via Portal */}
            {expanded && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-6 animate-glass-in"
                    onClick={(e) => { if (e.target === e.currentTarget) setExpanded(false); }}
                >
                    {/* Blur Backdrop */}
                    <div className="absolute inset-0 bg-cyber-dark/80 backdrop-blur-md" />

                    {/* Glass Container */}
                    <div
                        className="relative w-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col rounded-xl border border-cyber-neon/20 bg-[#0a0e1a]/90 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,255,157,0.15),0_0_120px_rgba(0,217,249,0.08)] animate-glass-scale"
                    >
                        {/* Top Bar */}
                        <div className="flex-none flex items-center justify-between px-6 py-3 border-b border-cyber-neon/10 bg-black/40 backdrop-blur-xl">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-cyber-red/80" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-cyber-yellow/80" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-cyber-neon/80" />
                                </div>
                                {title && (
                                    <span className="text-[10px] text-gray-400 tracking-[0.3em] font-bold uppercase">{title}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded border border-cyber-slate/30 text-gray-400 text-[10px] tracking-wider hover:border-cyber-neon/50 hover:text-cyber-neon transition-all"
                                >
                                    <Minimize2 size={10} /> MINIMIZE
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                                    className="flex items-center justify-center w-7 h-7 rounded border border-cyber-red/30 text-gray-400 hover:border-cyber-red hover:text-cyber-red hover:bg-cyber-red/10 transition-all"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Expanded Content - Scrollable Area */}
                        <div className="flex-1 overflow-auto p-6 bg-black/20">
                            {/* Strip grid layout classes for the expanded view */}
                            {cloneElement(child, {
                                onClick: undefined,
                                className: `${child.props.className || ''}`.replace(/col-span-\d+|lg:col-span-\d+/g, 'w-full h-full'),
                                children: child.props.children
                            })}
                        </div>

                        {/* Scanline Effect */}
                        <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,157,0.015)_2px,rgba(0,255,157,0.015)_4px)] rounded-xl" />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
