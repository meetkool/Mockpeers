"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Video, Star, ChevronLeft, ChevronRight, Calendar, Archive } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Meeting {
  id: string;
  schedule: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    duration: number;
    status: string;
    counting: number;
    description?: string;
  };
}

interface PaginatedResponse {
  meetings: Meeting[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function Interviews() {
  const router = useRouter();
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<Meeting[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchUpcomingMeetings = async () => {
    try {
      const response = await fetch('/api/meetings/upcoming');
      const data = await response.json();
      setUpcomingMeetings(data);
    } catch (error) {
      console.error('Failed to fetch upcoming meetings:', error);
    }
  };

  const fetchPastMeetings = async (page: number) => {
    try {
      const response = await fetch(`/api/meetings/past?page=${page}&limit=5`);
      const data: PaginatedResponse = await response.json();
      setPastMeetings(data.meetings);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch past meetings:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUpcomingMeetings(),
        fetchPastMeetings(currentPage)
      ]);
      setLoading(false);
    };
    loadData();
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      'PENDING': { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', label: 'Scheduled' },
      'BOOKING_STARTED': { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', label: 'Confirmed' },
      'ACTIVE': { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', label: 'Live' },
      'DONE': { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', label: 'Completed' },
      'OVER': { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', label: 'Missed' },
      'CANCELLED': { color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', label: 'Cancelled' },
    };
    const config = variants[status] || variants['PENDING'];
    return <Badge className={`${config.color} text-[10px] h-5 px-2 font-medium`}>{config.label}</Badge>;
  };

  const totalInterviews = upcomingMeetings.length + pagination.total;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Interviews</CardTitle>
            <Video className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold">{totalInterviews}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">All time</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Upcoming</CardTitle>
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold">{upcomingMeetings.length}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Scheduled meetings</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Completed</CardTitle>
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Past interviews</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">This Month</CardTitle>
            <Star className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold">
              {upcomingMeetings.filter(m => {
                const startTime = new Date(m.schedule.startTime);
                const now = new Date();
                return startTime.getMonth() === now.getMonth() && 
                       startTime.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Active this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Your Interviews</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your upcoming and past interview sessions</p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/interviews/peer/schedule')}
          size="sm"
          className="h-8 text-xs"
        >
          Schedule New Interview
        </Button>
      </div>

      {/* Upcoming Interviews */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-semibold">Upcoming Interviews</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Clock className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No upcoming interviews scheduled</p>
              </div>
            ) : (
              upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="px-4 py-2.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <Clock className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium truncate">{meeting.schedule.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {format(new Date(meeting.schedule.startTime), 'MMM dd, yyyy h:mm a')}
                          </p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-500">{meeting.schedule.duration} mins</p>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {formatDistanceToNow(new Date(meeting.schedule.startTime), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(meeting.schedule.status)}
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        <Users className="h-2.5 w-2.5 mr-1" />
                        {meeting.schedule.counting}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/rooms/${meeting.schedule.id}`)}
                        className="h-7 text-xs px-3"
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Past Meetings Archive */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-gray-600" />
            <CardTitle className="text-sm font-semibold">Past Meetings Archive</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {pastMeetings.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Archive className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No past interviews found</p>
              </div>
            ) : (
              <>
                {pastMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="px-4 py-2.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <Video className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {meeting.schedule.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {format(new Date(meeting.schedule.startTime), 'MMM dd, yyyy h:mm a')}
                            </p>
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-xs text-gray-500">{meeting.schedule.duration} mins</p>
                          </div>
                          {meeting.schedule.description && (
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                              {meeting.schedule.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusBadge(meeting.schedule.status)}
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          <Users className="h-2.5 w-2.5 mr-1" />
                          {meeting.schedule.counting}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="text-[11px] text-gray-600 dark:text-gray-400">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} meetings
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="h-7 px-2 text-xs"
                      >
                        <ChevronLeft className="h-3 w-3" />
                        Prev
                      </Button>
                      
                      {/* Page numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
                          // Show limited page numbers for better UX
                          const shouldShow = 
                            pageNum === 1 || // First page
                            pageNum === pagination.totalPages || // Last page
                            Math.abs(pageNum - pagination.page) <= 1; // Current and adjacent pages

                          if (!shouldShow) {
                            // Show ellipsis only once between gaps
                            const prevPageNum = pageNum - 1;
                            const isPrevShown = 
                              prevPageNum === 1 || 
                              prevPageNum === pagination.totalPages ||
                              Math.abs(prevPageNum - pagination.page) <= 1;
                            
                            if (!isPrevShown && pageNum === 2) {
                              return <span key={pageNum} className="px-1 text-xs text-gray-400">...</span>;
                            }
                            if (!isPrevShown && pageNum === pagination.totalPages - 1) {
                              return <span key={pageNum} className="px-1 text-xs text-gray-400">...</span>;
                            }
                            return null;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === pagination.page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="h-7 w-7 p-0 text-xs"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="h-7 px-2 text-xs"
                      >
                        Next
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
