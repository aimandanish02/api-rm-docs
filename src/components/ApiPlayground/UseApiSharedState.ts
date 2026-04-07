import { useState, useMemo, useEffect } from "react";
import {
    deriveTokenStatus,
    setTokenExpiry,
    clearTokenExpiry,
    syncAuthStatus,
} from "../../utils/auth";
import {
    getPrivateKey,
    setPrivateKey as storePrivateKey,
    hasPrivateKey,
    clearPrivateKey,
} from "../../utils/privateKey";

export type TokenStatus = "missing" | "expired" | "active";
export type PlaygroundProps = {
    method: string;
    title?: string;
    url?: string;
    body?: string | { type: "json"; example?: string };
    requiresSignature?: boolean;
    requiresAccessToken?: boolean;
    useServerSigning?: boolean;
    exampleRequest?: string;
};

export type SharedState = {
    baseUrl: string;
    resolvedUrl: string;
    params: Record<string, string>;
    setParams: (p: Record<string, string>) => void;
    paramKeys: string[];
    tokenStatus: TokenStatus;
    keyLoaded: boolean;
    handleClearToken: () => void;
    handleLoadKey: (key: string) => void;
    handleClearKey: () => void;
    headers: Record<string, string>;
    setHeaders: (h: Record<string, string>) => void;
    jsonBody: string;
    setJsonBody: (b: string) => void;
    isOAuth: boolean;
    requiresSignature: boolean;
    requiresAccessToken: boolean;
    notReady: boolean;
    method: string;
    send: () => Promise<{ response: any; status: number; missedSignature: boolean; missedToken: boolean }>;
};

const sortObject = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(sortObject);
    if (obj !== null && typeof obj === "object") {
        return Object.keys(obj).sort().reduce((acc: any, key) => {
            acc[key] = sortObject(obj[key]);
            return acc;
        }, {});
    }
    return obj;
};

export function useApiSharedState(props: PlaygroundProps): SharedState {
    const requiresSignature = props.requiresSignature ?? true;
    const requiresAccessToken = props.requiresAccessToken ?? true;
    const isOAuth = !requiresSignature && !requiresAccessToken;

    const baseUrl = typeof props.url === "string" ? props.url : "";

    const paramKeys = useMemo(
        () => Array.from(baseUrl.matchAll(/{([^}]+)}/g)).map((m: any) => m[1]),
        [baseUrl]
    );
    const [params, setParams] = useState<Record<string, string>>({});
    const resolvedUrl = useMemo(
        () => paramKeys.reduce(
            (url: string, key: string) => url.replace(`{${key}}`, params[key] ?? key),
            baseUrl
        ),
        [baseUrl, paramKeys, params]
    );

    const [tokenStatus, setTokenStatus] = useState<TokenStatus>(
        () => deriveTokenStatus()
    );
    const [keyLoaded, setKeyLoaded] = useState(hasPrivateKey);

    useEffect(() => {
        const check = () => {
            setTokenStatus(deriveTokenStatus());
            setKeyLoaded(hasPrivateKey());
        };

        // On page load, sync with worker session
        // This restores active state after refresh if session cookie + KV still valid
        syncAuthStatus(
            () => setTokenStatus("active"),
            () => setTokenStatus(deriveTokenStatus())
        );

        window.addEventListener("focus", check);
        window.addEventListener("rm-auth-changed", check);
        return () => {
            window.removeEventListener("focus", check);
            window.removeEventListener("rm-auth-changed", check);
        };
    }, []);

    const handleClearToken = () => {
        clearTokenExpiry();
        setTokenStatus("missing");
    };
    const handleLoadKey = (key: string) => {
        storePrivateKey(key);
        setKeyLoaded(true);
    };
    const handleClearKey = () => {
        clearPrivateKey();
        setKeyLoaded(false);
    };

    const initialHeaders = isOAuth
        ? { Authorization: "Basic base64(clientId:clientSecret)" }
        : {};
    const [headers, setHeaders] = useState<Record<string, string>>(initialHeaders);
    const [jsonBody, setJsonBody] = useState(
        typeof props.body === "string"
            ? props.body
            : props.body?.type === "json"
                ? (props.body as any).example ?? "{}"
                : "{}"
    );

    const generateNonce = () => crypto.randomUUID().replace(/-/g, "");
    const generateTimestamp = () => Math.floor(Date.now() / 1000).toString();

    const derLen = (n: number): number[] => {
        if (n < 0x80) return [n];
        if (n < 0x100) return [0x81, n];
        return [0x82, (n >> 8) & 0xff, n & 0xff];
    };

    const importPrivateKey = async (pem: string): Promise<CryptoKey> => {
        const isPkcs1 = pem.includes("BEGIN RSA PRIVATE KEY");
        const cleaned = pem
            .replace(/-----BEGIN[^-]*-----/, "")
            .replace(/-----END[^-]*-----/, "")
            .replace(/\s/g, "");
        const pkcs1 = Uint8Array.from(window.atob(cleaned), (c) => c.charCodeAt(0));
        let der: Uint8Array;
        if (isPkcs1) {
            const algoId = new Uint8Array([
                0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86,
                0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00,
            ]);
            const octetString = new Uint8Array([0x04, ...derLen(pkcs1.length), ...pkcs1]);
            const version = new Uint8Array([0x02, 0x01, 0x00]);
            const inner = new Uint8Array([...version, ...algoId, ...octetString]);
            der = new Uint8Array([0x30, ...derLen(inner.length), ...inner]);
        } else {
            der = pkcs1;
        }
        return await crypto.subtle.importKey(
            "pkcs8",
            der.buffer as ArrayBuffer,
            { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
            false,
            ["sign"]
        );
    };

    const signRSA = async (
        privateKeyPem: string,
        method: string,
        fullUrl: string,
        body: any
    ) => {
        const nonce = generateNonce();
        const timestamp = generateTimestamp();
        let base64Data = "";
        if (body && Object.keys(body).length > 0) {
            base64Data = btoa(JSON.stringify(sortObject(body)));
        }
        let plainText = "";
        if (base64Data) plainText += `data=${base64Data}&`;
        plainText +=
            `method=${method.toLowerCase()}` +
            `&nonceStr=${nonce}` +
            `&requestUrl=${fullUrl}` +
            `&signType=sha256` +
            `&timestamp=${timestamp}`;
        const key = await importPrivateKey(privateKeyPem);
        const signatureBuffer = await crypto.subtle.sign(
            "RSASSA-PKCS1-v1_5",
            key,
            new TextEncoder().encode(plainText)
        );
        const signature = btoa(
            String.fromCharCode(...new Uint8Array(signatureBuffer))
        );
        return { signature, nonce, timestamp };
    };

    const send = async () => {
        let missedSignature = false;
        let missedToken = false;

        let requestBody: any;
        if (!["GET", "DELETE"].includes(props.method)) {
            requestBody = JSON.parse(jsonBody || "{}");
        }

        const finalHeaders: Record<string, string> = { ...headers };
        if (requestBody !== undefined) {
            finalHeaders["Content-Type"] = "application/json";
        }

        if (!isOAuth) {
            if (requiresAccessToken && tokenStatus !== "active") {
                missedToken = true;
            }
            if (requiresSignature && !props.useServerSigning) {
                if (hasPrivateKey()) {
                    const { signature, nonce, timestamp } = await signRSA(
                        getPrivateKey(),
                        props.method,
                        resolvedUrl,
                        requestBody
                    );
                    finalHeaders["X-Timestamp"] = timestamp;
                    finalHeaders["X-Nonce-Str"] = nonce;
                    finalHeaders["X-Signature"] = `sha256 ${signature}`;
                } else {
                    missedSignature = true;
                }
            }

            if (requiresSignature && props.useServerSigning) {
                const signRes = await fetch(
                    "https://rm-api-proxy.aiman-danish.workers.dev/auth/sign",
                    {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            method: props.method,
                            url: resolvedUrl,
                            body: requestBody,
                        }),
                    }
                );
                const signData = await signRes.json();
                finalHeaders["X-Timestamp"] = signData.timestamp;
                finalHeaders["X-Nonce-Str"] = signData.nonceStr;
                finalHeaders["X-Signature"] = signData.signature;
            }
        }

        const res = await fetch(
            "https://rm-api-proxy.aiman-danish.workers.dev",
            {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: resolvedUrl,
                    method: props.method,
                    headers: finalHeaders,
                    body: requestBody,
                }),
            }
        );

        const text = await res.text();
        let parsed: any;
        try {
            parsed = JSON.parse(text);
        } catch {
            parsed = text;
        }

        if (
            isOAuth &&
            res.ok &&
            parsed?.success &&
            typeof parsed.expiresIn === "number"
        ) {
            setTokenExpiry(parsed.expiresIn);
            setTokenStatus("active");
        }

        return { response: parsed, status: res.status, missedSignature, missedToken };
    };

    const notReady =
        (requiresAccessToken && tokenStatus !== "active") ||
        (requiresSignature && !props.useServerSigning && !keyLoaded) ||
        (requiresSignature && props.useServerSigning && tokenStatus !== "active");

    return {
        baseUrl, resolvedUrl,
        params, setParams, paramKeys,
        tokenStatus, keyLoaded,
        handleClearToken, handleLoadKey, handleClearKey,
        headers, setHeaders, jsonBody, setJsonBody,
        isOAuth, requiresSignature, requiresAccessToken, notReady,
        method: props.method,
        send,
    };
}