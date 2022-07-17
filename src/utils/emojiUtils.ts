import { Client, Emoji, EmojiResolvable, Message  } from "discord.js";

interface FetchEmojiOptions {
  identifier: string;
}

/*
Retrieves a GuildEmoji based on the given identifier string (emoji ID or name).
This function will work on sharded bots.
*/
export async function fetch(client: Client, identifier: string): Promise<Emoji | null> {
  function findEmoji(target: Client, options: FetchEmojiOptions): Emoji | null {
    const emoji = target.emojis.cache.get(options.identifier) || target.emojis.cache.find(e => e.name?.toLowerCase() === options.identifier.toLowerCase());
    if (!emoji) return null;
    return emoji;
  }
  
  if (client.shard) {
    let emojiArray: any[] = await client.shard.broadcastEval(findEmoji, { context: { identifier: identifier }});
    emojiArray = emojiArray.filter(emoji => emoji != null);
    return emojiArray.shift();
  } else {
    return findEmoji(client, { identifier: identifier });
  }
}

/*
Reacts to a message with all given emojis, in order.
Can accept either an array of emojis or a single emoji.
*/
export async function react(message: Message, emojis: EmojiResolvable[] | EmojiResolvable): Promise<void> {
  if (emojis instanceof Array) {
    for (let i = 0; i < emojis.length; i++) {
      await message.react(emojis[i]);
    }
  } else {
    await message.react(emojis);
  }
}

/*
Formats an emoji to be displayed in a text channel.
*/
export function formatForChat(emoji: Emoji, padWithSpace: boolean = false): string {
  if (emoji) {
    let emojiString = emoji.animated ? `<${emoji.identifier}>` : `<:${emoji.identifier}>`;
    return padWithSpace ? ` ${emojiString} ` : emojiString;
  } else {
    return "";
  }
}