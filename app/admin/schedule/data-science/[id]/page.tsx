import { InterviewScheduleDetail } from "../../../components/InterviewScheduleDetail";

interface DataScienceScheduleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DataScienceScheduleDetailPage({ params }: DataScienceScheduleDetailPageProps) {
  const { id } = await params;
  
  return (
    <InterviewScheduleDetail
      interviewType="DATA_SCIENCE"
      scheduleId={id}
    />
  );
}
