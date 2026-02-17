
import * as React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { UniversalVideoPlayer } from '@/components/shared/video/universal-video-player';

interface ActivityVideoPlayerProps {
    selectedVideo: any;
    isVideoPanelExpanded: boolean;
    setIsVideoPanelExpanded: (expanded: boolean) => void;
    isNutrition: boolean;
}

export function ActivityVideoPlayer({
    selectedVideo,
    isVideoPanelExpanded,
    setIsVideoPanelExpanded,
    isNutrition
}: ActivityVideoPlayerProps) {

    if (!selectedVideo.url) return null;

    return (
        <>
            {/* Play Button Icon - RE-ADDED */}
            {!isVideoPanelExpanded && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30, marginBottom: 10 }}>
                    <button
                        onClick={() => setIsVideoPanelExpanded(true)}
                        style={{
                            width: 76, height: 76, borderRadius: '50%',
                            background: 'rgba(255, 121, 57, 0.15)',
                            border: '2px solid #FF7939',
                            backdropFilter: 'blur(20px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', zIndex: 20,
                            boxShadow: '0 0 40px rgba(255,121,57,0.3)'
                        }}
                    >
                        <div style={{ width: 0, height: 0, borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderLeft: '20px solid #FF7939', marginLeft: 8 }} />
                    </button>
                </div>
            )}

            {/* Expanded Video Panel - Forced Visibility */}
            {isVideoPanelExpanded && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        width: '100%',
                        aspectRatio: '16/9',
                        minHeight: '280px',
                        marginTop: 12,
                        borderRadius: 18,
                        background: '#000',
                        position: 'relative',
                        overflow: 'hidden',
                        zIndex: 10,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
                    }}
                >
                    <UniversalVideoPlayer videoUrl={selectedVideo.url} autoPlay={true} controls={true} className="w-full h-full" disableDownload={true} />
                    <button onClick={() => setIsVideoPanelExpanded(false)} style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 30 }}><X size={18} /></button>
                </motion.div>
            )}
        </>
    );
}
