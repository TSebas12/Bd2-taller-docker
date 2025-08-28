import { Request, Response } from 'express';
import { Kafka } from 'kafkajs';

// Configurar Kafka
const kafka = new Kafka({
  clientId: 'tournament-api',
  brokers: [process.env.KAFKA_BROKER || 'my-kafka:9092']
});

const producer = kafka.producer();

// Conectar a Kafka al iniciar
export const connectKafka = async () => {
  try {
    await producer.connect();
    console.log('✅ Conectado a Kafka');
  } catch (error) {
    console.error('❌ Error conectando a Kafka:', error);
  }
};

export const registerParticipant = async (req: Request, res: Response) => {
  try {
    const { tournamentId, id, name, weight, age } = req.body;

    // 1. Insertar en MongoDB (aquí debes tener tu lógica actual)
    // Asumiendo que tienes un modelo o conexión a MongoDB
    const db = (req as any).app.locals.db;
    const result = await db.collection('participants').insertOne({
      tournamentId,
      id,
      name,
      weight,
      age,
      registeredAt: new Date()
    });

    // 2. Encolar en Kafka
    const kafkaMessage = {
      tournamentId,
      participantId: id,
      name,
      weight: Number(weight),
      age: Number(age),
      mongoId: result.insertedId.toString(),
      timestamp: new Date().toISOString()
    };

    await producer.send({
      topic: 'tournament-registrations',
      messages: [
        {
          value: JSON.stringify(kafkaMessage)
        }
      ]
    });

    console.log('✅ Registro enviado a Kafka:', kafkaMessage);

    res.status(201).json({
      message: 'Participante registrado exitosamente',
      participantId: id,
      mongoId: result.insertedId
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};