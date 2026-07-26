export type ActiveFilter = "active" | "all";

export type PropertyMaster = {
  id: string;
  property_code: string;
  property_name: string;
  normalized_name: string | null;
  sort_order: number | null;
  is_active: boolean;
  max_assignable_count?: number | null;
  cleaning_point?: number | null;
  task_color?: string | null;
  address?: string | null;
  google_maps_url?: string | null;
  entrance_number?: string | null;
};

export type RoomMaster = {
  id: string;
  property_id: string;
  room_name: string;
  room_code: string | null;
  room_key: string;
  normalized_room_key: string | null;
  capacity: number | null;
  room_sort_order: number | null;
  is_active: boolean;
  prep_d?: number | null;
  prep_s?: number | null;
  prep_spare_s?: number | null;
  prep_ta?: number | null;
  keybox_number?: string | null;
  spare_key_number?: string | null;
  mailbox_number?: string | null;
  wifi_ssid?: string | null;
  wifi_password?: string | null;
  note?: string | null;
};

export type PrepItem = {
  task_id: string;
  task_date: string;
  property_name: string;
  room_name: string;
  room_key: string;
  towel_count: number | string;
  prep_d: number;
  prep_s: number;
  prep_spare_s: number;
  prep_ta: number;
  note: string;
};
