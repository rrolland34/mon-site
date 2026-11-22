const jobs = new WeakMap();
const queues = new WeakMap();
const getMathJax = () => globalThis.window?.MathJax ?? globalThis.MathJax;

async function bounded(promise, timeoutMs) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise(resolve => { timer = setTimeout(() => resolve(false), timeoutMs); })
    ]);
  } finally { clearTimeout(timer); }
}

// MathJax 3 retries on the shared startup.document. Only its real completion
// (including cleanup), never a caller's timeout, releases the next render.
function enqueue(mathJax, job, timeoutMs) {
  let queue = queues.get(mathJax);
  const idle = !queue;
  if (idle) queues.set(mathJax, queue = new Set());

  return new Promise(resolve => {
    const finish = value => {
      clearTimeout(timer);
      job.cancelWaiting = null;
      resolve(value);
    };
    const run = async () => {
      job.cancelWaiting = null;
      try {
        if (job.cancelled || job.targets.some(target => target.isConnected === false)) {
          finish(false);
          return;
        }
        job.mathJax = mathJax;
        await mathJax.typesetPromise(job.targets);
        finish(!job.cancelled);
      } catch (error) {
        console.warn('MathJax : échec de composition de la correction.', error);
        finish(false);
      } finally {
        if (job.cancelled && job.mathJax) clearTargets(job);
        const next = queue.values().next().value;
        if (next) {
          queue.delete(next);
          next();
        } else queues.delete(mathJax);
      }
    };
    job.cancelWaiting = () => {
      queue.delete(run);
      finish(false);
    };
    const timer = setTimeout(() => {
      if (job.cancelWaiting) job.cancelWaiting();
      else finish(false); // The engine still owns the document until finally.
    }, timeoutMs);
    if (idle) run();
    else queue.add(run);
  });
}

// One job per DOM target. Call clearMath before replacing its content.
export function renderMath(container, { targets = [container], timeoutMs = 3000 } = {}) {
  if (jobs.has(container)) return jobs.get(container).promise;
  const job = { targets, cancelled: false, mathJax: null };
  jobs.set(container, job);
  job.promise = (async () => {
    try {
      let mathJax = getMathJax();
      if (!mathJax?.typesetPromise && !mathJax?.startup?.promise) {
        const script = globalThis.document?.getElementById?.('MathJax-script');
        if (script?.addEventListener && script?.src) {
          let loaded, failed;
          try {
            await bounded(new Promise(resolve => {
              loaded = () => resolve(true);
              failed = () => resolve(false);
              script.addEventListener('load', loaded, { once: true });
              script.addEventListener('error', failed, { once: true });
            }), timeoutMs);
          } finally {
            script.removeEventListener('load', loaded);
            script.removeEventListener('error', failed);
          }
          mathJax = getMathJax();
        }
      }
      if (mathJax?.startup?.promise) {
        if (await bounded(Promise.resolve(mathJax.startup.promise).then(() => true), timeoutMs) === false) return false;
      }
      if (job.cancelled || typeof mathJax?.typesetPromise !== 'function') return false;
      return await enqueue(mathJax, job, timeoutMs);
    } catch (error) {
      console.warn('MathJax : échec de composition de la correction.', error);
      return false;
    }
  })();
  return job.promise;
}

function clearTargets(job) {
  try { (job.mathJax ?? getMathJax())?.typesetClear?.(job.targets); }
  catch (error) { console.warn('MathJax : échec du nettoyage de la correction.', error); }
}

export function clearMath(container) {
  const job = jobs.get(container);
  if (!job) return;
  job.cancelled = true;
  job.cancelWaiting?.();
  if (job.mathJax) clearTargets(job);
  jobs.delete(container);
}
