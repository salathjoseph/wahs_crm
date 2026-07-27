'use client';

import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  extraHeaderActions?: React.ReactNode;
}

export const ChartCard = ({
  title,
  subtitle,
  children,
  extraHeaderActions
}: ChartCardProps) => {
  return (
    <div className="bg-white border border-[#ECE8E2] rounded-[18px] p-6 shadow-soft flex flex-col justify-between h-full min-h-[380px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-[#111111] tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[#6B7280] font-medium mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {extraHeaderActions && (
          <div className="flex items-center gap-2">
            {extraHeaderActions}
          </div>
        )}
      </div>
      <div className="flex-1 w-full relative min-h-[260px]">
        {children}
      </div>
    </div>
  );
};
