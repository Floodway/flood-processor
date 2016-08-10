export interface AsyncGroupCallback {
    (err: any, res: any): void;
}
export interface Runnable {
    (done: AsyncGroupCallback): void;
}
export declare class AsyncGroup {
    private callback;
    private runnables;
    private failed;
    private lastError;
    private breakOnError;
    constructor(callback: AsyncGroupCallback, breakOnError?: boolean);
    add(runnable: Runnable): AsyncGroup;
    run(): void;
}
