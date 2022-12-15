import { type AsyncThunk, createAsyncThunk } from '@reduxjs/toolkit';
import {
  createAction,
  PayloadAction,
  ActionCreatorWithPayload,
} from '@reduxjs/toolkit';
import {
  Runtime,
  createLogger,
  BACKGROUND_SOURCE,
  Actions,
  Events,
} from '@player-tools/devtools-common';
import type { RuntimeRPCRequestHandlers } from '../rpc';

const logger = createLogger(BACKGROUND_SOURCE);

export type AsyncRPCActions = {
  [key in Actions.RuntimeRPCTypes]: AsyncThunk<
    Extract<Actions.RuntimeRPC, { type: key }>['result'],
    Extract<Actions.RuntimeRPC, { type: key }>['params'],
    any
  >;
};

export type EventActions = {
  [key in Events.RuntimeEvent["type"]]: ActionCreatorWithPayload<
    Extract<Events.RuntimeEvent, { type: key }>,
    key
  >;
};

export const buildRPCActions = (
  handlers: RuntimeRPCRequestHandlers
): AsyncRPCActions =>
  Actions.RuntimeRPCTypes.reduce((acc, rpcType) => {
    // TODO: Fix this
    // @ts-ignore
    acc[rpcType] = createAsyncThunk<
      Extract<Actions.RuntimeRPC, { type: typeof rpcType }>['result'],
      Extract<Actions.RuntimeRPC, { type: typeof rpcType }>['params']
    >(rpcType, async (params) => {
      logger.log(`Requesting ${rpcType}`, params);
      const data = (await handlers[rpcType].call(params)) as Extract<
        Actions.RuntimeRPC,
        { type: typeof rpcType }
      >['result'];
      logger.log(`Response from ${rpcType}`, data);
      return data;
    });
    return acc;
  }, {} as AsyncRPCActions);

export const eventActions: EventActions = Object.fromEntries(Events.RuntimeEventTypes.map(event => [event, createAction<Extract<Events.RuntimeEvent, { type: typeof event }>>(event)])) as EventActions

// export const playerInitAction =
//   createAction<Runtime.PlayerInitEvent>('player-init');
// export const playerRemoveAction = createAction<string>('player-removed');
// export const selectedPlayerAction = createAction<string | undefined>(
//   'selected-player'
// );
// export const playerFlowStartAction =
//   createAction<Runtime.PlayerFlowStartEvent>('player-flow-start');
// export const playerTimelineAction = createAction<
//   | Runtime.PlayerDataChangeEvent
//   | Runtime.PlayerLogEvent
//   | Runtime.PlayerFlowStartEvent
// >('player-timeline-event');
// export const playerViewUpdateAction =
//   createAction<Runtime.PlayerViewUpdateEvent>('player-view-update-event');
// export const clearSelectedDataDetails = createAction<void>(
//   'clear-selected-data-details'
// );
// export const consoleClearAction = createAction('console-clear');
// export const clearStore = createAction<void>('clear-store');
// export const logsClearAction = createAction('logs-clear')

// export namespace Actions {
//   export const Events = Runtime.RuntimeEventTypes.reduce((actions, event) => {
//     actions[event] =
//       createAction<Extract<Runtime.RuntimeEvent, { type: typeof event }>>(
//         event
//       );

//     return actions;
//   }, {} as EventActions);

  
// }

// export namespace Actions {
//   export namespace Console {
//     export const clear = createAction('console-clear');
//   }
// }
