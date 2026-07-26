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
};

export type ActiveFilter = "active" | "all";
