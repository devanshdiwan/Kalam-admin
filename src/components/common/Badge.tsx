import React from 'react';

export type BadgeVariant = 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'purple' 
  | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'neutral', 
  size = 'md',
  className = '' 
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    info: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    neutral: 'bg-slate-700/50 text-slate-300 border-slate-600/40',
  };

  const sizeStyles = size === 'sm' 
    ? 'text-[11px] px-2 py-0.5' 
    : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-md border tracking-wide uppercase ${sizeStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export function getStatusBadgeVariant(status: string): BadgeVariant {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
    case 'AVAILABLE':
    case 'PRESENT':
    case 'PAID':
    case 'RETURNED':
    case 'APPROVED':
    case 'COMPLETED':
      return 'success';
    case 'OCCUPIED':
    case 'PENDING':
    case 'EXPIRING_SOON':
    case 'CONTACTED':
    case 'INTERESTED':
    case 'ONGOING':
      return 'warning';
    case 'EXPIRED':
    case 'ABSENT':
    case 'OVERDUE':
    case 'REVOKED':
    case 'REJECTED':
    case 'CANCELLED':
    case 'SUSPENDED':
      return 'danger';
    case 'RESERVED':
    case 'NEW':
    case 'ISSUED':
    case 'UPCOMING':
      return 'info';
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return 'purple';
    default:
      return 'neutral';
  }
}
