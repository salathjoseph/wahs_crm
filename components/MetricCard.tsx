'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number | string;
    isPositive: boolean;
  };
  description?: string;
  icon?: React.ComponentType<any>;
}

export const MetricCard = ({
  title,
  value,
  trend,
  description,
  icon: Icon
}: MetricCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 24px -10px rgba(17, 17, 17, 0.06)" }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="bg-white border border-[#ECE8E2] rounded-[18px] p-6 shadow-soft flex flex-col justify-between min-h-[140px] relative overflow-hidden"
    >
      <div className="flex justify-between items-start">
        <span className="text-[13px] font-bold text-[#6B7280] uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-[#F5F3EF] border border-[#ECE8E2] flex items-center justify-center text-[#B99A5E] shrink-0">
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <span className="text-[32px] font-bold text-[#111111] leading-none tracking-tight">
          {value}
        </span>
        
        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${
              trend.isPositive 
                ? 'bg-[#15803D]/10 text-[#15803D]' 
                : 'bg-[#DC2626]/10 text-[#DC2626]'
            }`}>
              {trend.isPositive ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
              {trend.value}%
            </span>
          )}
          {description && (
            <span className="text-xs text-[#6B7280] font-medium truncate">
              {description}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
