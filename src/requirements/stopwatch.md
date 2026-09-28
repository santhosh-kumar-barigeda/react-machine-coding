# React Machine Coding — Stopwatch Component

Build a reusable **Stopwatch component** in React.

### Requirements

Create a `<Stopwatch />` component with the following functionality:

1. Display elapsed time in the format:

   ```text
   HH:MM:SS.mmm
   ```

   Example:

   ```text
   00:02:37.452
   ```

2. Provide the following controls:

   - **Start**
   - **Pause**
   - **Resume**
   - **Reset**
   - **Lap**

3. **Start** should begin counting from `00:00:00.000`.

4. **Pause** should stop the elapsed time without resetting it.

5. **Resume** should continue from the paused time.

6. **Reset** should:

   - Stop the stopwatch.
   - Reset elapsed time to zero.
   - Clear all recorded laps.

7. **Lap** should:

   - Record the current elapsed time.
   - Add it to a lap list.
   - Not stop or pause the stopwatch.

8. Display recorded laps in a list:

   ```text
   Lap 1     00:00:12.450
   Lap 2     00:00:25.721
   Lap 3     00:00:41.102
   ```

9. Each lap should also display the **lap duration**, not just the total elapsed time:

   ```text
   Lap 1   Total: 00:00:12.450   Lap: 00:00:12.450
   Lap 2   Total: 00:00:25.721   Lap: 00:00:13.271
   Lap 3   Total: 00:00:41.102   Lap: 00:00:15.381
   ```

10. The stopwatch must remain accurate even if the browser tab is inactive or throttled. Do **not** increment elapsed time using:

    ```ts
    elapsed += 10
    ```

    Instead, calculate elapsed time from timestamps such as:

    ```ts
    Date.now()
    ```

11. Use `requestAnimationFrame` to update the displayed time smoothly while the stopwatch is running.

12. Avoid unnecessary React re-renders or creating multiple animation loops.

13. Starting an already-running stopwatch must not create another timer/animation loop.

14. Pausing must correctly cancel the active animation frame.

15. Resetting must correctly clean up any active animation frame.

16. Handle the following state transitions correctly:

    ```text
    Start → Pause → Resume → Pause
    Start → Reset
    Start → Lap → Lap → Pause
    Start → Lap → Reset
    Pause → Resume
    Reset → Start
    ```

17. Disable controls when they are not applicable. For example:

    - `Start` disabled while running.
    - `Pause` disabled while paused/stopped.
    - `Resume` disabled while running.
    - `Lap` disabled when the stopwatch has not started.

18. Provide keyboard-accessible buttons using native `<button>` elements.

19. Support an optional `autoStart` prop:

    ```tsx
    <Stopwatch autoStart />
    ```

20. Support an optional `onLap` callback:

    ```tsx
    <Stopwatch
      onLap={(lap) => {
        console.log(lap)
      }}
    />
    ```

21. A lap should contain enough information to represent:

    ```ts
    interface Lap {
      id: number
      totalTime: number
      lapTime: number
    }
    ```

22. Do not use a third-party stopwatch/timer library. Use **React, React Hooks, `requestAnimationFrame`, and browser APIs** only.

### Expected Usage

```tsx
<Stopwatch
  autoStart={false}
  onLap={(lap) => {
    console.log('New lap:', lap)
  }}
/>
```

### Constraints

- Use functional components and React Hooks.
- Use `useRef` for timer/animation-frame IDs and timestamps where appropriate.
- Use `requestAnimationFrame` for display updates.
- Use timestamps to calculate elapsed time rather than incrementing elapsed time on every frame.
- Clean up `requestAnimationFrame` when the component unmounts.
- Do not create multiple animation loops.
- Lap calculations must remain correct after pause/resume cycles.
- Keep the component self-contained and reusable.
- Do not use external timer or stopwatch libraries.
