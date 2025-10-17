"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Code, 
  Network, 
  MessageSquare, 
  Database, 
  Brain, 
  Monitor 
} from "lucide-react";
import { InterviewType, INTERVIEW_TYPE_CONFIG } from "@/lib/types/interview-types";

interface InterviewTypeTabsProps {
  selectedType: InterviewType | 'ALL';
  onTypeChange: (type: InterviewType | 'ALL') => void;
  className?: string;
}

// Icon mapping for client component
const iconMap = {
  'Code': Code,
  'Network': Network,
  'MessageSquare': MessageSquare,
  'Database': Database,
  'Brain': Brain,
  'Monitor': Monitor,
} as const;

export function InterviewTypeTabs({ 
  selectedType, 
  onTypeChange, 
  className = "" 
}: InterviewTypeTabsProps) {
  const allTypes = [
    { id: 'ALL' as const, name: 'All Types', description: 'Show all interview types' },
    ...Object.entries(INTERVIEW_TYPE_CONFIG).map(([type, config]) => ({
      id: type as InterviewType,
      name: config.name,
      description: config.description,
      badge: config.badge,
      iconName: type === 'DSA' ? 'Code' : 
                type === 'SYSTEM_DESIGN' ? 'Network' :
                type === 'BEHAVIORAL' ? 'MessageSquare' :
                type === 'SQL' ? 'Database' :
                type === 'DATA_SCIENCE' ? 'Brain' :
                type === 'FRONTEND' ? 'Monitor' : 'Code'
    }))
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {allTypes.map((type) => {
          const Icon = type.id === 'ALL' ? null : iconMap[type.iconName as keyof typeof iconMap];
          const isSelected = selectedType === type.id;
          
          return (
            <Button
              key={type.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onTypeChange(type.id)}
              className={`flex items-center gap-2 transition-all ${
                isSelected 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'hover:bg-primary/10 hover:text-primary'
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{type.name}</span>
              {type.badge && (
                <Badge variant="secondary" className="text-xs ml-1">
                  {type.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
      
      {/* Description for selected type */}
      <div className="text-sm text-muted-foreground">
        {selectedType === 'ALL' 
          ? 'Showing all available interview types'
          : INTERVIEW_TYPE_CONFIG[selectedType as InterviewType]?.description
        }
      </div>
    </div>
  );
}
