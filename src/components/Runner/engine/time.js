// Real wall-clock timing, exposed to softBASIC as `time.now()`.
// Distinct from the frame loop's fixed `delta` (always 1000/60): this advances
// with real elapsed time, so it can measure how long a section of code actually
// took to run this frame.
const _sbTime = {
  timeNow() {
    return performance.now();
  },
};
