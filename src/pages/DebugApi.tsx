import React, { useEffect, useState } from "react";

function getBaseUrl(): string {
  const origin = window.location.origin;

  if (origin.startsWith("https://time.krilee.se")) {
    return "https://time-api.krilee.se";
  }

  if (
    origin.startsWith("http://192.168.11.3:3000") ||
    origin.startsWith("http://localhost:3000")
  ) {
    return "http://192.168.11.3:8200";
  }

  return "http://192.168.11.3:8200";
}

export default function DebugApi() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(getBaseUrl());
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>API URL Debug</h1>
      <p>
        <strong>Frontend Origin:</strong> {window.location.origin}
      </p>
      <p>
        <strong>Detected API Base URL:</strong> {url}
      </p>
    </div>
  );
}
console.log("getBaseUrl() resolved to:", getBaseUrl());

