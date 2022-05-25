import {
  ButtonInteraction,
  CommandInteraction,
  EmojiResolvable,
  ExcludeEnum,
  InteractionCollector,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageEmbed,
  MessageEmbedFooter
} from "discord.js";
import { MessageButtonStyles } from "discord.js/typings/enums";
import { editReply, update } from "../utils/safeChanges";

const backId = "back";
const forwardId = "forward";

export interface PagedEmbedOptions {
  timeout: number,
  leftEmoji: EmojiResolvable,
  rightEmoji: EmojiResolvable,
  leftStyle: ExcludeEnum<typeof MessageButtonStyles, "LINK">,
  rightStyle: ExcludeEnum<typeof MessageButtonStyles, "LINK">,
  showPaging: boolean
}

const DefaultOptions: PagedEmbedOptions = {
  timeout: 120000,
  leftEmoji: "⬅️",
  rightEmoji: "➡️",
  leftStyle: "SECONDARY",
  rightStyle: "SECONDARY",
  showPaging: true
}

/*
Allows for creation and customization of "paged" embeds,
where Discord users can click buttons to page through a list of embeds.
*/
export class PagedEmbed {
  timeout: number;
  leftEmoji: EmojiResolvable;
  rightEmoji: EmojiResolvable;
  leftStyle: ExcludeEnum<typeof MessageButtonStyles, "LINK">;
  rightStyle: ExcludeEnum<typeof MessageButtonStyles, "LINK">;
  showPaging: boolean;

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
  }

  setTimeout(timeout: number): this {
    this.timeout = timeout;
    return this;
  }

  setLeftEmoji(leftEmoji: EmojiResolvable): this {
    this.leftEmoji = leftEmoji;
    return this;
  }

  setRightEmoji(rightEmoji: EmojiResolvable): this {
    this.rightEmoji = rightEmoji;
    return this;
  }

  setLeftStyle(leftStyle: ExcludeEnum<typeof MessageButtonStyles, "LINK">): this {
    this.leftStyle = leftStyle;
    return this;
  }

  setRightStyle(rightStyle: ExcludeEnum<typeof MessageButtonStyles, "LINK">): this {
    this.rightStyle = rightStyle;
    return this;
  }

  setShowPaging(showPaging: boolean): this {
    this.showPaging = showPaging;
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
  async send(interaction: CommandInteraction, embeds: MessageEmbed[], attachments: MessageAttachment[] | string[] = []) {

    // Hydrate embeds with page numbers if enabled
    if (this.showPaging) {
      for (let i = 0; i < embeds.length; i++) {
        let embed = embeds[i];
        let newFooter: MessageEmbedFooter = {
          text: "\u200b\nPage " + (i + 1) + " / " + embeds.length + embed.footer?.text,
          iconURL: embed.footer?.iconURL,
          proxyIconURL: embed.footer?.proxyIconURL
        }
        embed?.setFooter(newFooter);
      }
    }

    if (embeds.length === 1) {
      await interaction.reply({
        embeds: [embeds[0]],
        files: attachments
      });
      return;
    }

    const backButton = new MessageButton({
      style: this.leftStyle,
      emoji: this.leftEmoji,
      customId: backId
    });

    const forwardButton = new MessageButton({
      style: this.rightStyle,
      emoji: this.rightEmoji,
      customId: forwardId
    });

    let embed = await interaction.reply({
      embeds: [embeds[0]],
      files: attachments,
      components: embeds.length > 1 ? [new MessageActionRow({components: [forwardButton]})] : [],
      fetchReply: true
    });

    if (embed instanceof Message) {
      this.collector = embed.createMessageComponentCollector({
        time: this.timeout
      });

      let currentIndex = 0;
      this.collector.on("collect", async (buttonInteraction: ButtonInteraction) => {
        this.resetTimer();

        if (buttonInteraction.customId === backId) {
          currentIndex -= 1;
        } else {
          currentIndex += 1;
        }

        await update(buttonInteraction, {
          embeds: [embeds[currentIndex]],
          components: [
            new MessageActionRow({
              components: [
                ...(currentIndex ? [backButton] : []),
                ...(currentIndex < embeds.length - 1 ? [forwardButton] : [])
              ]
            })
          ]
        })
      });

      this.collector.on("end", async () => {
        backButton.disabled = true;
        forwardButton.disabled = true;

        await editReply(interaction, {
          components: [
            new MessageActionRow({
              components: [
                ...(currentIndex ? [backButton] : []),
                ...(currentIndex < embeds.length - 1 ? [forwardButton] : [])
              ]
            })
          ]
        });
      });
    }
  }
};