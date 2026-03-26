import { SlashCommandBuilder, ModalBuilder, FileUploadBuilder, LabelBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { ledgerDB, logEvent, ensureLedger, updateCost, addGuy } from "../ledger.js";
import { scanReceipt } from "../scan.js";

export default {
    data: new SlashCommandBuilder()
        .setName("receipt")
        .setDescription("scan this:")
        .addUserOption(opt =>
            opt
                .setName("guy")
                .setDescription("this guy paid for it")
                .setRequired(false)
        )
        .addUserOption(opt =>
            opt
                .setName("onlyguy")
                .setDescription("only this guy has to pay")
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt
                .setName("description")
                .setDescription("...")
                .setRequired(false)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser("guy") || interaction.user;
        const targetUserId = targetUser.id
        const targetUserName = targetUser.username
        const onlyGuy = interaction.options.getUser("onlyguy")
        let onlyGuyId = null
        let onlyGuyName = null
        if (onlyGuy) {
            onlyGuyId = onlyGuy.id
            onlyGuyName = onlyGuy.username
        }

        const logMsg = interaction.options.getString("description") || "no msg"


        const receiptFileUpload = new FileUploadBuilder()
            .setCustomId("receiptfile")

        const receiptLabel = new LabelBuilder()
            .setLabel("file pls:")
            .setFileUploadComponent(receiptFileUpload)

        const receiptModal = new ModalBuilder()
            .setCustomId(`receipt_modal:${targetUserId}:${targetUserName}:${onlyGuyId}:${onlyGuyName}:${logMsg}`) // name must be [commandName]modal
            .setTitle("upload receipt")
            .addLabelComponents(receiptLabel)

        await interaction.showModal(receiptModal)

    },

    async modalSubmit(interaction) {
        await interaction.deferReply()
        const receiptImg = interaction.fields.getUploadedFiles("receiptfile").first()
        let [, targetUserId, targetUserName, onlyGuyId, onlyGuyName, logMsg] = interaction.customId.split(":")

        if (receiptImg.contentType == null || !receiptImg.contentType.includes("image")) {
            await interaction.editReply({
                content: "send pic not this",
                ephemeral: true
            })
        } else {
            try {
                const result = await scanReceipt(receiptImg.url)

                const vendor = result.vendor?.name ?? "unknown"
                const total = result.total ?? "?"
                const date = result.date ?? "?"
                const confirmReceiptMsg = `is this **${vendor}** — $${total} on ${date}?`
                if(logMsg == "no msg"){
                    logMsg = confirmReceiptMsg
                }

                const confirm = new ButtonBuilder()
                    .setCustomId(`receipt_yes:${targetUserId}:${targetUserName}:${onlyGuyId}:${onlyGuyName}:${total}:${logMsg}`)
                    .setLabel("yes")
                    .setStyle(ButtonStyle.Success)

                const deny = new ButtonBuilder()
                    .setCustomId("receipt_no")
                    .setLabel("no")
                    .setStyle(ButtonStyle.Danger)

                const row = new ActionRowBuilder().addComponents(confirm, deny)

                await interaction.editReply({
                    content: confirmReceiptMsg,
                    files: [receiptImg.url],
                    components: [row],
                    ephemeral: true

                })


            } catch (err) {
                console.error(err)
                await interaction.editReply({ content: "scan failed rip", components: [], files: [] })
            }
        }

    },

    async buttonSubmit(interaction) {
        const row = interaction.message.components[0];
        const disabledRow = new ActionRowBuilder().addComponents(
            row.components.map((button) => ButtonBuilder.from(button).setDisabled(true))
        );

        await interaction.update({ components: [disabledRow] });

        let [butId, targetUserId, targetUserName, onlyGuyId, onlyGuyName, amount, logMsg] = interaction.customId.split(":")
        amount = parseFloat(amount)
        if (butId === "receipt_no") {
            await interaction.followUp({ content: "bruh ocr sucks", ephemeral: true })
            return;
        }
        if (butId === "receipt_yes") { // could I have made this a function? yes. Will I? nah
            const guildId = interaction.guild.id;
            await ensureLedger(guildId)

            const participants = ledgerDB[guildId].participants

            if (participants.length === 0) return interaction.followUp("no one in the house")
            if (!participants.includes(targetUserId)) return interaction.followUp("this guy isn't in the house yet")
            if (!participants.includes(interaction.user.id)) return interaction.followUp("get in the house first")


            if (amount <= 0) return interaction.followUp("amount can't be less than 0")



            if (!ledgerDB[guildId].ledger[targetUserId]) ledgerDB[guildId].ledger[targetUserId] = { owedBy: {} }

            if (onlyGuyId && onlyGuyId != 'null') {
                if (!participants.includes(onlyGuyId)) return interaction.followUp("this guy isn't in the house yet")
                if (targetUserId == onlyGuyId) return interaction.followUp("this is the same guy")

                await addGuy(guildId, onlyGuyId);

                const prev = ledgerDB[guildId].ledger[targetUserId].owedBy[onlyGuyId] || 0
                await updateCost(guildId, targetUserId, onlyGuyId, prev + amount)

                // amount rounds to 2 for display
                amount = Math.round(amount * 100) / 100

                await logEvent(guildId, `${interaction.user.username} added $${amount} for ${targetUserName} to ${onlyGuyName}: ${logMsg}`)
                return interaction.followUp(`${interaction.user.username} added $${amount} for ${targetUserName} to ${onlyGuyName}`)
            } else {
                const others = participants.filter(id => id !== targetUserId)
                if (others.length === 0) return interaction.followUp("no one other than you in the house")

                let splitAmount = Math.round((amount / participants.length) * 10000) / 10000
                for (const id of others) {
                    await addGuy(guildId, id);

                    const prev = ledgerDB[guildId].ledger[targetUserId].owedBy[id] || 0
                    await updateCost(guildId, targetUserId, id, prev + splitAmount)
                }

                // split amount rounds to 2 for display
                splitAmount = Math.round(splitAmount * 100) / 100
                await logEvent(guildId, `${interaction.user.username} added $${amount} for ${targetUserName} to all: ${logMsg}`)
                return interaction.followUp(`${interaction.user.username} added $${amount} for ${targetUserName}, split among ${others.length} other bois in the house for ($${splitAmount} each).`)
            }
        }
    }


};