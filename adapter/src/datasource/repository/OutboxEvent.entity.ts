export interface OutboxEvent {
  id: unknown;
  routing_key: string;
  payload: unknown;
}
