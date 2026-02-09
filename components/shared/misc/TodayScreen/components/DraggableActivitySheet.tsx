import React, { useEffect, useState } from 'react';
import { motion, useDragControls, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';

interface DraggableActivitySheetProps {
    children: React.ReactNode;
}

export const DraggableActivitySheet: React.FC<DraggableActivitySheetProps> = ({ children }) => {
    // Initial large value to push it down significantly before calculation
    const [collapsedY, setCollapsedY] = useState(600);
    const [expandedHeight, setExpandedHeight] = useState(800);
    const y = useMotionValue(600);
    const dragControls = useDragControls();

    const TOP_OFFSET = 120; // Space for the top Calendar view

    useEffect(() => {
        // Calculate dynamic layout based on window height
        const h = window.innerHeight;
        // Expanded height: full screen minus a small top margin (or header space)
        const expanded = h - 80;

        // Collapsed Visible Area: How much of the sheet peeks out at the bottom
        // User called it "section that opens with drag". It needs a handle.
        // Let's say ~100px visible.
        const collapsedVisible = 100;

        // The Y translation needed to push it down so only `collapsedVisible` is shown
        // If height is `expanded`, and we want `collapsedVisible` exposed at bottom:
        // top of sheet should be at `h - collapsedVisible`.
        // Relative to `bottom: 0`, y=0 means fully expanded?
        // Let's assume layout: fixed bottom: 0. Height: expanded.
        // y=0 => Sheet top is at (h - expanded) [approx 80px from top].
        // y=expanded => Sheet top is at h (fully hidden).
        // We want sheet top at (h - collapsedVisible).
        // So y = (h - collapsedVisible) - (h - expanded) = expanded - collapsedVisible.

        const calculatedCollapsedY = expanded - collapsedVisible;

        setExpandedHeight(expanded);
        setCollapsedY(calculatedCollapsedY);

        // Set initial position to collapsed
        y.set(calculatedCollapsedY);
    }, []);

    const onDragEnd = (event: any, info: PanInfo) => {
        const currentY = y.get();
        const velocity = info.velocity.y;

        // Logic to snap open or closed
        const threshold = collapsedY / 2;
        let target = collapsedY;

        // If dragging up (negative velocity) or positioned high enough
        if (velocity < -500 || (velocity <= 0 && currentY < threshold)) {
            target = 0; // Open (y=0)
        } else {
            target = collapsedY; // Close
        }

        animate(y, target, {
            type: "spring",
            damping: 30, // Less bounce for UI
            stiffness: 300
        });
    };

    const handleTap = () => {
        // Toggle on tap of handle
        const currentY = y.get();
        const isClosed = currentY > collapsedY / 2;
        animate(y, isClosed ? 0 : collapsedY, { type: "spring", damping: 30, stiffness: 300 });
    };

    return (
        <motion.div
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: collapsedY }} // Limit drag
            dragElastic={0.1}
            onDragEnd={onDragEnd}
            style={{
                y,
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                height: expandedHeight,
                background: 'rgba(15, 16, 18, 0.98)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                zIndex: 50, // High but maybe under some modals
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {/* Handle Area */}
            <div
                onPointerDown={(e) => dragControls.start(e)}
                onClick={handleTap}
                style={{
                    display: 'grid',
                    placeItems: 'center',
                    paddingTop: 12,
                    paddingBottom: 4,
                    flexShrink: 0,
                    touchAction: 'none',
                    cursor: 'grab',
                    width: '100%',
                    background: 'transparent' // transparent hit area
                }}
            >
                {/* Visual Handle Bar (Orange pill) */}
                <div style={{
                    width: 56,
                    height: 5,
                    borderRadius: 999,
                    background: 'rgba(255, 121, 57, 0.6)',
                }} />

                {/* Optional Title or metadata could go here */}
                <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                    ACTIVIDADES DE HOY
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }} onPointerDown={(e) => e.stopPropagation()}>
                {children}
            </div>

        </motion.div>
    );
};
