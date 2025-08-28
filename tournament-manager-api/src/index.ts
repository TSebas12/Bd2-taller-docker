import express from "express";
import mongoose, { model, Schema } from "mongoose";
import { Kafka } from "kafkajs";
import { connectKafka } from './controllers/registrationController';
import registrationRoutes from './routes/registrationRoutes';

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tournament_designer';

const kafka = new Kafka({
  clientId: "tournament-api",
  brokers: ["my-kafka:9092"], // broker dentro del Docker
});
const producer = kafka.producer();
(async () => { await producer.connect(); console.log("✅ Kafka Producer conectado"); })();

// Crear el topic si no existe
const admin = kafka.admin();
(async () => {
  await admin.connect();
  const topics = await admin.listTopics();
  if (!topics.includes('registrations')) {
    await admin.createTopics({
      topics: [{
        topic: 'registrations',
        numPartitions: 1,
        replicationFactor: 1
      }]
    });
    console.log("✅ Topic 'registrations' creado");
  }
  await admin.disconnect();
})();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Pass to next layer of middleware
    next();
});

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error conectando a MongoDB:", err));


const tournamentSchema = new Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    roster: [{
      id: { type: Number, required: true },
      name: { type: String, required: true },
      weight: { type: Number, required: true },
      age: { type: Number, required: true },
    }]
  },
  { timestamps: true }
);

const Tournament = model("Tournament", tournamentSchema);


app.post('/upload-data', async (req, res) => {
  const data = req.body;
  // Here you would handle the data upload logic
  console.log("Data received:", data);

  await Tournament.insertMany(req.body);
  res.status(201).json({ message: `Inserted ${req.body.length} tournaments!` });
});

// Endpoint /registrar ------------------------------------------
app.post('/registrar', async (req, res) => {
  try {
    const { tournamentId, participant } = req.body;

    // Validación básica
    if (!tournamentId || !participant || !participant.id || !participant.name || !participant.weight || !participant.age) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // Buscar el torneo
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Torneo no encontrado" });
    }

    // Agregar el participante al roster
    tournament.roster.push(participant);
    await tournament.save();

    // Enviar participante a Kafka
    await producer.send({
      topic: "registrations",
      messages: [{ value: JSON.stringify({ tournamentId, participant }) }],
    });

    console.log("✅ Nuevo participante registrado:", participant);
    res.status(201).json({ message: "Participante registrado correctamente", participant });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Error registrando participante:", err.message);
      res.status(500).json({ message: "Error registrando participante", error: err.message });
    } else {
      console.error("❌ Error registrando participante:", err);
      res.status(500).json({ message: "Error registrando participante", error: "Unknown error" });
    }
  }
});


app.get('/fetch-tournaments', async (req, res) => {
  const tournaments = await Tournament.find();
  res.status(200).json(tournaments);
});

app.get("/", (req, res) => {
  res.json({ message: "Tournament Designer API is running!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
