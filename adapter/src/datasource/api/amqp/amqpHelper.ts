import * as Amqp from 'amqp-ts';
export class amqpHelper {
  static async publishAmqpMessage() {
    const connection = new Amqp.Connection(
      'amqp://rabbit_adm:R4bb!7_4DM_p4SS@localhost:5672',
    );
    const exchange = connection.declareExchange('ods_global', 'topic');
    const queue = connection.declareQueue('adapter.datasource-import-trigger');
    queue.bind(exchange);

    const msg = new Amqp.Message({
      datasourceId: 5,
      runtimeParameters: { id: 'd' },
    });
    exchange.send(msg, 'datasource.import-trigger.created');
  }
}
