import { CommandInteraction, MessageComponentInteraction, MessagePayload, WebhookEditMessageOptions } from "discord.js";

/*
Edits the CommandInteraction and eats the error if the interaction was deleted.
*/
export async function editReply(interaction: CommandInteraction, edit: string | MessagePayload | WebhookEditMessageOptions) {
  await interaction.editReply(edit)
      .catch(err => {
        if (err.message.toLowerCase() !== "unknown message" && err.message.toLowerCase() !== "unknown interaction") {
          throw err;
        }
      });
}

/*
Updates the ButtonInteraction and eats the error if the interaction was deleted.
*/
export async function update(interaction: MessageComponentInteraction, update: string | MessagePayload | WebhookEditMessageOptions) {
  await interaction.update(update)
      .catch(err => {
        if (err.message.toLowerCase() !== "unknown message" && err.message.toLowerCase() !== "unknown interaction") {
          throw err;
        }
      });
}