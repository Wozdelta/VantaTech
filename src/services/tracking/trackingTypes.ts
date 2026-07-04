export interface TrackingEvent {
  date: string;
  city: string;
  state: string;
  status: string;
  description: string;
}

export interface TrackingResponse {
  success: boolean;
  message?: string;
  trackingCode?: string;
  service?: string;
  delivered?: boolean;
  currentStatus?: string;
  lastUpdate?: string;
  events?: TrackingEvent[];
}
