# Discord.js Utils
This is a set of tools developed to help me create my Discord bots using discord.js.

---

## Paged Embeds
Paged Embeds are embeds with buttons at the bottom to go back and forth through a list of different embeds.

Each Page Embed object is fully customizable. Below is the list of options you can set, along with their defaults. These can be passed as an options parameter in the PagedEmbed constructor, or they can be set through the setter functions for each variable.

`timeout` (120000): An integer value that represents how long it will take, in milliseconds, until the buttons "time out" (i.e., become no longer pressable). The timer is reset on every button click of the embed.

`leftEmoji`  ("⬅️"): The emoji to use for the left button.

`rightEmoji` ("➡️"): The emoji to use for the right button.

`leftStyle` ("SECONDARY"): The button style to use for the left button.

`rightStyle` ("SECONDARY"): The button style to use for the right button.

`showPaging` (true): Whether to display page numbers in the footer of the embeds (will overwrite any footers you pass it).


```javascript
const { PagedEmbed } = require("@joshbrucker/discordjs-utils.js");

// Using options parameter
new PagedEmbed({ timeout: 30000, leftEmoji: "👈", rightEmoji: "👉" });

// Using setters
new PagedEmbed()
    .setTimeout(30000)
    .setLeftEmoji("👈")
    .setRightEmoji("👉");
```

### send(CommandInteraction, MessageEmbed[], MessageAttachment[]=[])
Sends a paged embed with the given interaction, embeds, and attachments, if supplied.

```javascript
const { MessageEmbed } = require("discord.js");
const { PagedEmbed } = require("@joshbrucker/discordjs-utils.js");

// ...

let embedList = [new MessageEmbed(), new MessageEmbed()];
let pagedEmbed = new PagedEmbed({ timeout: 30000, leftEmoji: "👈", rightEmoji: "👉" });

await pagedEmbed.send(commandInteraction, embedList);
await pagedEmbed.send(commandInteraction, embedList, attachments=["path/to/png"]);
```

### expire()
Forcefully expire the buttons.

```javascript
const { PagedEmbed } = require("@joshbrucker/discordjs-utils.js");

let embed = new PagedEmbed({ timeout: 30000, leftEmoji: "👈", rightEmoji: "👉" });

embed.expire();
```

### resetTimer()
Forcefully reset the timer.

```javascript
const { PagedEmbed } = require("@joshbrucker/discordjs-utils.js");

let embed = new PagedEmbed({ timeout: 30000, leftEmoji: "👈", rightEmoji: "👉" });

embed.resetTimer();
```

---

## Emoji Utilities
This set of utility functions has to do with managing emojis.

### fetch(String)
Fetching an emoji is easy... Until you need to do it with a sharded bot. This function takes in an emoji ID and will fetch an emoji, even if that emoji exists in a guild on a different shard. Fetched mojis will be cached so that you don't need to constantly make expensive calls across shards for the same emoji.

```javascript
const { emojiUtils } = require("@joshbrucker/discordjs-utils.js");

let emoji = await emojiUtils.fetch("123456789");
```

### react(Message, Emoji[])
Reacting can get a bit clunky if you need to apply a series of reactions. This function takes in a message and either a single emoji or a list of emojis. Then it will react to the message with those emojis, in order.

```javascript
const { emojiUtils } = require("@joshbrucker/discordjs-utils.js");

// ...

let emoji = await emojiUtils.fetch("123456789");
await emojiUtils.react(message, ["🥺", emoji]);
```

### formatForChat(Emoji)
Emoji objects need to be specially formatted so that they appear in text channels correctly. This function takes in an emoji and will return the proper string representation for it.

```javascript
const { emojiUtils } = require("@joshbrucker/discordjs-utils.js");

// ...

let emoji = await emojiUtils.fetch("123456789");
let formatted = emojiUtils.formatForChat(emoji);
channel.send(`My emoji works: ${formatted}`);
```

---

## Error Handlers
This section contains functions that will help with handling errors.

### ignore(number[])
The ignore error handler takes in a list of numbers that represent Discord APIErrors (you can find a mapping of them at `Constants.APIErrors`), and it will return a function that accepts an error. If this error matches one in the provided list parameter, then the error is ignored. Otherwise, it is thrown.

```javascript
const { ignore } = require("@joshbrucker/discordjs-utils.js");
const { Constants: { APIErrors: { UNKNOWN_MESSAGE } } } = require('discord.js');

// ...

// If our interaction was deleted before it's edited, we just want to ignore the resulting error.
await interaction.editReply("editing my interaction message").catch(ignore([UNKNOWN_MESSAGE]));
```
