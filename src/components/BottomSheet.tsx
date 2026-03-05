import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../utils/cn'

interface BottomSheetProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
    isOpen,
    onClose,
    title,
    children
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[70] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        {/* Handle */}
                        <div className="w-full flex justify-center py-3">
                            <div className="w-12 h-1.5 bg-cream-dark rounded-full" />
                        </div>

                        <div className="px-6 pb-4 flex items-center justify-between border-b border-cream-dark">
                            {title && <h3 className="text-xl font-display font-semibold text-dark">{title}</h3>}
                            <button
                                onClick={onClose}
                                className="p-2 bg-cream-light rounded-full text-dark/40 active:scale-90"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto pb-[env(safe-area-inset-bottom,24px)]">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
