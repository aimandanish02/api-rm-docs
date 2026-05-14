import React from "react";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export default function HttpMethodBadge({ method }: { method: string }) {
  const upper = (method ?? "GET").toUpperCase() as Method;
  return <span className={`http-badge http-badge--${upper.toLowerCase()}`}>{upper}</span>;
}
