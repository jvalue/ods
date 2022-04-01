import {OutboxEvent} from "../model/outboxEvent";
import {v4 as uuidv4} from "uuid";
import {KnexHelper} from "./knexHelper";


const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: '5432',
    user: 'adapterservice',
    password: 'admin',
    database: 'adapterservice',
    asyncStackTraces: true
  }
});

export class OutboxRepository {

  async publishToOutbox(payload: any, routingKey: string) {
    let id =uuidv4();
    let outboxEvent: OutboxEvent = {
      id:id,
      payload: payload,
      routing_key: routingKey
    }
    return await knex('public.outbox')
      .insert(outboxEvent)
      .returning('id')
      .then(function (id: any) {
        console.log(id)
        console.log("neuer code geht")
      })
      .catch(function (err: any) {
        console.log(err)
      })
  }
}
