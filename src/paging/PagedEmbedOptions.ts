import { ComponentEmojiResolvable } from "discord.js";
import { ButtonStyle } from "discord-api-types/v10";

export interface PagedEmbedOptions {
  timeout: number;
  leftEmoji: ComponentEmojiResolvable;
  rightEmoji: ComponentEmojiResolvable;
  leftStyle: Exclude<ButtonStyle, ButtonStyle.Link>;
  rightStyle: Exclude<ButtonStyle, ButtonStyle.Link>;
  showPageNumbers: boolean;
  wrapAround: boolean;
  resetTimerOnPress: boolean;
}

export const DEFAULT_OPTIONS: PagedEmbedOptions = {
  timeout: 120_000,
  leftEmoji: "⬅️",
  rightEmoji: "➡️",
  leftStyle: ButtonStyle.Secondary,
  rightStyle: ButtonStyle.Secondary,
  showPageNumbers: true,
  wrapAround: false,
  resetTimerOnPress: true,
};
