export type ProfileRow = {
  avatar_seed: string;
  country_code: string | null;
  created_at: string;
  day_start_minute: number | null;
  display_name: string;
  id: string;
  locale: string | null;
  public_code: string;
  routine_day_settings_completed_at: string | null;
  theme_id: string;
  time_zone: string | null;
  updated_at: string;
};

export type UserBlockRow = {
  blocked_id: string;
  blocker_id: string;
  created_at: string;
};

export type FriendCodeLookupRow = Pick<
  ProfileRow,
  'avatar_seed' | 'display_name' | 'id'
>;

export type FriendshipStatus =
  | 'accepted'
  | 'cancelled'
  | 'declined'
  | 'pending'
  | 'removed';

export type FriendshipRow = {
  addressee_id: string;
  created_at: string;
  id: string;
  requester_id: string;
  responded_at: string | null;
  status: FriendshipStatus;
  updated_at: string;
  user_high_id: string;
  user_low_id: string;
};

export type PendingFriendRequestRow = {
  avatar_seed: string;
  direction: 'incoming' | 'outgoing';
  display_name: string;
  id: string;
};

export type FriendConnectionRow = Pick<
  ProfileRow,
  'avatar_seed' | 'display_name' | 'id'
>;

export type PlanRow = {
  created_at: string;
  description: string | null;
  ends_on: string | null;
  id: string;
  starts_on: string;
  status: 'active' | 'archived' | 'completed' | 'draft' | 'paused';
  title: string;
  updated_at: string;
  user_id: string;
  visibility: 'friends_progress' | 'private';
};

export type RoutineItemRow = {
  created_at: string;
  ends_on: string | null;
  id: string;
  plan_id: string;
  reminder_minute: number | null;
  schedule_weekdays: number[];
  sort_order: number;
  starts_on: string;
  status: 'active' | 'archived' | 'completed' | 'paused';
  title: string;
  updated_at: string;
  user_id: string;
};

export type CheckInRow = {
  completed_at: string;
  created_at: string;
  id: string;
  idempotency_key: string;
  received_at: string;
  routine_day: string;
  routine_item_id: string;
  source: 'offline_sync' | 'online';
  user_id: string;
};

export type RoutineItemStatusEventRow = {
  created_at: string;
  effective_at: string;
  id: string;
  routine_item_id: string;
  status: 'active' | 'archived' | 'completed' | 'paused';
  user_id: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: never;
        Update: Partial<
          Pick<
            ProfileRow,
            | 'avatar_seed'
            | 'country_code'
            | 'display_name'
            | 'locale'
            | 'theme_id'
          >
        >;
        Relationships: [];
      };
      user_blocks: {
        Row: UserBlockRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      friendships: {
        Row: FriendshipRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      plans: {
        Row: PlanRow;
        Insert: Omit<PlanRow, 'created_at' | 'id' | 'updated_at'>;
        Update: Partial<
          Pick<
            PlanRow,
            'description' | 'ends_on' | 'starts_on' | 'status' | 'title' | 'visibility'
          >
        >;
        Relationships: [];
      };
      routine_items: {
        Row: RoutineItemRow;
        Insert: Omit<RoutineItemRow, 'created_at' | 'id' | 'updated_at'>;
        Update: Partial<
          Pick<
            RoutineItemRow,
            | 'ends_on'
            | 'plan_id'
            | 'reminder_minute'
            | 'schedule_weekdays'
            | 'sort_order'
            | 'starts_on'
            | 'status'
            | 'title'
          >
        >;
        Relationships: [];
      };
      check_ins: {
        Row: CheckInRow;
        Insert: Omit<CheckInRow, 'created_at' | 'id' | 'received_at'>;
        Update: never;
        Relationships: [];
      };
      routine_item_status_events: {
        Row: RoutineItemStatusEventRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      complete_initial_routine_day_settings: {
        Args: {
          p_day_start_minute: number;
          p_time_zone: string;
        };
        Returns: ProfileRow;
      };
      create_plan_with_routine: {
        Args: {
          p_plan_title: string;
          p_routine_title: string;
          p_schedule_weekdays: number[];
          p_starts_on: string;
        };
        Returns: RoutineItemRow;
      };
      add_routine_item: {
        Args: {
          p_plan_id: string;
          p_reminder_minute?: number | null;
          p_routine_title: string;
          p_schedule_weekdays: number[];
        };
        Returns: RoutineItemRow;
      };
      update_routine_item: {
        Args: { p_reminder_minute?: number | null; p_routine_item_id: string; p_routine_title: string; p_schedule_weekdays: number[] };
        Returns: RoutineItemRow;
      };
      set_routine_item_status: {
        Args: { p_routine_item_id: string; p_status: 'active' | 'paused' };
        Returns: RoutineItemRow;
      };
      archive_routine_item: {
        Args: { p_routine_item_id: string };
        Returns: RoutineItemRow;
      };
      archive_plan: {
        Args: { p_plan_id: string };
        Returns: PlanRow;
      };
      complete_check_in: {
        Args: {
          p_completed_at: string;
          p_idempotency_key: string;
          p_routine_day: string;
          p_routine_item_id: string;
          p_source: 'offline_sync' | 'online';
        };
        Returns: CheckInRow;
      };
      undo_check_in: {
        Args: {
          p_idempotency_key: string;
          p_occurred_at: string;
          p_routine_day: string;
          p_routine_item_id: string;
          p_source: 'offline_sync' | 'online';
        };
        Returns: undefined;
      };
      lookup_profile_by_public_code: {
        Args: { p_public_code: string };
        Returns: FriendCodeLookupRow[];
      };
      create_friend_request: {
        Args: { p_recipient_id: string };
        Returns: FriendshipRow;
      };
      respond_to_friend_request: {
        Args: { p_friendship_id: string; p_response: 'accepted' | 'declined' };
        Returns: FriendshipRow;
      };
      cancel_friend_request: {
        Args: { p_friendship_id: string };
        Returns: undefined;
      };
      list_pending_friend_requests: {
        Args: Record<never, never>;
        Returns: PendingFriendRequestRow[];
      };
      remove_friend: {
        Args: { p_friend_id: string };
        Returns: undefined;
      };
      block_user: {
        Args: { p_target_user_id: string };
        Returns: undefined;
      };
      unblock_user: {
        Args: { p_target_user_id: string };
        Returns: undefined;
      };
      list_friends: {
        Args: Record<never, never>;
        Returns: FriendConnectionRow[];
      };
      list_blocked_users: {
        Args: Record<never, never>;
        Returns: FriendConnectionRow[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
