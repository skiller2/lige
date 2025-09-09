import { EVENTS, addKeyword, } from '@builderbot/bot'
import type { TFlow,BotContext, BotStateStandAlone } from '@builderbot/bot/dist/types.d.ts';

// Object to store timers for each user
const timers = {};

// Flow for handling inactivity
const idleFlow = addKeyword(EVENTS.ACTION).addAction(
  async (_, { endFlow }) => {
    return endFlow('Gracias por su tiempo, hasta la próxima 👋');
  }
);

// Function to start the inactivity timer for a user
const start = (ctx: BotContext, gotoFlow: (a: addKeyword) => Promise<void>, ms: number) => {
  timers[ctx.from] = setTimeout(() => {
    console.log(`User timeout: ${ctx.from}`);
    return gotoFlow(idleFlow);
  }, ms);
}

// Function to reset the inactivity timer for a user
const reset = (ctx: BotContext, gotoFlow: (a: TFlow) => Promise<void>, ms: number) => {
  if (timers[ctx.from]) {
    console.log(`reset countdown for the user: ${ctx.from}`);
    clearTimeout(timers[ctx.from]);
  }
  start(ctx, gotoFlow, ms);
}

// Function to stop the inactivity timer for a user
const stop = (ctx: BotContext, gotoFlow: (a: TFlow) => Promise<void>, state: BotStateStandAlone) => {
  if (timers[ctx.from]) {
    clearTimeout(timers[ctx.from]);
  }
  state.clear()
  console.log(`User stop: ${ctx.from}`);
  return gotoFlow(idleFlow);
}

const stopSilence = (ctx: BotContext, gotoFlow: (a: TFlow) => Promise<void>, state: BotStateStandAlone) => {
  if (timers[ctx.from]) {
    clearTimeout(timers[ctx.from]);
  }
  state.clear()
  console.log(`User stop: ${ctx.from}`);

}


export {
  start,
  reset,
  stop,
  idleFlow,
  stopSilence
}