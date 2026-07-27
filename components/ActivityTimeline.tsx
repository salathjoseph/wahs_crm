'use client';

import React from 'react';
import { Activity } from '../src/types';
import { Phone, Mail, Calendar, FileText, Clock } from 'lucide-react';

interface ActivityTimelineProps {
  activities: Activity[];
}

export const ActivityTimeline = ({ activities }: ActivityTimelineProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone size={14} className="text-[#B99A5E]" />;
      case 'email':
        return <Mail size={14} className="text-[#B99A5E]" />;
      case 'meeting':
        return <Calendar size={14} className="text-[#B99A5E]" />;
      case 'note':
      default:
        return <FileText size={14} className="text-[#B99A5E]" />;
    }
  };

  const groupActivitiesByDate = (acts: Activity[]) => {
    const sorted = [...acts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const groups: Record<string, Activity[]> = {};
    
    sorted.forEach(act => {
      const dateStr = new Date(act.date).toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(act);
    });
    
    return groups;
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Clock size={32} className="text-[#6B7280]/30 mb-2" />
        <p className="text-xs text-[#6B7280] font-semibold">No activity logs recorded</p>
      </div>
    );
  }

  const grouped = groupActivitiesByDate(activities);

  return (
    <div className="flex flex-col gap-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#ECE8E2]">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="flex flex-col gap-4">
          <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider pl-8">
            {date}
          </span>
          {items.map(item => (
            <div key={item.id} className="flex gap-4 text-xs leading-relaxed relative z-10 pl-2">
              <div className="w-5 h-5 rounded-full bg-white border border-[#ECE8E2] flex items-center justify-center shrink-0 shadow-soft">
                {getIcon(item.type)}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-[#111111] capitalize">
                  {item.type} Outreach
                </span>
                <p className="text-[#6B7280] leading-relaxed font-medium mt-0.5">
                  {item.description}
                </p>
                <span className="text-[10px] text-[#6B7280] font-bold mt-1">
                  {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
