import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import flowMenu from './flowMenu.ts'
import { chatBotController, personalController } from "../controller/controller.module.ts";
import { reset, start, stop, stopSilence } from './flowIdle.ts';
import { botServer } from '../index.ts';
import flowRemoveTel from './flowRemoveTel.ts';
import { flowDescargaDocs } from './flowDescargaDocs.ts';
import { Utils } from '../controller/util.ts';

const delay = chatBotController.getDelay()
const linkVigenciaHs = (process.env.LINK_VIGENCIA) ? Number(process.env.LINK_VIGENCIA) : 3

export const flowIA = addKeyword("LINCE_IA")
    .addAction(async (ctx, { flowDynamic, state, provider }) => {
        const userId = ctx.from; // Use the user's ID to create a unique queue for each user

        if (!botServer.userQueues.has(userId)) {
            botServer.userQueues.set(userId, []);
        }

        const queue = botServer.userQueues.get(userId);
        queue.push({ ctx, flowDynamic, state, provider });

        // If this is the only message in the queue, process it immediately
        if (!botServer.userLocks.get(userId) && queue.length === 1) {
            await botServer.handleQueue(userId);
        }
    });



