const { ActivityType, PresenceUpdateStatus } = require("discord.js");

const SERVER_ID = "1240684136163967081"; // Remplace par l'ID de ton serveur
const STATUS_UPDATE_INTERVAL = 3000; // Mise à jour toutes les 3 secondes

async function fetchBanCount(client) {
  try {
    const guild = client.guilds.cache.get(SERVER_ID);
    if (!guild) return 0;
    const bans = await guild.bans.fetch();
    return bans.size;
  } catch (error) {
    console.error(
      "[BAN COUNT] Erreur lors de la récupération du nombre de bans :",
      error
    );
    return "Erreur";
  }
}

module.exports = async (client) => {
  const statuses = [
    async () => ({
      name: `Bans: ${await fetchBanCount(client)}`,
      type: ActivityType.Watching,
      status: "dnd",
    }),
    () => ({
      name: `Latence: ${client.ws.ping}ms`,
      type: ActivityType.Watching,
      status: "dnd",
    }),
    () => ({
      name: "Dev by skykiller",
      type: ActivityType.Playing,
      status: "idle",
    }),
    () => ({
      name: "kawataki server",
      type: ActivityType.Streaming,
      url: "https://www.twitch.tv/discord",
      status: "streaming",
    }),
  ];

  let index = 0;

  setInterval(async () => {
    try {
      const currentStatus =
        typeof statuses[index] === "function"
          ? await statuses[index]()
          : statuses[index];
      await client.user.setPresence({
        activities: [currentStatus],
        status: currentStatus.status,
      });
    } catch (error) {
      console.error(
        "[STATUS] Erreur lors de la mise à jour du statut :",
        error
      );
    }

    index = (index + 1) % statuses.length;
  }, STATUS_UPDATE_INTERVAL);
};
