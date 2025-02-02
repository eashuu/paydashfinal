export interface Participant {
  id: number;
  ID_no: string | null;
  Name: string | null;
  Email: string;
  DOB: string | null;
  Degree: string | null;
  Course: string | null;
  Year: string | null;
  Phone: string | null;
  Gender: string | null;
  College: string | null;
  Event_1: string | null;
  Event_2: string | null;
  WorkShop: string | null;
  Payment: string | null;
  EW: string | null;
  Pass: string | null;
  Concert: string | null;
  Accommodation: string | null;
  AccommodationDays: string | null;
  AccommodationCost: string | null;
  Reference: string | null;
  Transaction_ID: string | null;
  Date: string | null;
  Time: string | null;
  Team_Members: string | null;
  Concert_transaction: string | null;
  Concert_Payment: string | null;
  Event_1_Day3: string | null;
  Event_2_Day3: string | null;
  Event_3_Day3: string | null;
  Event_4_Day3: string | null;
  Event_1_Day4: string | null;
}

export interface Event {
  pass: string;
  events: string;
  Day: string;
}