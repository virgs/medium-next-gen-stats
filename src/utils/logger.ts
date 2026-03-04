export const nextGenerationLog = (...params: unknown[]): void => {
  const now = new Date();
  const paddedSeconds = now.getSeconds().toString().padStart(2, '0');
  const paddedMilliseconds = now.getMilliseconds().toString().padStart(3, '0');
  console.log(`[Medium Next Gen Stats - ${paddedSeconds}:${paddedMilliseconds}] ${params}`);
};

