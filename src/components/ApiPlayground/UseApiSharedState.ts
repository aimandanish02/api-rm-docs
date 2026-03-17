import { useState, useMemo, useEffect, useRef } from "react";
import {
    deriveTokenStatus,
    setTokenExpiry,
    clearTokenExpiry,
} from "../../utils/auth";
import {
    getPrivateKey,
    setPrivateKey as storePrivateKey,
    hasPrivateKey,
    clearPrivateKey,
} from "../../utils/privateKey";

export type TokenStatus = "missing" | "expired" | "active";
export type UrlConfig = string | { sandbox: string; prod: string };

export type PlaygroundProps = {
    method: string;
    title?: string;
    url?: UrlConfig;
    body?: string | { type: "json"; example?: string };
    requiresSignature?: boolean;
    requiresAccessToken?: boolean;
    exampleRequest?: string;
};

export type SharedState = {
    env: "sandbox" | "prod";
    setEnv: (env: "sandbox" | "prod") => void;
    hasEnv: boolean;
    baseUrl: string;
    sandboxUrl: string;
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

    const hasEnv = typeof props.url !== "string";
    const [env, setEnv] = useState<"sandbox" | "prod">("sandbox");
    const baseUrl =
        typeof props.url === "string" ? props.url : (props.url as any)?.[env] ?? "";
    const sandboxUrl =
        typeof props.url === "string"
            ? props.url
            : (props.url as any)?.sandbox ?? "";

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

    const prevEnvRef = useRef<"sandbox" | "prod" | null>(null);
    useEffect(() => {
        if (prevEnvRef.current === "prod" && env === "sandbox") {
            clearTokenExpiry();
        }
        prevEnvRef.current = env;
        setTokenStatus(deriveTokenStatus());
    }, [env]);

    useEffect(() => {
        const check = () => setTokenStatus(deriveTokenStatus());
        window.addEventListener("focus", check);
        return () => window.removeEventListener("focus", check);
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

    // send() returns result instead of setting state
    // so each consumer can manage its own response state
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
            if (requiresSignature) {
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

        // Auto-store token from OAuth response
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
        (requiresSignature && !keyLoaded);

    return {
        env, setEnv, hasEnv, baseUrl, sandboxUrl, resolvedUrl,
        params, setParams, paramKeys,
        tokenStatus, keyLoaded,
        handleClearToken, handleLoadKey, handleClearKey,
        headers, setHeaders, jsonBody, setJsonBody,
        isOAuth, requiresSignature, requiresAccessToken, notReady,
        method: props.method,
        send,
    };
}