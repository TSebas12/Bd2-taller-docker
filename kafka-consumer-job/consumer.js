const { Kafka } = require('kafkajs');

console.log(' Iniciando Kafka Consumer Job...');

const kafka = new Kafka({
  clientId: 'tournament-consumer-job',
  brokers: [process.env.KAFKA_BROKER || 'my-kafka:9092']
});

const consumer = kafka.consumer({ 
  groupId: 'tournament-consumer-group' 
});

const runConsumer = async () => {
  try {
    console.log(' Conectando a Kafka...');
    await consumer.connect();
    console.log('✅ Conectado a Kafka');
    
    console.log(' Suscribiéndose al topic: registrations');
    await consumer.subscribe({ 
      topic: 'registrations', 
      fromBeginning: false 
    });
    console.log('✅ Suscrito al topic registrations');

    console.log(' Escuchando mensajes...\n');

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const registration = JSON.parse(message.value.toString());
          
          console.log(' NUEVO REGISTRO RECIBIDO:');
          console.log('--------------------------------');
          console.log(` Torneo ID: ${registration.tournamentId}`);
          console.log(` Participante ID: ${registration.participant.id}`);
          console.log(` Nombre: ${registration.participant.name}`);
          console.log(`  Peso: ${registration.participant.weight} kg`);
          console.log(` Edad: ${registration.participant.age}`);
          console.log(` Partition: ${partition}`);
          console.log(` Topic: ${topic}`);
          console.log('--------------------------------\n');
          
        } catch (parseError) {
          console.error('❌ Error parsing message:', parseError);
          console.log('Raw message:', message.value.toString());
        }
      },
    });

  } catch (error) {
    console.error('❌ Error en el consumer:', error);
    process.exit(1);
  }
};

// Manejar cierre graceful
process.on('SIGTERM', async () => {
  console.log('🔌 Cerrando consumer...');
  await consumer.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔌 Cerrando consumer (SIGINT)...');
  await consumer.disconnect();
  process.exit(0);
});

runConsumer().catch(console.error);