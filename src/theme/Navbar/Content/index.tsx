import React, { useState, useEffect } from "react";
import OriginalNavbarContent from "@theme-original/Navbar/Content";
import CardNavMenu from "@site/src/components/CardNavMenu";
import AuthModal from "@site/src/components/AuthModal";
import { deriveTokenStatus } from "@site/src/utils/auth";
import { hasPrivateKey } from "@site/src/utils/privateKey";

function AuthBadge() {
  const [tokenStatus, setTokenStatus] = useState(() => deriveTokenStatus());
  const [keyLoaded, setKeyLoaded] = useState(() => hasPrivateKey());

  useEffect(() => {
    const sync = () => {
      setTokenStatus(deriveTokenStatus());
      setKeyLoaded(hasPrivateKey());
    };

    window.addEventListener("rm-auth-changed", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("rm-auth-changed", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const openModal = () => window.dispatchEvent(new CustomEvent("rm-open-auth"));

  const connected = tokenStatus === "active";
  const expired = tokenStatus === "expired";

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 12px",
    borderRadius: 20,
    border: "1px solid",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    background: "none",
    marginLeft: 12,
    whiteSpace: "nowrap",
    borderColor: connected
      ? "var(--ifm-color-success)"
      : expired
      ? "var(--ifm-color-danger)"
      : "var(--ifm-color-emphasis-400)",
    color: connected
      ? "var(--ifm-color-success)"
      : expired
      ? "var(--ifm-color-danger)"
      : "var(--ifm-color-content-secondary)",
  };

  const dotStyle: React.CSSProperties = {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: connected
      ? "var(--ifm-color-success)"
      : expired
      ? "var(--ifm-color-danger)"
      : "var(--ifm-color-emphasis-400)",
  };

  const label = connected
    ? keyLoaded
      ? "Connected"
      : "Token active"
    : expired
    ? "Token expired"
    : "Connect";

  return (
    <button style={badgeStyle} onClick={openModal}>
      <span style={dotStyle} />
      {label}
    </button>
  );
}

export default function NavbarContent(props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
        <OriginalNavbarContent {...props} />
        <AuthBadge />
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            font: "inherit",
            padding: "6px 12px",
            marginLeft: "8px",
          }}
          onClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          Explore
        </button>
      </div>

      <CardNavMenu open={open} setOpen={setOpen} />
      <AuthModal />
    </>
  );
}