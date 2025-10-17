import { InterviewScheduleDetail } from "../../../components/InterviewScheduleDetail";

interface FrontendScheduleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FrontendScheduleDetailPage({ params }: FrontendScheduleDetailPageProps) {
  const { id } = await params;
  
  return (
    <InterviewScheduleDetail
      interviewType="FRONTEND"
      scheduleId={id}
    />
  );
}
