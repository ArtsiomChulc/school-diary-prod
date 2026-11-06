// Firestore may keep requests pending while offline. Keep screens recoverable.
export async function firestoreRequest<T>(
  request: Promise<T>,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new Error(
                "Не удалось загрузить данные. Проверьте подключение и повторите попытку.",
              ),
            ),
          15000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}
