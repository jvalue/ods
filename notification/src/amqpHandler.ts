export class AmqpHandler{
    amqp = require("amqplib/callback_api");
    rabbit_url = process.env.RABBIT_SERVICE_URL;
    rabbit_usr = process.env.RABBIT_SERVICE_USR;
    rabbit_password = process.env.RABBIT_SERVICE_PWD;

    rabit_amqp_url = 'amqp://' + this.rabbit_usr + ':' + this.rabbit_password + '@' + this.rabbit_url;

    constructor() {
        
    }

    public connect() {
        console.log("URL"+this.rabit_amqp_url)
        this.amqp.connect(this.rabit_amqp_url, function (error0, connection) {
            if (error0) {
                console.error("Error connecting to RabbitMQ: " + error0);
                return null
            }
            console.log("Connected to RabbitMQ.");

            connection.createChannel(function (error1 , channel) {
            if (error1) {
                throw error1;
            }

            var queue = "test_queue";

            channel.assertQueue(queue, {
                durable: false,
            });

            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

            channel.consume(
                queue,
                function (msg:object) {
                console.log(" [x] Received %s", msg.content.toString());
                },
                {
                noAck: true,
                }
            );
            });
        });
        }
}

    
