require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
} = require("discord.js");
const { connectDB } = require("./utils/db");
const fs = require("fs");
const path = require("path");

console.log("Début du script index.js"); // Ajout de log au début

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

console.log("Lecture des fichiers de commandes..."); // Ajout de log
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
  console.log(`Commande chargée : ${file}`); // Log de chaque commande chargée
}
console.log("Lecture des fichiers de commandes terminée."); // Ajout de log

client.once("ready", async () => {
  console.log(`Connecté en tant que ${client.user.tag} !`);
  console.log("Tentative d'exécution de clientStatus..."); // Ajout de log avant clientStatus
  try {
    const updateClientStatus = require("./events/clientStatus");
    await updateClientStatus(client);
    console.log("Status du bot mis à jour avec succès (boucle démarrée).");
  } catch (error) {
    console.error("Erreur lors du démarrage de la boucle de statut :", error);
  }

  console.log("Tentative de connexion à la base de données..."); // Ajout de log avant connectDB
  try {
    await connectDB();
    console.log("Connecté à la base de données MongoDB");
  } catch (error) {
    console.error("Erreur lors de la connexion à la base de données :", error);
  }

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  console.log("Tentative d'enregistrement des commandes..."); // Ajout de log avant enregistrement
  try {
    const guildId = "1240684136163967081";
    await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), {
      body: commands,
    });
    console.log("Commandes enregistrées avec succès.");
  } catch (error) {
    console.error("Erreur lors de l'enregistrement des commandes :", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("Erreur lors de l'exécution de la commande :", error);
    await interaction.reply({
      content:
        "Une erreur est survenue lors de l'exécution de cette commande !",
      ephemeral: true,
    });
  }
});

require("./utils/ai")(client);

client.login(process.env.DISCORD_TOKEN);

console.log("Fin du script index.js (avant la connexion)"); // Ajout de log à la fin
