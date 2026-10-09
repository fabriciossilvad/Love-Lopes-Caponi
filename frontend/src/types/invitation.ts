export type RsvpStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';
export interface InvitationEvent { id:string; name:string; slug:string; event_date:string; venue_name:string|null; address:string|null; maps_url:string|null; rsvp_deadline:string; additional_info:string|null; rsvp_status:RsvpStatus; responded_at:string|null }
export interface InvitationGuest { id:string; name:string; events:InvitationEvent[] }
export interface InvitationContext { display_name:string; guests:InvitationGuest[] }
