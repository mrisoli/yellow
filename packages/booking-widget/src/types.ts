export interface BlockedTime {
  date: string;
  endTime: string;
  startTime: string;
}

export interface BookingWidgetProps {
  blockedTimes?: BlockedTime[];
  className?: string;
  defaultDate?: Date;
  defaultMonth?: Date;
  meetingDuration?: number;
  organizerUserId?: string;
  showPhoneField?: boolean;
  submitUrl?: string;
}
