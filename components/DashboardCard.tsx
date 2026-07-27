'use client';

import React from 'react';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const DashboardCard = ({
  title,
  subtitle,
  children,
  footer,
  className = ''
}: DashboardCardProps) => {
  return (
    <div className={`bg-white border border-[#ECE8E2] rounded-[18px] p-6 shadow-soft flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#111111] tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="mt-2 flex-1">
          {children}
        </div>
      </div>
      {footer && (
        <div className="mt-4 pt-4 border-t border-[#ECE8E2] flex items-center justify-between text-xs text-[#6B7280]">
          {footer}
        </div>
      )}
    </div>
  );
};
