type Decoder = (bytes: Uint8Array) => Promise<void>;

export function createDecodeSlot() {
  const decoder = Promise.withResolvers<Decoder>();
  void decoder.promise.catch(() => {});
  let claimed = false;
  return {
    cancel: (cause: unknown) => decoder.reject(cause),
    async run(bytes: Uint8Array): Promise<void> {
      await (
        await decoder.promise
      )(bytes);
    },
    async claim<Value>(
      decode: (bytes: Uint8Array) => Promise<Value>,
      completed: Promise<void>,
    ): Promise<Value> {
      if (claimed) throw new Error("同じアセットの展開が重複しています。");
      claimed = true;
      const result = Promise.withResolvers<Value>();
      decoder.resolve(async (bytes) => {
        try {
          result.resolve(await decode(bytes));
        } catch (cause) {
          result.reject(cause);
          throw cause;
        }
      });
      const [, value] = await Promise.all([completed, result.promise]);
      return value;
    },
  };
}
