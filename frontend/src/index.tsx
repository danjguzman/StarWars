import React from "react";
import ReactDOM from "react-dom/client";
import { createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import App from "./App";
import styles from "./index.module.css";

void styles;

const theme = createTheme({
    primaryColor: "yellow",
});

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("The application root element was not found.");
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <MantineProvider theme={theme} forceColorScheme="dark">
            <App />
        </MantineProvider>
    </React.StrictMode>
);
