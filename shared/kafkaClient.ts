import { Kafka, Producer, Consumer, KafkaConfig, Partitioners } from 'kafkajs';

export class KafkaClient {
  private static instance: KafkaClient;
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();

  private constructor() {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    const clientId = process.env.KAFKA_CLIENT_ID || 'talentsync-microservices';

    const kafkaConfig: KafkaConfig = {
      clientId,
      brokers,
      retry: {
        initialRetryTime: 300,
        retries: 8,
      },
    };

    this.kafka = new Kafka(kafkaConfig);
  }

  public static getInstance(): KafkaClient {
    if (!KafkaClient.instance) {
      KafkaClient.instance = new KafkaClient();
    }
    return KafkaClient.instance;
  }

  public async getProducer(): Promise<Producer> {
    if (!this.producer) {
      this.producer = this.kafka.producer({
        createPartitioner: Partitioners.DefaultPartitioner,
      });
      await this.producer.connect();
      console.log('[KafkaClient] Producer connected successfully');
    }
    return this.producer;
  }

  public async emitEvent(topic: string, message: object): Promise<void> {
    try {
      const producer = await this.getProducer();
      await producer.send({
        topic,
        messages: [
          {
            key: (message as any).id || (message as any).applicationId || String(Date.now()),
            value: JSON.stringify({
              ...message,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
      console.log(`[KafkaClient] Event emitted to topic '${topic}'`);
    } catch (error) {
      console.error(`[KafkaClient] Error emitting event to topic '${topic}':`, error);
      throw error;
    }
  }

  public async getConsumer(groupId: string, topics: string[], onMessage: (topic: string, message: any) => Promise<void>): Promise<Consumer> {
    if (this.consumers.has(groupId)) {
      return this.consumers.get(groupId)!;
    }

    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();

    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: true });
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const payloadString = message.value?.toString();
          if (payloadString) {
            const parsedData = JSON.parse(payloadString);
            console.log(`[KafkaConsumer - ${groupId}] Received message on '${topic}' [P:${partition}]`);
            await onMessage(topic, parsedData);
          }
        } catch (err) {
          console.error(`[KafkaConsumer - ${groupId}] Failed to process message:`, err);
        }
      },
    });

    this.consumers.set(groupId, consumer);
    console.log(`[KafkaClient] Consumer group '${groupId}' connected and subscribed to topics: ${topics.join(', ')}`);
    return consumer;
  }

  public async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
    }
    for (const [groupId, consumer] of this.consumers.entries()) {
      await consumer.disconnect();
    }
    console.log('[KafkaClient] All producers and consumers disconnected.');
  }
}
