import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MintformDemo from "./MintformDemo";
import "./demo.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MintformDemo />
  </StrictMode>,
);
