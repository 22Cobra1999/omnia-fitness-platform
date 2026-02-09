import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { motion, useMotionValue, useTransform, DragControls, useDragControls } from 'framer-motion';
import { SettingsIcon } from '@/components/shared/ui/settings-icon';
import { MessagesIcon } from '@/components/shared/ui/messages-icon';
import { OmniaLogoText } from '@/components/shared/ui/omnia-logo'; // Assuming standard export or named

interface ScreenLayoutProps {
    children?: React.ReactNode;
    hero: React.ReactNode;
    sheetContent: (props: { y: any, dragControls: DragControls }) => React.ReactNode;
    backgroundImage?: string;
    vh: number;
    isSpecialView?: boolean;
}

export function ScreenLayout({
    hero,
    sheetContent,
    backgroundImage,
    vh,
    isSpecialView
}: ScreenLayoutProps) {
    // Unified collapsed height logic
    const COLLAPSED_H = Math.max(Math.round(vh * 0.20), 150); // Reduced peeking as requested
    const collapsedY = vh - COLLAPSED_H;

    // Motion Values
    const y = useMotionValue(0); // Initial value will be set in useEffect
    const dragControls = useDragControls();

    // Transforms
    // Map y from [collapsedY, 0] to [0, 1]
    const openness = useTransform(y, [collapsedY, 0], [0, 1]);
    const heroScale = useTransform(openness, [0, 1], [1, 0.95]);
    const heroOpacity = useTransform(openness, [0, 0.4], [1, 0]); // Fade out slightly later
    const heroBlur = useTransform(openness, [0.1, 0.4], ["blur(0px)", "blur(10px)"]); // Increased buffer to 0.1 for safety

    // We need to initialize y to collapsedY on mount
    React.useEffect(() => {
        y.set(collapsedY);
    }, [vh, y, collapsedY]);


    return (
        <div style={{ height: '100vh', background: '#0F1012', color: '#fff', position: 'relative', overflow: 'hidden', zIndex: 1 }}>
            {/* Fondo blureado con contraste premium */}
            {backgroundImage && backgroundImage.trim() !== '' && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 0,
                    pointerEvents: 'none'
                }}>
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: isSpecialView
                                ? 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.95) 100%)'
                                : 'transparent',
                            backdropFilter: isSpecialView ? 'blur(30px)' : 'blur(80px)',
                            WebkitBackdropFilter: isSpecialView ? 'blur(30px)' : 'blur(80px)',
                            opacity: isSpecialView ? 1 : 0.15,
                        }}
                    />
                    {!isSpecialView && (
                        <div style={{ position: 'absolute', inset: 0, background: '#0F1012', opacity: 0.85 }} />
                    )}
                </div>
            )}

            {/* Header */}
            <div
                className="fixed top-0 left-0 right-0 z-[9999] bg-black px-4 h-14 flex items-center justify-between"
                style={{ zIndex: 9999 }}
            >
                <div style={{ opacity: 1 }}>
                    <SettingsIcon />
                </div>

                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                    <OmniaLogoText />
                </div>

                <div style={{ opacity: 1 }}>
                    <MessagesIcon />
                </div>
            </div>

            {/* Scrollable Container for Hero */}
            <div
                className="orange-glass-scrollbar"
                style={{
                    height: 'calc(100vh - 56px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingTop: '40px', // Adjusted to allow overlap
                    paddingBottom: '240px',
                    WebkitOverflowScrolling: 'touch',
                    position: 'relative',
                    background: '#0F1012'
                }}>

                {/* Hero Wrapper */}
                <motion.div
                    style={{
                        padding: '0px 24px 20px',
                        minHeight: 'calc(100vh - 120px)',
                        background: 'transparent',
                        borderBottom: '1px solid #1f2328',
                        scale: heroScale,
                        opacity: heroOpacity,
                        filter: heroBlur,
                        transformOrigin: 'center top',
                        position: 'relative',
                        zIndex: 1
                    }}
                >
                    {hero}
                </motion.div>

                {/* Sheet Injection */}
                {sheetContent({ y, dragControls })}

            </div>
        </div>
    );
}
