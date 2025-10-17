// Shared types for interview types system
export type InterviewType = 'DSA' | 'SYSTEM_DESIGN' | 'BEHAVIORAL' | 'SQL' | 'DATA_SCIENCE' | 'FRONTEND';

export const INTERVIEW_TYPES: InterviewType[] = [
  'DSA',
  'SYSTEM_DESIGN', 
  'BEHAVIORAL',
  'SQL',
  'DATA_SCIENCE',
  'FRONTEND'
];

export const INTERVIEW_TYPE_CONFIG = {
  DSA: {
    id: 'DSA',
    name: 'Data Structures & Algorithms',
    description: 'Practice coding questions',
    icon: 'Code',
    color: 'blue',
    path: '/admin/schedule/dsa'
  },
  SYSTEM_DESIGN: {
    id: 'SYSTEM_DESIGN',
    name: 'System Design',
    description: 'Practice designing technical architectures',
    icon: 'Network',
    color: 'purple',
    path: '/admin/schedule/system-design'
  },
  BEHAVIORAL: {
    id: 'BEHAVIORAL',
    name: 'Behavioral',
    description: 'Practice questions about your work experiences',
    icon: 'MessageSquare',
    color: 'green',
    path: '/admin/schedule/behavioral'
  },
  SQL: {
    id: 'SQL',
    name: 'SQL',
    description: 'Practice writing and optimizing SQL queries',
    icon: 'Database',
    color: 'orange',
    badge: 'Beta',
    path: '/admin/schedule/sql'
  },
  DATA_SCIENCE: {
    id: 'DATA_SCIENCE',
    name: 'Data Science & ML',
    description: 'Practice using data to answer questions and design systems',
    icon: 'Brain',
    color: 'pink',
    badge: 'Beta',
    path: '/admin/schedule/data-science'
  },
  FRONTEND: {
    id: 'FRONTEND',
    name: 'Frontend',
    description: 'Practice JavaScript with foundational exercises',
    icon: 'Monitor',
    color: 'cyan',
    badge: 'Beta',
    path: '/admin/schedule/frontend'
  }
} as const;

export interface ScheduleFormData {
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  meetingUrl?: string;
  interviewType: InterviewType;
}

export interface InterviewSchedulePageProps {
  interviewType: InterviewType;
  title: string;
  description: string;
  icon: React.ComponentType;
}

export interface InterviewScheduleDetailProps {
  interviewType: InterviewType;
  scheduleId: string;
}

export interface ScheduleFormProps {
  interviewType: InterviewType;
  onSubmit: (data: ScheduleFormData) => void;
}

export interface Schedule {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  waitTime: number;
  counting: number;
  description: string;
  meetingUrl: string | null;
  status: 'PENDING' | 'BOOKING_STARTED' | 'ACTIVE' | 'DONE' | 'OVER' | 'CANCELLED';
  bookingOpen: boolean;
  interviewType: InterviewType;
  userMeetings: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
}
