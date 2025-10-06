interface ImportMetaEnv {
    readonly BACKEND: string;
    readonly PUBLIC_BACKEND_PATH: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}