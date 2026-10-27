import { useId, useState, useEffect } from 'react';
import { Form, Dropdown, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateForInput, parseDate, shiftCalendarMonth } from '../utils/dateUtils';
import './DatePicker.scss';

interface DatePickerProps {
  value:string; onChange:(value:string)=>void; label?:string; placeholder?:string;
  required?:boolean; disabled?:boolean; size?:'sm'|'lg'; className?:string; minDate?:string; maxDate?:string;
}
export default function DatePicker({value,onChange,label,placeholder,required=false,disabled=false,size,className='',minDate,maxDate}:DatePickerProps) {
  const {t,i18n}=useTranslation(), id=useId();
  const [open,setOpen]=useState(false);
  const [month,setMonth]=useState(()=>shiftCalendarMonth(parseDate(value)??new Date(),0));
  useEffect(()=>{const date=parseDate(value);if(date)setMonth(shiftCalendarMonth(date,0));},[value]);
  const months=t('datePicker.monthNames').split(',');
  const weekdays=t('datePicker.weekDays').split(',');
  const today=formatDateForInput(new Date());
  const outsideRange=(date:string)=>Boolean((minDate&&date<minDate)||(maxDate&&date>maxDate));
  const select=(date:string)=>{if(disabled||outsideRange(date))return;onChange(date);setOpen(false);};
  const firstDay=(month.getDay()+6)%7;
  const dayCount=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  return <div className={`date-picker-container ${className}`}>
    {label&&<Form.Label htmlFor={id}>{label}{required&&<span className="text-danger"> *</span>}</Form.Label>}
    <Dropdown show={open&&!disabled} onToggle={setOpen} autoClose="outside">
      <Dropdown.Toggle id={id} variant="light" size={size} disabled={disabled} className="date-picker-toggle" aria-label={`${label??t('datePicker.selectDate')}: ${formatDate(value,'short',i18n.language)}`}>
        <span className={value?'':'text-muted'}>{formatDate(value,'short',i18n.language)||placeholder||t('datePicker.selectDate')}</span><i className="bi bi-calendar3"/>
      </Dropdown.Toggle>
      <Dropdown.Menu className="date-picker-dropdown">
        <div className="calendar-header"><div className="calendar-navigation">
          <Button variant="link" className="nav-btn" aria-label={t('datePicker.previousYear')} onClick={()=>setMonth(shiftCalendarMonth(month,-12))}><i className="bi bi-chevron-double-left"/></Button>
          <Button variant="link" className="nav-btn" aria-label={t('datePicker.previousMonth')} onClick={()=>setMonth(shiftCalendarMonth(month,-1))}><i className="bi bi-chevron-left"/></Button>
          <div className="month-year-display" aria-live="polite"><span className="month">{months[month.getMonth()]}</span><span className="year">{month.getFullYear()}</span></div>
          <Button variant="link" className="nav-btn" aria-label={t('datePicker.nextMonth')} onClick={()=>setMonth(shiftCalendarMonth(month,1))}><i className="bi bi-chevron-right"/></Button>
          <Button variant="link" className="nav-btn" aria-label={t('datePicker.nextYear')} onClick={()=>setMonth(shiftCalendarMonth(month,12))}><i className="bi bi-chevron-double-right"/></Button>
        </div></div>
        <div className="calendar-content"><div className="weekdays">{weekdays.map(day=><span key={day} className="weekday">{day}</span>)}</div>
          <div className="calendar-grid">{Array.from({length:firstDay},(_,i)=><span key={`empty-${i}`} className="calendar-day empty"/>)}{Array.from({length:dayCount},(_,i)=>{
            const day=i+1,date=formatDateForInput(new Date(month.getFullYear(),month.getMonth(),day));
            return <button type="button" key={day} disabled={outsideRange(date)} aria-pressed={date===value} aria-current={date===today?'date':undefined} aria-label={formatDate(date,'withDay',i18n.language)} className={`calendar-day ${date===value?'selected':''} ${date===today?'today':''}`} onClick={()=>select(date)}>{day}</button>;
          })}</div>
        </div>
        <div className="calendar-footer"><Button variant="outline-secondary" size="sm" disabled={outsideRange(today)} onClick={()=>select(today)}>{t('datePicker.today')}</Button>{!required&&<Button variant="link" size="sm" onClick={()=>{onChange('');setOpen(false);}}>{t('datePicker.clear')}</Button>}</div>
      </Dropdown.Menu>
    </Dropdown>
  </div>;
}
