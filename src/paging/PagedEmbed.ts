import {
  ButtonInteraction,
  CommandInteraction,
  InteractionCollector,
  ActionRowBuilder,
  Attachment,
  ButtonBuilder,
  ComponentEmojiResolvable,
  EmbedBuilder,
  InteractionCallbackResponse,
} from "discord.js";
import { ButtonStyle, RESTJSONErrorCodes } from "discord-api-types/v10";

import { DEFAULT_OPTIONS, PagedEmbedOptions } from "./PagedEmbedOptions";
import { ignore } from "../utils/errorHandlers.js";

export class PagedEmbedSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PagedEmbedSendError";
  }
}

/*
Allows for creation and customization of "paged" embeds,
where Discord users can click buttons to page through a list of embeds.
*/
export class PagedEmbed {
  public static readonly BACK_ID = "back";
  public static readonly FORWARD_ID = "forward";

  timeout: number;
  leftEmoji: ComponentEmojiResolvable;
  rightEmoji: ComponentEmojiResolvable;
  leftStyle: Exclude<ButtonStyle, ButtonStyle.Link>;
  rightStyle: Exclude<ButtonStyle, ButtonStyle.Link>;
  showPageNumbers: boolean;
  wrapAround: boolean;
  resetTimerOnPress: boolean;

  collector: InteractionCollector<any> | undefined;
  backButton: ButtonBuilder;
  forwardButton: ButtonBuilder;

  constructor(options: PagedEmbedOptions) {
    options = { ...DEFAULT_OPTIONS, ...options };

    this.timeout = options.timeout;
    this.leftEmoji = options.leftEmoji;
    this.rightEmoji = options.rightEmoji;
    this.leftStyle = options.leftStyle;
    this.rightStyle = options.rightStyle;
    this.showPageNumbers = options.showPageNumbers;
    this.wrapAround = options.wrapAround;
    this.resetTimerOnPress = options.resetTimerOnPress;

    this.backButton = new ButtonBuilder();
    this.forwardButton = new ButtonBuilder();
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

  withShowPageNumbers(showPageNumbers: boolean): this {
    this.showPageNumbers = showPageNumbers;
    return this;
  }

  withWrapAround(wrapAround: boolean): this {
    this.wrapAround = wrapAround;
    return this;
  }

  withResetTimerOnPress(resetTimerOnPress: boolean): this {
    this.resetTimerOnPress = resetTimerOnPress;
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
  resetTimer(newTimeout?: number): void {
    this.collector?.resetTimer({ time: newTimeout || this.timeout });
  }

  /*
  Sends a the paged embed with the given embed list and attachments.
  */
  async send(
    interaction: CommandInteraction,
    embeds: EmbedBuilder[],
    attachments: Attachment[] | string[] = [],
    startIndex = 0
  ) {
    if (embeds.length === 0) {
      throw new PagedEmbedSendError("Embed list size must be at least 1.");
    }

    if (startIndex < 0 || startIndex >= embeds.length) {
      throw new PagedEmbedSendError(
        "startIndex must be within bounds of embed list size."
      );
    }

    // Hydrate embeds with current page number over total page numbers, if requested
    if (this.showPageNumbers) {
      for (let i = 0; i < embeds.length; i++) {
        const embed = embeds[i];

        embed.setFooter({
          text:
            "\u200b\n" +
            `Page ${i + 1} / ${embeds.length}` +
            (embed.data.footer ? embed.data.footer.text : ""),
          iconURL: embed.data.footer?.icon_url,
        });
      }
    }

    // Don't set any buttons if there is only one embed
    if (embeds.length === 1) {
      await interaction.reply({
        embeds: [embeds[0]],
        files: attachments,
      });
      return;
    }

    this.backButton
      .setStyle(this.leftStyle)
      .setEmoji(this.leftEmoji)
      .setCustomId(PagedEmbed.BACK_ID);

    this.forwardButton
      .setStyle(this.rightStyle)
      .setEmoji(this.rightEmoji)
      .setCustomId(PagedEmbed.FORWARD_ID);

    const getButtonRow = (currentIndex: number, embedCount: number) => {
      const showBackButton = currentIndex > 0 || this.wrapAround;
      const showForwardButton =
        currentIndex < embedCount - 1 || this.wrapAround;

      return new ActionRowBuilder<ButtonBuilder>().addComponents(
        ...(showBackButton ? [this.backButton] : []),
        ...(showForwardButton ? [this.forwardButton] : [])
      );
    };

    let currentIndex = startIndex;
    const interactionResponse: InteractionCallbackResponse =
      await interaction.reply({
        embeds: [embeds[currentIndex]],
        files: attachments,
        components: [getButtonRow(currentIndex, embeds.length)],
        withResponse: true,
      });

    const message = interactionResponse.resource?.message;

    if (message) {
      this.collector = message.createMessageComponentCollector({
        time: this.timeout,
      });

      this.collector.on(
        "collect",
        async (buttonInteraction: ButtonInteraction) => {
          if (this.resetTimerOnPress) {
            this.resetTimer();
          }

          if (buttonInteraction.customId === PagedEmbed.BACK_ID) {
            currentIndex -= 1;
          } else if (buttonInteraction.customId === PagedEmbed.FORWARD_ID) {
            currentIndex += 1;
          }

          // Handles wrap around cases from both directions.
          currentIndex =
            ((currentIndex % embeds.length) + embeds.length) % embeds.length;

          await buttonInteraction
            .update({
              embeds: [embeds[currentIndex]],
              components: [getButtonRow(currentIndex, embeds.length)],
            })
            .catch(ignore([RESTJSONErrorCodes.UnknownInteraction]));
        }
      );

      this.collector.on("end", async () => {
        this.backButton.setDisabled(true);
        this.forwardButton.setDisabled(true);

        await interaction
          .editReply({
            components: [getButtonRow(currentIndex, embeds.length)],
          })
          .catch(ignore([RESTJSONErrorCodes.UnknownMessage]));
      });
    }
  }
}
