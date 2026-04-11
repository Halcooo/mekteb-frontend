import { useLocation } from "react-router-dom";
import AttendanceTracker from "./AttendanceTracker";
import DailyCommentsAdmin from "../components/DailyCommentsAdmin";

function Attendance() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const commentsDate = searchParams.get("commentsDate") || undefined;
  const studentIdParam = searchParams.get("studentId");
  const parsedStudentId = studentIdParam ? parseInt(studentIdParam, 10) : NaN;
  const initialStudentId = Number.isNaN(parsedStudentId)
    ? undefined
    : parsedStudentId;
  const autoOpenAddModal = searchParams.get("openAddComment") === "1";

  return (
    <>
      <AttendanceTracker />
      <div className="px-3 pb-4" id="attendance-comments-admin">
        <DailyCommentsAdmin
          initialDate={commentsDate}
          initialStudentId={initialStudentId}
          autoOpenAddModal={autoOpenAddModal}
        />
      </div>
    </>
  );
}

export default Attendance;
