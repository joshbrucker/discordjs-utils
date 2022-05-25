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
Fetching an emoji is easy... Until you need to do it with a sharded bot. This function takes in an emoji ID and will fetch an emoji, even if that emoji exists in a guild on a different shard.

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

## Safe Changes
When you try to use the `editReply` or `update` functions on interactions that have been deleted, an error gets thrown. Handling this error in every case would be cumbersome, and creating a global error handler is not necessarily a great practice because you could end up eating errors you don't intend to. The functions below will try to make an edit/update, and if they fail due to a deleted message/interaction, the error is ignored.

### editReply(CommandInteraction, MessagePayload)
The equivalent to interaction.editReply(). The function takes in a command interaction and then the message that you want to update the interaction with.

```javascript
const { safeChanges } = require("@joshbrucker/discordjs-utils.js");

// ...

await safeChanges.editReply(commandInteraction, "my new message");
```

### update(ComponentInteraction, MessagePayload)
The equivalent to interaction.update(). The function takes in a component interaction and then the message that you want to update the interaction with.

```javascript
const { safeChanges } = require("@joshbrucker/discordjs-utils.js");

// ...

await safeChanges.update(componentInteraction, "my new message");
```