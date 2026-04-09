// NO-OP private key store (deprecated)

export function getPrivateKey(): string {
  return "";
}

export function setPrivateKey(_: string): void {
  // do nothing
}

export function hasPrivateKey(): boolean {
  return true; // always true so UI never blocks
}

export function clearPrivateKey(): void {
  // do nothing
}