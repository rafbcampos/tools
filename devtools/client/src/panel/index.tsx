import React, { useRef } from "react";
import type { MessengerOptions } from "@player-tools/devtools-types";
import type { ExtensionSupportedEvents } from "@player-tools/devtools-types";
import { DataController, Flow, useReactPlayer } from "@player-ui/react";
import { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";

import "./panel.css";
import { INITIAL_FLOW, PLAYER_CONFIG, PUBSUB_PLUGIN } from "../constants";
import { useExtensionState } from "../state";
import { flowDiff } from "../helpers/flowDiff";

const fallbackRender: ErrorBoundary["props"]["fallbackRender"] = ({
  error,
}) => {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: "red" }}>{error.message}</pre>
    </div>
  );
};

/**
 * Panel component
 *
 * devtools plugin authors can define their plugins content using DSL and have it rendered here
 */
export const Panel = ({
  communicationLayer,
}: {
  /** the communication layer to use for the extension */
  readonly communicationLayer: Pick<
    MessengerOptions<ExtensionSupportedEvents>,
    "sendMessage" | "addListener" | "removeListener"
  >;
}) => {
  const { state, selectPlayer, selectPlugin, handleInteraction } =
    useExtensionState({
      communicationLayer,
    });

  const { reactPlayer } = useReactPlayer(PLAYER_CONFIG);

  const dataController = useRef<WeakRef<DataController> | null>(null);

  const currentFlow = useRef<Flow | null>(null);

  useEffect(() => {
    reactPlayer.player.hooks.dataController.tap("panel", (d) => {
      dataController.current = new WeakRef(d);
    });
  }, [reactPlayer]);

  useEffect(() => {
    // we subscribe to all messages from the devtools plugin
    // so the plugin author can define their own events
    PUBSUB_PLUGIN.subscribe("*", (type: string, payload: string) => {
      handleInteraction({
        type,
        payload,
      });
    });
  }, []);

  useEffect(() => {
    const { player, plugin } = state.current;

    const flow =
      player && plugin
        ? state.players[player]?.plugins?.[plugin]?.flow || INITIAL_FLOW
        : INITIAL_FLOW;

    if (!currentFlow.current) {
      currentFlow.current = flow;
      reactPlayer.start(flow);
      return;
    }

    const diff = flowDiff({
      curr: currentFlow.current as Flow,
      next: flow,
    });

    if (diff) {
      const { change, value } = diff;

      if (change === "flow") {
        currentFlow.current = value;
        reactPlayer.start(value);
      } else if (change === "data") {
        dataController.current
          ? dataController.current
              .deref()
              ?.set(value as Record<string, unknown>)
          : reactPlayer.start(flow);
      }
    }
  }, [reactPlayer, state]);

  const Component = reactPlayer.Component as React.FC;

  return (
    <ErrorBoundary fallbackRender={fallbackRender}>
      <div className="container">
        <>
          {state.current.player ? (
            <>
              <header className="header">
                <div className="selection-container">
                  <div className="selection-item">
                    <label htmlFor="player">Player:</label>
                    <select
                      id="player"
                      value={state.current.player || ""}
                      onChange={(event) => selectPlayer(event.target.value)}
                    >
                      {Object.keys(state.players).map((playerID) => (
                        <option key={playerID} value={playerID}>
                          {playerID}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="selection-item">
                    <label htmlFor="plugin">Plugin:</label>
                    <select
                      id="plugin"
                      value={state.current.plugin || ""}
                      onChange={(event) => selectPlugin(event.target.value)}
                    >
                      {Object.keys(
                        state.players[state.current.player].plugins
                      ).map((pluginID) => (
                        <option key={pluginID} value={pluginID}>
                          {pluginID}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </header>

              <main className="main">
                <div className="component-wrapper">
                  <Component />
                </div>
              </main>

              <footer className="footer">
                <details className="state-details">
                  <summary>State</summary>
                  <pre>{JSON.stringify(state, null, 2)}</pre>
                </details>
              </footer>
            </>
          ) : (
            <div className="no-player-message">
              <p>
                No Player-UI instance or devtools plugin detected. Visit{" "}
                <a href="https://player-ui.github.io/">
                  https://player-ui.github.io/
                </a>{" "}
                for more info.
              </p>
            </div>
          )}
        </>
      </div>
    </ErrorBoundary>
  );
};
