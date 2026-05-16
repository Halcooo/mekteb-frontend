import React from "react";
import {
  formatBosnianDate,
  formatBosnianDateTime,
  formatBosnianTime,
} from "../utils/dateFormatter";

type DateBoxMode = "date" | "time" | "dateTime";

interface DateBoxProps {
  value: string | Date | number;
  mode?: DateBoxMode;
  fallback?: string;
  className?: string;
}

const DateBox: React.FC<DateBoxProps> = ({
  value,
  mode = "date",
  fallback = "",
  className,
}) => {
  if (!value) {
    return <>{fallback}</>;
  }

  let formatted = "";

  if (mode === "time") {
    formatted = formatBosnianTime(value);
  } else if (mode === "dateTime") {
    formatted = formatBosnianDateTime(value);
  } else {
    formatted = formatBosnianDate(value);
  }

  if (!formatted) {
    return <>{fallback}</>;
  }

  return <span className={className}>{formatted}</span>;
};

export default DateBox;
