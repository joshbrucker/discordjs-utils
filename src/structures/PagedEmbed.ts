import {
  ButtonInteraction,
  CommandInteraction,
  InteractionCollector,
  Message,
  ActionRowBuilder,
  Attachment,
  ButtonBuilder,
  ComponentEmojiResolvable,
  EmbedBuilder
} from "discord.js";
import { ButtonStyle, RESTJSONErrorCodes } from "discord-api-types/v10";
import { ignore } from "../utils/errorHandlers.js";

const backId = "back";
const forwardId = "forward";

export interface PagedEmbedOptions {
  timeout: number,
  leftEmoji: ComponentEmojiResolvable,
  rightEmoji: ComponentEmojiResolvable,
  leftStyle: Exclude<ButtonStyle, ButtonStyle.Link>,
  rightStyle: Exclude<ButtonStyle, ButtonStyle.Link>,
  showPaging: boolean,
  wrapAround: boolean
}

const DefaultOptions: PagedEmbedOptions = {
  timeout: 120000,
  leftEmoji: "⬅️",
  rightEmoji: "➡️",
  leftStyle: ButtonStyle.Secondary,
  rightStyle: ButtonStyle.Secondary,
  showPaging: true,
  wrapAround: false
}

/*
Allows for creation and customization of "paged" embeds,
where Discord users can click buttons to page through a list of embeds.
*/
export class PagedEmbed {
  timeout: number;
  leftEmoji: ComponentEmojiResolvable;
  rightEmoji: ComponentEmojiResolvable;
  leftStyle: Exclude<ButtonStyle, ButtonStyle.Link>;
  rightStyle: Exclude<ButtonStyle, ButtonStyle.Link>;
  showPaging: boolean;
  wrapAround: boolean;

  collector: InteractionCollector<any> | undefined;

  constructor(options: PagedEmbedOptions = DefaultOptions) {
    options = Object.assign(
      {} as PagedEmbedOptions,
      DefaultOptions,
      options
    );

    this.timeout = options.timeout;
    this.leftEmoji = options.leftEmoji;
    this.rightEmoji = options.rightEmoji;
    this.leftStyle = options.leftStyle;
    this.rightStyle = options.rightStyle;
    this.showPaging = options.showPaging;
    this.wrapAround = options.wrapAround;
  }

  setTimeout(timeout: number): this {
    this.timeout = timeout;
    return this;
  }

  setLeftEmoji(leftEmoji: ComponentEmojiResolvable): this {
    this.leftEmoji = leftEmoji;
    return this;
  }

  setRightEmoji(rightEmoji: ComponentEmojiResolvable): this {
    this.rightEmoji = rightEmoji;
    return this;
  }

  setLeftStyle(leftStyle: Exclude<ButtonStyle, ButtonStyle.Link>): this {
    this.leftStyle = leftStyle;
    return this;
  }

  setRightStyle(rightStyle: Exclude<ButtonStyle, ButtonStyle.Link>): this {
    this.rightStyle = rightStyle;
    return this;
  }

  setShowPaging(showPaging: boolean): this {
    this.showPaging = showPaging;
    return this;
  }

  setWrapAround(wrapAround: boolean): this {
    this.wrapAround = wrapAround;
    return this;
  }

  /*
  Expires the paged embed, making the buttons no longer clickable
  */
  expire(): void {
    this.collector?.stop();
  }

  /*
  Resets the timer that runs to expire the paged embed.
  */
  resetTimer(): void {
    this.collector?.resetTimer();
  }

  /*
  Sends a the paged embed with the given embed list and attachments.
  */
  async send(interaction: CommandInteraction, embeds: EmbedBuilder[], attachments: Attachment[] | string[] = []) {

    // Hydrate embeds with page numbers if enabled
    if (this.showPaging) {
      for (let i = 0; i < embeds.length; i++) {
        let embed = embeds[i];
        let embedData = embed.data;

        embed.setFooter({
          text: "\u200b\nPage " + (i + 1) + " / " + embeds.length + (embedData.footer ? embedData.footer.text : ""),
          iconURL: embedData.footer?.icon_url
        })
      }
    }

    // Don't set any buttons if there is only one embed
    if (embeds.length === 1) {
      await interaction.reply({
        embeds: [embeds[0]],
        files: attachments
      });
      return;
    }

    const backButton = new ButtonBuilder()
        .setStyle(this.leftStyle)
        .setEmoji(this.leftEmoji)
        .setCustomId(backId)

    const forwardButton = new ButtonBuilder()
        .setStyle(this.rightStyle)
        .setEmoji(this.rightEmoji)
        .setCustomId(forwardId)

    const getButtonRow = (currentIndex:  number, embedCount: number) => {
      if (this.wrapAround) {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
          backButton,
          forwardButton
        )
      } else {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
          ...(currentIndex ? [backButton] : []),
          ...(currentIndex < embedCount - 1 ? [forwardButton] : [])
        )
      }
    }

    let currentIndex = 0;
    let embed = await interaction.reply({
      embeds: [embeds[currentIndex]],
      files: attachments,
      components: [getButtonRow(currentIndex, embeds.length)],
      fetchReply: true
    });

    if (embed instanceof Message) {
      this.collector = embed.createMessageComponentCollector({
        time: this.timeout
      });

      this.collector.on("collect", async (buttonInteraction: ButtonInteraction) => {
        this.resetTimer();

        if (buttonInteraction.customId === backId) {
          currentIndex -= 1;
        } else {
          currentIndex += 1;
        }

        // Modulo current index to support wrap arounds
        if (this.wrapAround) {
          currentIndex = ((currentIndex % embeds.length) + embeds.length) % embeds.length;
        }

        await buttonInteraction.update({
          embeds: [embeds[currentIndex]],
          components: [getButtonRow(currentIndex, embeds.length)]
        }).catch(ignore([RESTJSONErrorCodes.UnknownInteraction]));
      });

      this.collector.on("end", async () => {
        backButton.setDisabled(true)
        forwardButton.setDisabled(true)

        await interaction.editReply({
          components: [getButtonRow(currentIndex, embeds.length)]
        }).catch(ignore([RESTJSONErrorCodes.UnknownMessage]));
      });
    }
  }
};