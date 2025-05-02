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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // Intention pour accéder aux informations des serveurs
    GatewayIntentBits.GuildMessages, // Intention pour accéder aux messages des serveurs
    GatewayIntentBits.MessageContent, // Intention pour accéder au contenu des messages (nécessaire pour certains événements)
  ],
});

client.commands = new Collection(); // Collection pour stocker les commandes
const commands = []; // Tableau pour stocker les données des commandes pour l'API
const commandsPath = path.join(__dirname, "commands"); // Chemin vers le dossier des commandes
const commandFiles = fs
  .readdirSync(commandsPath) // Lit le contenu du dossier des commandes
  .filter((file) => file.endsWith(".js")); // Filtre pour ne garder que les fichiers JavaScript

for (const file of commandFiles) {
  const command = require(`./commands/${file}`); // Importe la commande depuis le fichier
  client.commands.set(command.data.name, command); // Ajoute la commande à la collection avec son nom
  commands.push(command.data.toJSON()); // Enregistre les commandes pour l'API
}

client.once("ready", async () => {
  console.log(`Connecté en tant que ${client.user.tag} !`);
  connectDB(); // Se connecte à la base de données

  // Enregistrer les commandes
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    const clientStatus = require("./events/clientStatus");
    if (clientStatus.execute) await clientStatus.execute(client);
    console.log("Status du bot mis à jour avec succès.");

    console.log("Enregistrement des commandes...");
    // Pour les commandes globales :
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands,
    });

    // Si vous préférez enregistrer les commandes uniquement sur un serveur spécifique, utilisez ce code :
    // const guildId = 'VOTRE_ID_DE_SERVEUR';   // Remplacez par l'ID de votre serveur
    // await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: commands });

    console.log("Commandes enregistrées avec succès.");
  } catch (error) {
    console.error(error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return; // Ignore les interactions qui ne sont pas des commandes

  const command = client.commands.get(interaction.commandName); // Récupère la commande par son nom

  if (!command) return; // Si la commande n'existe pas, on ne fait rien

  try {
    await command.execute(interaction); // Exécute la commande
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content:
        "Une erreur est survenue lors de l'exécution de cette commande !",
      ephemeral: true, // La réponse n'est visible que par l'utilisateur
    });
  }
});

require("./utils/ai")(client); // Charge le module d'IA

client.login(process.env.DISCORD_TOKEN); // Se connecte à Discord avec le token
