function connectionError(error) {
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
    return new Error('Campus took too long to respond. Please try again.');
  }
  return new Error('Could not reach campus. Check your connection and try again.');
}

function responseError(status) {
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status === 403) return 'Campus access was blocked. Refresh this page and try again.';
  if (status >= 500) {
    return 'Campus is temporarily unavailable. Please try again in a moment.';
  }
  return 'Campus could not complete that request. Refresh this page and try again.';
}

export async function requestCampus(path, init = {}, raw = false) {
  let response;
  try {
    response = await fetch(path, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(12000),
    });
  } catch (error) {
    throw connectionError(error);
  }

  if (!response.ok) {
    let message = responseError(response.status);
    try {
      const body = await response.json();
      if (typeof body?.error === 'string' && body.error.trim()) message = body.error;
    } catch {
      // Hosting gateways may return HTML. Keep their response out of the interface.
    }
    throw Object.assign(new Error(message), { status: response.status });
  }

  if (raw) return response;
  try {
    return await response.json();
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw connectionError(error);
    }
    throw new Error('Campus returned an unexpected response. Refresh this page and try again.');
  }
}
