const { ActivityType, PresenceUpdateStatus } = require("discord.js");
const { setTimeout } = require("node:timers/promises");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    const SERVER_ID = "1240684136163967081"; // Remplace par l'ID de ton serveur

    async function fetchBanCount() {
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

    const statuses = [
      async () => ({
        name: `Bans: ${await fetchBanCount()}`,
        type: ActivityType.Watching,
        status: PresenceUpdateStatus.DoNotDisturb, // Statut Ne pas déranger pour les bans
      }),
      () => ({
        name: `Latence: ${client.ws.ping}ms`,
        type: ActivityType.Watching,
        status: PresenceUpdateStatus.Online, // Statut En ligne pour la latence
      }),
      () => ({
        name: "Dev by skykiller",
        type: ActivityType.Playing,
        status: PresenceUpdateStatus.Idle, // Statut Absent pour le développement
      }),
      () => ({
        name: "kawataki server",
        type: ActivityType.Streaming,
        url: "https://www.twitch.tv/discord", // Remplace par ton lien Twitch (obligatoire pour le type Streaming)
        status: PresenceUpdateStatus.Streaming, // Statut Stream pour le stream
      }),
    ];

    let index = 0;

    while (true) {
      try {
        const currentStatus =
          typeof statuses[index] === "function"
            ? await statuses[index]()
            : statuses[index];
        await client.user.setPresence({
          activities: [currentStatus],
          status: currentStatus.status, // Utilisation du statut défini dans l'objet status
        });
      } catch (error) {
        console.error(
          "[STATUS] Erreur lors de la mise à jour du statut :",
          error
        );
      }

      index = (index + 1) % statuses.length;
      await setTimeout(3000);
    }
  },
};
