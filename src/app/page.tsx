"use client";

import {
  toSocket,
  WebSocketMessageReader,
  WebSocketMessageWriter,
} from "vscode-ws-jsonrpc";
import {
  CloseAction,
  ErrorAction,
  MessageTransports,
} from "vscode-languageclient";
import { Editor } from "@monaco-editor/react";
import { MonacoLanguageClient } from "monaco-languageclient";
import getConfigurationServiceOverride, {
  updateUserConfiguration,
} from "@codingame/monaco-vscode-configuration-service-override";
import { initServices } from "monaco-languageclient/vscode/services";

export default function HomePage() {
  const createLanguageClient = (
    messageTransports: MessageTransports
  ): MonacoLanguageClient => {
    return new MonacoLanguageClient({
      name: "C Language Client",
      clientOptions: {
        documentSelector: ["c"],
        errorHandler: {
          error: () => ({ action: ErrorAction.Continue }),
          closed: () => ({ action: CloseAction.DoNotRestart }),
        },
      },
      messageTransports,
    });
  };

  const initWebSocketAndStartClient = (url: string): WebSocket => {
    const webSocket = new WebSocket(url);
    webSocket.onopen = () => {
      const socket = toSocket(webSocket);
      const reader = new WebSocketMessageReader(socket);
      const writer = new WebSocketMessageWriter(socket);
      const languageClient = createLanguageClient({
        reader,
        writer,
      });
      languageClient.start();
      reader.onClose(() => languageClient.stop());
    };
    return webSocket;
  };

  async function handleEditorWillMount() {
    await initServices(
      {
        serviceOverrides: {
          ...getConfigurationServiceOverride(),
        },
      },
      {}
    );

    updateUserConfiguration(
      JSON.stringify({
        "editor.experimental.asyncTokenization": true,
      })
    );
  }

  return (
    <Editor
      height="100vh"
      language="c"
      theme="vs-dark"
      path="main.c"
      value={`#include <stdio.h>
int main() {
  printf("Hello, world!");
  return 0;
}
`}
      beforeMount={handleEditorWillMount}
      onMount={() => initWebSocketAndStartClient("ws://localhost:30001/c")}
      options={{ wordBasedSuggestions: "off" }}
    />
  );
}
