import { InterviewScheduleDetail } from "../../../components/InterviewScheduleDetail";

interface BehavioralScheduleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BehavioralScheduleDetailPage({ params }: BehavioralScheduleDetailPageProps) {
  const { id } = await params;
  
  return (
    <InterviewScheduleDetail
      interviewType="BEHAVIORAL"
      scheduleId={id}
    />
  );
}
