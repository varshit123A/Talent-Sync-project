import { Kafka, Producer } from 'kafkajs';

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'kafka:9092';

const kafka = new Kafka({
  clientId: 'job-service',
  brokers: [KAFKA_BROKER],
});

let producer: Producer | null = null;

export const getKafkaProducer = async (): Promise<Producer> => {
  if (!producer) {
    producer = kafka.producer();
    console.log('[job-service] Connecting to Kafka Producer...');
    await producer.connect();
    console.log('[job-service] Kafka Producer connected successfully');
  }
  return producer;
};

export const publishJobCreatedEvent = async (jobData: object) => {
  try {
    const prod = await getKafkaProducer();
    await prod.send({
      topic: 'job-events',
      messages: [
        {
          key: 'JOB_CREATED',
          value: JSON.stringify({
            eventType: 'JOB_CREATED',
            timestamp: new Date().toISOString(),
            payload: jobData,
          }),
        },
      ],
    });
    console.log('[Kafka Event Published] Topic: job-events | Event: JOB_CREATED');
  } catch (error) {
    console.error('[Kafka Producer Error] Failed to publish event:', error);
  }
};