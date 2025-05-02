const {
  PermissionsBitField,
  SlashCommandBuilder,
  ChannelType,
} = require("discord.js");
const gemini = require("../models/gemini");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dlt-ia") // Nom modifié pour être plus explicite
    .setDescription("Permet de supprimer un canal de la liste où l'IA répond.")
    .addChannelOption(
      (option) =>
        option
          .setName("canal")
          .setDescription(
            "Canal IA à supprimer (facultatif, utilise le canal actuel si non spécifié)"
          )
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false) // Définit l'option comme facultative
    ),
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

    let channelToRemove = interaction.options.getChannel("canal");

    // Si l'option 'canal' n'est pas fournie, utilise le canal actuel
    if (!channelToRemove) {
      channelToRemove = interaction.channel;
    }

    try {
      const data = await gemini.findOne({ GuildId: interaction.guild.id });

      if (!data || !data.ChannelIds || data.ChannelIds.length === 0) {
        return interaction.reply({
          content: "Aucun canal IA n'est configuré pour ce serveur.",
          ephemeral: true,
        });
      }

      const initialChannelCount = data.ChannelIds.length;
      data.ChannelIds = data.ChannelIds.filter(
        (channelId) => channelId !== channelToRemove.id
      );

      if (data.ChannelIds.length < initialChannelCount) {
        await data.save();
        return interaction.reply({
          content: `Le canal ${channelToRemove} a été supprimé de la liste des canaux IA autorisés.`,
          ephemeral: true,
        });
      } else {
        return interaction.reply({
          content: `Le canal ${channelToRemove} n'était pas configuré comme canal IA pour ce serveur.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: "Une erreur est survenue lors de la suppression du canal IA.",
        ephemeral: true,
      });
    }
  },
};
