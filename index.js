import fetch from "node-fetch";
import cheerio from "cheerio";
import { CronJob } from "cron";
import { WebhookClient } from "discord.js";

import config from "./config.js";

if (!config.id || !config.token) {
    throw Error("Missing Webhook ID/Token!");
}

const webhook = new WebhookClient(config.id, config.token);

function createWebhookRequest(tag, paletteName, paletteLinkBase) {
    paletteLinkBase = `https://lospec.com${paletteLinkBase}`;
    return {
        "content": null,
        "embeds": [
            {
                "title": "Today's LoSpec Daily",
                "url": "https://lospec.com/dailies/",
                "color": 14407891,
                "fields": [
                    {
                        "name": "Tag",
                        "value": tag
                    },
                    {
                        "name": "Palette Name",
                        "value": paletteName
                    },
                    {
                        "name": "Palette Links",
                        "value": `[PNG 1x](${paletteLinkBase}-1x.png) | [PNG 8x](${paletteLinkBase}-8x.png) | [PNG 32x](${paletteLinkBase}-32x.png) | [PAL](${paletteLinkBase}.pal) | [ASE](${paletteLinkBase}.ase) | [TXT](${paletteLinkBase}.txt) | [GPL](${paletteLinkBase}.gpl) | [HEX](${paletteLinkBase}.hex)`
                    }
                ],
                "author": {
                    "name": "LoSpec.com",
                    "url": "https://lospec.com",
                    "icon_url": "https://lospec.com/images/favicons/favicon32.png"
                },
                "image": {
                    "url": `${paletteLinkBase}-32x.png`
                }
            }
        ],
        "username": "LoSpec Dailies",
        "avatar_url": "https://lospec.com/images/favicons/favicon32.png"
    };
}

const job = new CronJob(
    '0 0 8 * * *',
    async () => {
        console.log("Requesting...");
        // Request the dailies page
        let response = await fetch("https://lospec.com/dailies/");
        let dailiesHtml = await response.text();
    
        // Load up Cheerio
        const $ = cheerio.load(dailiesHtml);
    
        let tag = $("div.daily.tag").text();
        let paletteElement = $("div.daily.palette a").first();
    
        let paletteName = paletteElement.text();
        let paletteLinkBase = paletteElement.attr("href");
    
        let webHookRequest = createWebhookRequest(tag, paletteName, paletteLinkBase);
    
        try {
            await webhook.send(webHookRequest);
            console.log("LoSpec Daily sent");
        } catch (e) {
            console.error(e);
        }
    },
    null,
    true,
    'Etc/UTC'
);
