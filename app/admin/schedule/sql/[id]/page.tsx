import { InterviewScheduleDetail } from "../../../components/InterviewScheduleDetail";

interface SQLScheduleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SQLScheduleDetailPage({ params }: SQLScheduleDetailPageProps) {
  const { id } = await params;
  
  return (
    <InterviewScheduleDetail
      interviewType="SQL"
      scheduleId={id}
    />
  );
}
