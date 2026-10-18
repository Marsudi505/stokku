-- Perkecil permukaan serangan: SECURITY DEFINER hanya untuk user yang login.
-- Helper dipakai policy `to authenticated`; RPC memang API app (butuh login).
revoke execute on function
  public.app_role(),
  public.app_store(),
  public.is_owner(),
  public.adjust_stock(uuid, integer, text, text, uuid),
  public.transfer_stock(uuid, uuid, uuid, integer, text),
  public.request_stock_change(uuid, integer, text, text, uuid),
  public.review_stock_request(uuid, boolean, text),
  public.submit_opname_batch(jsonb, uuid)
from public, anon;

grant execute on function
  public.app_role(),
  public.app_store(),
  public.is_owner(),
  public.adjust_stock(uuid, integer, text, text, uuid),
  public.transfer_stock(uuid, uuid, uuid, integer, text),
  public.request_stock_change(uuid, integer, text, text, uuid),
  public.review_stock_request(uuid, boolean, text),
  public.submit_opname_batch(jsonb, uuid)
to authenticated;
