const { PermissionsBitField, SlashCommandBuilder, ChannelType } = require("discord.js");
const gemini = require("../models/gemini");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("view-ia") 
    .setDescription("Affiche les canaux configurés pour les réponses de l'IA."),
  async execute(interaction) {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content: "Seuls les administrateurs peuvent utiliser cette commande.",
        ephemeral: true,
      });
    }

    try {
      const data = await gemini.findOne({ GuildId: interaction.guild.id });
      if (!data || !data.ChannelIds || data.ChannelIds.length === 0) {
        return interaction.reply({
          content: "Aucun canal IA n'a été configuré pour ce serveur.",
          ephemeral: true,
        });
      }

      const channelList = [];
      for (const channelId of data.ChannelIds) {
        const channel = await interaction.guild.channels.fetch(channelId);
        if (channel) {
          channelList.push(channel.toString()); // Ajoute la mention du canal à la liste
        } else {
          channelList.push(`Canal introuvable (ID: ${channelId})`);
        }
      }

      if (channelList.length > 0) {
        return interaction.reply({
          content: `Les canaux IA configurés pour ce serveur sont :\n${channelList.join("\n")}`,
          ephemeral: true,
        });
      } else {
        return interaction.reply({
          content: "Aucun canal IA valide n'a été trouvé dans la configuration.",
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content:
          "Une erreur est survenue lors de la récupération de la configuration des canaux IA.",
        ephemeral: true,
      });
    }
  },
};