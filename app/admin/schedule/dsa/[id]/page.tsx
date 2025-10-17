import { InterviewScheduleDetail } from "../../../components/InterviewScheduleDetail";

interface DSAScheduleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DSAScheduleDetailPage({ params }: DSAScheduleDetailPageProps) {
  const { id } = await params;
  
  return (
    <InterviewScheduleDetail
      interviewType="DSA"
      scheduleId={id}
    />
  );
}
