import React from "react";
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/dateUtils';

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
  const { i18n } = useTranslation();
  if (!value) {
    return <>{fallback}</>;
  }

  const formatted = formatDate(value, mode === 'date' ? 'short' : mode, i18n.language);

  if (!formatted) {
    return <>{fallback}</>;
  }

  return <span className={className}>{formatted}</span>;
};

export default DateBox;
