export interface OutboxEvent {
  id:any,
  routing_key:string,
  payload:any
}
