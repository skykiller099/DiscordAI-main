const { GoogleGenerativeAI } = require("@google/generative-ai");
const gemini = require("../models/gemini");
const fs = require("fs");
const path = require("path");
const util = require("util");
require("dotenv").config();

const readFileAsync = util.promisify(fs.readFile);
const historiqueMessages = new Map(); // Utilisation d'un Map pour stocker l'historique des messages par canal

const DEVELOPER_ID = process.env.DEVELOPER_ID;
const MOKA_ID = process.env.MOKA_ID;
const REGLEMENT_CHANNEL_ID = process.env.REGLEMENT_CHANNEL_ID;
const PARTENARIAT_CHANNEL_ID = process.env.PARTENARIAT_CHANNEL_ID;
const TICKET_CHANNEL_ID = process.env.TICKET_CHANNEL_ID;

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return; // Ignorer les messages des bots

    try {
      const data = await gemini.findOne({ GuildId: message.guildId });
      if (
        !data ||
        !data.ChannelIds ||
        !data.ChannelIds.includes(message.channel.id)
      )
        return; // Vérifier si le canal est configuré pour Gemini

      const API_KEY = process.env.GEMINI_API_KEY;
      const MODELE = process.env.MODELE;

      const ai = new GoogleGenerativeAI(API_KEY);
      const modele = ai.getGenerativeModel({ model: MODELE });

      const botMentionne = message.mentions.has(client.user);
      const estReponseAuBot =
        message.reference &&
        (await message.fetchReference()).author.id === client.user.id;

      const messageContentLower = message.cleanContent.toLowerCase();
      const asksForRoles =
        messageContentLower.includes("roles") ||
        messageContentLower.includes("rôles");
      const asksForMembers =
        messageContentLower.includes("membres") ||
        messageContentLower.includes("utilisateurs");
      const asksForTextChannels =
        messageContentLower.includes("canaux textuels") ||
        messageContentLower.includes("channels textuels");
      const asksForVoiceChannels =
        messageContentLower.includes("canaux vocaux") ||
        messageContentLower.includes("channels vocaux");
      const asksForCategories = messageContentLower.includes("catégories");
      const asksForEmojis =
        messageContentLower.includes("émojis") ||
        messageContentLower.includes("emotes");
      const asksForBots = messageContentLower.includes("bots");
      const asksForBoostLevel =
        messageContentLower.includes("niveau de boost") ||
        messageContentLower.includes("tier de boost");
      const asksForBoostCount =
        messageContentLower.includes("nombre de boosts") ||
        messageContentLower.includes("combien de boosts");
      const asksForStickers =
        messageContentLower.includes("autocollants") ||
        messageContentLower.includes("stickers");
      const asksForReglement =
        messageContentLower.includes("règlement") ||
        messageContentLower.includes("reglement") ||
        messageContentLower.includes("rules");
      const asksForRoleSelection =
        messageContentLower.includes("choisir ses rôles") ||
        messageContentLower.includes("obtenir des rôles") ||
        messageContentLower.includes("sélectionner ses rôles");
      const asksForPartenariat =
        messageContentLower.includes("partenariat") ||
        messageContentLower.includes("partner");
      const asksForTicket =
        messageContentLower.includes("ticket") ||
        messageContentLower.includes("staff") ||
        messageContentLower.includes("aide") ||
        messageContentLower.includes("support");
      const asksForServerInfo =
        messageContentLower.includes("serveur") &&
        (messageContentLower.includes("info") ||
          messageContentLower.includes("informations"));
      const asksGeneralInfo =
        messageContentLower.includes("combien") ||
        messageContentLower.includes("nombre") ||
        messageContentLower.includes("total");

      const shouldTriggerInfo =
        asksForRoles ||
        asksForMembers ||
        asksForTextChannels ||
        asksForVoiceChannels ||
        asksForCategories ||
        asksForEmojis ||
        asksForBots ||
        asksForBoostLevel ||
        asksForBoostCount ||
        asksForStickers ||
        asksForReglement ||
        asksForRoleSelection ||
        asksForPartenariat ||
        asksForTicket ||
        asksForServerInfo ||
        asksGeneralInfo;

      if (!botMentionne && !estReponseAuBot && !shouldTriggerInfo) return; // Ne répondre que si mentionné, réponse ou requête info serveur

      message.channel.sendTyping(); // Indiquer que le bot est en train d'écrire

      const cheminFichierPersonnalite = path.join(
        __dirname,
        "../personality.txt"
      );
      const contenuPersonnalite = await readFileAsync(
        cheminFichierPersonnalite,
        "utf-8"
      );
      const lignesPersonnalite = contenuPersonnalite.trim();

      let historiqueCanal = historiqueMessages.get(message.channel.id) || [];

      historiqueCanal.push({
        auteur: message.author.id,
        contenu: message.cleanContent,
      });

      historiqueCanal = historiqueCanal.slice(-10); // Garder seulement les 10 derniers messages
      historiqueMessages.set(message.channel.id, historiqueCanal);

      const messagesContextuels = historiqueCanal
        .map((msg) => `<@${msg.auteur}>: ${msg.contenu}`)
        .join("\n");

      let prompt = `${lignesPersonnalite}\n\nContexte des messages précédents :\n${messagesContextuels}\n\nInstructions :\n1. Salue l'utilisateur : <@${
        message.author.id
      }>\nProcédure de sécurité 1 : ${
        message.author.id === DEVELOPER_ID
          ? "DÉVELOPPEUR RECONNU."
          : "UTILISATEUR NON RECONNU COMME DÉVELOPPEUR. SON ID NE CORRESPOND PAS."
      }>\nProcédure de sécurité 2 : ${
        message.author.id === MOKA_ID
          ? "L'UTILISATEUR EST MOKA."
          : "L'UTILISATEUR N'EST PAS MOKA."
      }\n
      3. `;

      const memberCount = message.guild.memberCount;
      const roleCount = message.guild.roles.cache.size;
      const textChannelCount = message.guild.channels.cache.filter(
        (channel) => channel.type === 0
      ).size;
      const voiceChannelCount = message.guild.channels.cache.filter(
        (channel) => channel.type === 2
      ).size;
      const categoryCount = message.guild.channels.cache.filter(
        (channel) => channel.type === 4
      ).size;
      const emojiCount = message.guild.emojis.cache.size;
      const botCount = message.guild.members.cache.filter(
        (member) => member.user.bot
      ).size;
      const boostLevel = message.guild.premiumTier;
      const boostCount = message.guild.premiumSubscriptionCount;
      const stickerCount = message.guild.stickers.cache.size;

      let serverInfo = `Informations de base du serveur :\n- Membres : ${memberCount}\n- Bots : ${botCount}\n- Rôles : ${roleCount}\n- Canaux textuels : ${textChannelCount}\n- Canaux vocaux : ${voiceChannelCount}\n- Catégories : ${categoryCount}\n- Émojis : ${emojiCount}\n- Niveau de boost : ${boostLevel}\n- Nombre de boosts : ${boostCount}\n- Autocollants : ${stickerCount}\n`;
      if (REGLEMENT_CHANNEL_ID) {
        serverInfo += `- Règlement : <#${REGLEMENT_CHANNEL_ID}>\n`;
      }
      if (PARTENARIAT_CHANNEL_ID) {
        serverInfo += `- Conditions de partenariat : <#${PARTENARIAT_CHANNEL_ID}>\n`;
      }
      if (TICKET_CHANNEL_ID) {
        serverInfo += `- Contacter le staff : <#${TICKET_CHANNEL_ID}>\n`;
      }

      if (asksForRoles) {
        prompt += `L'utilisateur a spécifiquement demandé des informations sur les rôles. Fournis le nombre total de rôles : ${roleCount}. Pour choisir des rôles, tu peux aller dans <id:customize>.`;
      } else if (asksForMembers) {
        prompt += `L'utilisateur a spécifiquement demandé des informations sur les membres. Fournis le nombre total de membres : ${memberCount}.`;
      } else if (asksForTextChannels) {
        prompt += `L'utilisateur a spécifiquement demandé des informations sur les canaux textuels. Fournis le nombre total de canaux textuels : ${textChannelCount}.`;
      } else if (asksForVoiceChannels) {
        prompt += `L'utilisateur a spécifiquement demandé des informations sur les canaux vocaux. Fournis le nombre total de canaux vocaux : ${voiceChannelCount}.`;
      } else if (asksForCategories) {
        prompt += `L'utilisateur a spécifiquement demandé des informations sur les catégories. Fournis le nombre total de catégories : ${categoryCount}.`;
      } else if (asksForEmojis) {
        prompt += `L'utilisateur a spécifiquement demandé des informations sur les émojis. Fournis le nombre total d'émojis : ${emojiCount}.`;
      } else if (asksForBots) {
        prompt += `L'utilisateur a spécifiquement demandé des informations sur les bots. Fournis le nombre total de bots : ${botCount}.`;
      } else if (asksForBoostLevel) {
        prompt += `L'utilisateur a spécifiquement demandé le niveau de boost du serveur. Le niveau de boost actuel est : ${boostLevel}.`;
      } else if (asksForBoostCount) {
        prompt += `L'utilisateur a spécifiquement demandé le nombre de boosts du serveur. Le nombre total de boosts est : ${boostCount}.`;
      } else if (asksForStickers) {
        prompt += `L'utilisateur a spécifiquement demandé des informations sur les autocollants. Le nombre total d'autocollants est : ${stickerCount}.`;
      } else if (asksForReglement && REGLEMENT_CHANNEL_ID) {
        prompt += `L'utilisateur a demandé où trouver le règlement. Tu peux le consulter ici : <#${REGLEMENT_CHANNEL_ID}>.`;
      } else if (asksForRoleSelection) {
        prompt += `L'utilisateur a demandé comment choisir ses rôles. Tu peux généralement le faire dans <id:customize>.`;
      } else if (
        asksForPartenariat &&
        PARTENARIAT_CHANNEL_ID &&
        TICKET_CHANNEL_ID
      ) {
        prompt += `L'utilisateur a demandé les conditions de partenariat. Tu peux les consulter ici : <#${PARTENARIAT_CHANNEL_ID}>. Une fois que tu les as lues, ouvre un ticket dans <#${TICKET_CHANNEL_ID}> pour faire une demande de partenariat.`;
      } else if (asksForPartenariat && PARTENARIAT_CHANNEL_ID) {
        prompt += `L'utilisateur a demandé les conditions de partenariat. Tu peux les consulter ici : <#${PARTENARIAT_CHANNEL_ID}>.`;
      } else if (asksForTicket && TICKET_CHANNEL_ID) {
        prompt += `L'utilisateur a demandé comment contacter le staff. Tu peux ouvrir un ticket ici : <#${TICKET_CHANNEL_ID}>.`;
      } else if (asksForServerInfo || asksGeneralInfo) {
        prompt += `L'utilisateur a posé une question générale sur le serveur ou demandé des informations. Fournis les informations de base suivantes :${serverInfo}`;
      } else {
        prompt += `Fournis une réponse basée sur la question de l'utilisateur, en tenant compte des informations de base du serveur si pertinent :${serverInfo}`;
      }

      prompt += `4. Réponds en conservant la personnalité décrite.\n5. Réponds avec moins de 2000 caractères.\n6. Utilise des emojis/kaomojis si c'est approprié.\n\nMessage de l'utilisateur : ${message.cleanContent
        .replace(/<@!?\d+>/g, "")
        .trim()}<`;

      prompt += "\n\nRéponse :";

      let texteGenere = "";
      let tentatives = 0;
      const maxTentatives = 3;

      while (tentatives < maxTentatives) {
        try {
          const { response } = await modele.generateContent(prompt);
          texteGenere = response.text().trim();
          break;
        } catch (error) {
          if (error.message.includes("SAFETY")) {
            tentatives++;
            prompt +=
              "\n\nMerci de générer une réponse plus appropriée et sécurisée.";
          } else {
            throw error;
          }
        }
      }

      if (texteGenere.length === 0) {
        texteGenere =
          "Je suis désolé, je n'ai pas pu générer une réponse appropriée pour le moment. Pourriez-vous reformuler votre question ?";
      }

      const reponseFinale =
        texteGenere.length > 2000
          ? texteGenere.substring(0, 1997) + "..."
          : texteGenere;

      await message.reply({
        content: reponseFinale,
        allowedMentions: { parse: ["users"] }, // Permettre les mentions dans la réponse
      });
    } catch (error) {
      console.error("Erreur lors du traitement du message :", error);
      await message.reply(
        "Je suis désolé, une erreur est survenue lors du traitement de votre message. Veuillez réessayer plus tard."
      );
    }
  });
};
