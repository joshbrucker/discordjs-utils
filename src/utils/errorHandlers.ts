import { DiscordAPIError } from "discord.js";

export function ignore(errors: number[]) {
  return (error: Error | DiscordAPIError) => {
    if ((error instanceof DiscordAPIError && !errors.includes(+error.code)) || !(error instanceof DiscordAPIError)) {
      throw error;
    }
  }
}