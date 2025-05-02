const {
  PermissionsBitField,
  SlashCommandBuilder,
  ChannelType,
} = require("discord.js");
const gemini = require("../models/gemini");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ajouter-canal-ia") // Nom modifié pour refléter l'ajout
    .setDescription("Permet d'ajouter un canal où l'IA répondra.")
    .addChannelOption((option) =>
      option
        .setName("canal")
        .setDescription("Canal du Chat IA à ajouter")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
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

    const channel = interaction.options.getChannel("canal");

    try {
      let data = await gemini.findOne({ GuildId: interaction.guild.id });

      if (!data) {
        // Si aucune configuration n'existe, on crée une nouvelle avec le premier canal
        data = await gemini.create({
          GuildId: interaction.guild.id,
          ChannelIds: [channel.id], // Initialise ChannelIds avec un tableau contenant l'ID du canal
        });
        return interaction.reply({
          content: `Le canal ${channel} a été ajouté comme étant autorisé pour l'IA.`,
          ephemeral: true,
        });
      } else {
        // Si une configuration existe, on ajoute l'ID du canal au tableau (si ce n'est pas déjà le cas)
        if (!data.ChannelIds.includes(channel.id)) {
          data.ChannelIds.push(channel.id);
          await data.save();
          return interaction.reply({
            content: `Le canal ${channel} a été ajouté à la liste des canaux autorisés pour l'IA.`,
            ephemeral: true,
          });
        } else {
          return interaction.reply({
            content: `Le canal ${channel} est déjà configuré pour l'IA.`,
            ephemeral: true,
          });
        }
      }
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: "Une erreur est survenue lors de l'ajout du canal.",
        ephemeral: true,
      });
    }
  },
};
