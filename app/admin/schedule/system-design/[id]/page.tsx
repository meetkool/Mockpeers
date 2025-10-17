import { InterviewScheduleDetail } from "../../../components/InterviewScheduleDetail";

interface SystemDesignScheduleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SystemDesignScheduleDetailPage({ params }: SystemDesignScheduleDetailPageProps) {
  const { id } = await params;
  
  return (
    <InterviewScheduleDetail
      interviewType="SYSTEM_DESIGN"
      scheduleId={id}
    />
  );
}
