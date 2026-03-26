import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
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
    isMobile?: boolean;
    isSpecialView?: boolean;
}

export function ScreenLayout({
    hero,
    sheetContent,
    backgroundImage,
    vh,
    isMobile,
    isSpecialView
}: ScreenLayoutProps) {
    // Unified collapsed height logic - Responsive
    const COLLAPSED_H = isMobile ? vh * 0.12 : vh * 0.18; 
    const collapsedY = vh - COLLAPSED_H;
    const TOP_SNAP = 140; // Raised snap (closer to top) for more workspace

    // Motion Values
    const y = useMotionValue(0); // Initial value will be set in useEffect
    const dragControls = useDragControls();

    // Transforms
    // Map y from [collapsedY, 0] to [0, 1]
    const openness = useTransform(y, [collapsedY, TOP_SNAP], [0, 1]);
    const heroScale = useTransform(openness, [0, 1], [1, 0.96]);
    const heroOpacity = useTransform(openness, [0, 0.5], [1, 0]);
    const heroBlur = useTransform(openness, [0.1, 0.5], ["blur(0px)", "blur(12px)"]);

    // We need to initialize y to collapsedY on mount
    useEffect(() => {
        y.set(collapsedY);
    }, [vh, y, collapsedY]);


    return (
        <div style={{ height: '100vh', background: 'transparent', color: '#fff', position: 'relative', overflow: 'hidden', zIndex: 1 }}>
            {/* Background */}
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
                    pointerEvents: 'none',
                    transform: 'scale(1.05)'
                }}>
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to bottom, rgba(15, 16, 18, 0.1) 0%, rgba(15, 16, 18, 0.5) 50%, rgba(15, 16, 18, 0.8) 100%)',
                            backdropFilter: 'blur(12px) brightness(0.8)',
                            WebkitBackdropFilter: 'blur(12px) brightness(0.8)',
                            zIndex: 1
                        }}
                    />
                </div>
            )}

            {/* Main Scrollable Area */}
            <div
                className="orange-glass-scrollbar"
                style={{
                    height: '100vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingTop: '48px', // Compacted from 56px
                    paddingBottom: '240px',
                    WebkitOverflowScrolling: 'touch',
                    position: 'relative',
                    background: 'transparent'
                }}>

                {/* Content Container - Responsive width */}
                <div className="w-full px-6">
                    {/* Hero Wrapper */}
                    <motion.div
                        style={{
                            padding: '0px 0px 20px',
                            minHeight: '20vh',
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
                </div>

                {/* Sheet Injection */}
                {sheetContent({ y, dragControls })}
            </div>
        </div>
    );
}
