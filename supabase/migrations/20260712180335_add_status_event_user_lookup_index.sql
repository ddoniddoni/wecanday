create index routine_item_status_events_user_id_effective_at_idx
  on public.routine_item_status_events(user_id, effective_at desc);
