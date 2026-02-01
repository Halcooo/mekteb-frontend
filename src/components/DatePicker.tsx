import React, { useState, useRef, useEffect } from "react";
import { Form, InputGroup, Dropdown, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { formatBosnianDate } from "../utils/dateFormatter";
import "./DatePicker.scss";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  size?: "sm" | "lg";
  className?: string;
  minDate?: string;
  maxDate?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  disabled = false,
  size,
  className = "",
  minDate,
  maxDate,
}) => {
  const { t, i18n } = useTranslation();
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || "");
  const [viewMonth, setViewMonth] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedDate(value || "");
    if (value) {
      setViewMonth(new Date(value));
    }
  }, [value]);

  const months = {
    bs: [
      "Januar",
      "Februar",
      "Mart",
      "April",
      "Maj",
      "Juni",
      "Juli",
      "August",
      "Septembar",
      "Oktobar",
      "Novembar",
      "Decembar",
    ],
    en: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
  };

  const weekDays = {
    bs: ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"],
    en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  };

  const currentLang = i18n.language as "bs" | "en";

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    return formatBosnianDate(dateStr);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday (0) to be last (6)
  };

  const handleDateSelect = (day: number) => {
    const selectedDateObj = new Date(
      viewMonth.getFullYear(),
      viewMonth.getMonth(),
      day,
    );
    const dateString = selectedDateObj.toISOString().split("T")[0];

    if (minDate && dateString < minDate) return;
    if (maxDate && dateString > maxDate) return;

    setSelectedDate(dateString);
    onChange(dateString);
    setShowCalendar(false);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(viewMonth);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setViewMonth(newDate);
  };

  const navigateYear = (direction: "prev" | "next") => {
    const newDate = new Date(viewMonth);
    if (direction === "prev") {
      newDate.setFullYear(newDate.getFullYear() - 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setViewMonth(newDate);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(viewMonth);
    const firstDay = getFirstDayOfMonth(viewMonth);
    const days = [];

    // Empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(
        viewMonth.getFullYear(),
        viewMonth.getMonth(),
        day,
      );
      const dayString = dayDate.toISOString().split("T")[0];
      const isSelected = dayString === selectedDate;
      const isToday = dayString === new Date().toISOString().split("T")[0];
      const isDisabled =
        (minDate && dayString < minDate) || (maxDate && dayString > maxDate);

      days.push(
        <div
          key={day}
          className={`calendar-day ${isSelected ? "selected" : ""} ${
            isToday ? "today" : ""
          } ${isDisabled ? "disabled" : ""}`}
          onClick={() => !isDisabled && handleDateSelect(day)}
        >
          {day}
        </div>,
      );
    }

    return days;
  };

  return (
    <div className={`date-picker-container ${className}`}>
      {label && (
        <Form.Label>
          {label} {required && <span className="text-danger">*</span>}
        </Form.Label>
      )}

      <Dropdown
        show={showCalendar}
        onToggle={setShowCalendar}
        ref={dropdownRef}
      >
        <Dropdown.Toggle
          as={InputGroup}
          id="date-picker-toggle"
          className="date-picker-input-group"
        >
          <Form.Control
            type="text"
            value={formatDisplayDate(selectedDate)}
            placeholder={
              placeholder || t("datePicker.selectDate", "Select date")
            }
            readOnly
            disabled={disabled}
            size={size}
            className="date-picker-input"
          />
          <InputGroup.Text className="date-picker-icon">
            <i className="bi bi-calendar3"></i>
          </InputGroup.Text>
        </Dropdown.Toggle>

        <Dropdown.Menu className="date-picker-dropdown">
          <div className="calendar-header">
            <div className="calendar-navigation">
              <Button
                variant="link"
                size="sm"
                onClick={() => navigateYear("prev")}
                className="nav-btn"
              >
                <i className="bi bi-chevron-double-left"></i>
              </Button>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigateMonth("prev")}
                className="nav-btn"
              >
                <i className="bi bi-chevron-left"></i>
              </Button>

              <div className="month-year-display">
                <span className="month">
                  {months[currentLang][viewMonth.getMonth()]}
                </span>
                <span className="year">{viewMonth.getFullYear()}</span>
              </div>

              <Button
                variant="link"
                size="sm"
                onClick={() => navigateMonth("next")}
                className="nav-btn"
              >
                <i className="bi bi-chevron-right"></i>
              </Button>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigateYear("next")}
                className="nav-btn"
              >
                <i className="bi bi-chevron-double-right"></i>
              </Button>
            </div>
          </div>

          <div className="calendar-content">
            <div className="weekdays">
              {weekDays[currentLang].map((day) => (
                <div key={day} className="weekday">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-grid">{renderCalendar()}</div>
          </div>

          <div className="calendar-footer">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => {
                const today = new Date().toISOString().split("T")[0];
                setSelectedDate(today);
                onChange(today);
                setShowCalendar(false);
              }}
              className="today-btn"
            >
              {t("datePicker.today", "Today")}
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => {
                setSelectedDate("");
                onChange("");
                setShowCalendar(false);
              }}
              className="clear-btn"
            >
              {t("datePicker.clear", "Clear")}
            </Button>
          </div>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default DatePicker;
