import React from 'react'
import { cn } from '../utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost'
    loading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    loading,
    className,
    children,
    ...props
}) => {
    const variants = {
        primary: 'ios-button-primary',
        secondary: 'ios-button-secondary',
        ghost: 'ios-button-ghost',
    }

    return (
        <button
            className={cn(variants[variant], className)}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading ? (
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Aguarde...</span>
                </div>
            ) : children}
        </button>
    )
}
